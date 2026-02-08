'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'CUSTOM'

export interface PosStatus {
    hasActiveShift: boolean
    activeShift: any | null
    hasOpenCashbox: boolean
    activeCashboxSession: any | null
    canSell: boolean
}

/**
 * Obtiene el estado actual del operador POS.
 * Verifica si tiene turno activo y si tiene caja abierta.
 */
export async function getPosStatus(userId: string): Promise<PosStatus> {
    const supabase = await createClient()

    // 1. Buscar turno activo (usando maybeSingle para evitar error si no hay ninguno)
    const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'OPEN')
        .maybeSingle()

    if (shiftError) console.warn("Aviso: Error buscando turno activo:", shiftError.message)

    // 2. Si hay turno, buscar sesión de caja activa para ese turno
    let cashboxSession = null
    if (shift) {
        const { data: session, error: sessionError } = await supabase
            .from('cashbox_sessions')
            .select('*, cashbox:cashboxes(*)')
            .eq('shift_id', shift.id)
            .eq('status', 'OPEN')
            .maybeSingle()

        if (sessionError) console.warn("Aviso: Error buscando caja activa:", sessionError.message)
        cashboxSession = session
    }

    return {
        hasActiveShift: !!shift,
        activeShift: shift,
        hasOpenCashbox: !!cashboxSession,
        activeCashboxSession: cashboxSession,
        canSell: !!shift && !!cashboxSession
    }
}


/**
 * Inicia un nuevo turno de trabajo basado en una definición configurada.
 * Valida que no exista uno previo.
 */
export async function startShift(shiftDefinitionId: string) {
    const supabase = await createClient()

    // Obtener el usuario de la sesión para seguridad
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")
    const userId = user.id

    // Obtener restaurant_id del perfil de forma segura
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', userId)
        .maybeSingle()

    if (profileError) {
        console.error("Error fetching profile:", profileError)
        throw new Error("Error al obtener perfil del usuario: " + profileError.message)
    }

    if (!profile?.restaurant_id) {
        throw new Error("El usuario no tiene un restaurante asignado en su perfil.")
    }

    // Validar si ya existe un turno abierto (usando maybeSingle)
    const { data: existing, error: existingError } = await supabase
        .from('shifts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'OPEN')
        .maybeSingle()

    if (existingError) {
        console.error("Error checking existing shift:", existingError)
    }

    if (existing) {
        throw new Error("Ya tienes un turno activo. Debes cerrarlo antes de iniciar otro.")
    }

    // Obtener info de la definición del turno
    const { data: def, error: defError } = await supabase
        .from('shift_definitions')
        .select('name')
        .eq('id', shiftDefinitionId)
        .maybeSingle()

    if (defError || !def) {
        throw new Error("Turno no válido, desactivado o eliminado de la configuración.")
    }

    const { data, error } = await supabase
        .from('shifts')
        .insert({
            user_id: userId,
            restaurant_id: profile.restaurant_id,
            shift_type: def.name,
            shift_definition_id: shiftDefinitionId,
            status: 'OPEN',
            started_at: new Date().toISOString()
        })
        .select()
        .maybeSingle()

    if (error) {
        console.error("Error creating shift insertion:", error)
        throw new Error("Base de Datos: " + (error.message || "Error desconocido al insertar jornada"))
    }

    revalidatePath('/admin/cashier')
    revalidatePath('/admin')
    return data
}

/**
 * Abre una caja para comenzar a operar.
 * Requiere turno activo. Validación estricta de concurrencia.
 */
export async function openCashbox(
    userId: string,
    shiftId: string,
    openingAmount: number,
    notes?: string
) {
    const supabase = await createClient()

    // 1. Validar que el turno pertenezca al usuario y esté abierto
    const { data: shift } = await supabase
        .from('shifts')
        .select('status')
        .eq('id', shiftId)
        .eq('user_id', userId)
        .single()

    if (!shift || shift.status !== 'OPEN') {
        throw new Error("Turno inválido o cerrado.")
    }

    // 2. Buscar caja disponible (Por ahora asignamos la 'Caja Principal' por defecto)
    // En el futuro esto podría venir de un selector si hay múltiples cajas
    const { data: cashbox } = await supabase
        .from('cashboxes')
        .select('id, current_status')
        .eq('name', 'Caja Principal')
        .single()

    if (!cashbox) throw new Error("No se encontró la Caja Principal configurada.")

    if (cashbox.current_status === 'OPEN') {
        throw new Error("La Caja Principal ya está abierta por otro usuario.")
    }

    // 3. Crear la sesión de caja
    const { data: session, error } = await supabase
        .from('cashbox_sessions')
        .insert({
            cashbox_id: cashbox.id,
            shift_id: shiftId,
            user_id: userId,
            opening_amount: openingAmount,
            opening_notes: notes,
            status: 'OPEN',
            opening_time: new Date().toISOString()
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    // 4. Registrar el movimiento inicial de dinero (Saldo Inicial)
    await supabase.from('cash_movements').insert({
        cashbox_session_id: session.id,
        user_id: userId,
        movement_type: 'OPENING',
        amount: openingAmount,
        description: 'Saldo inicial de apertura'
    })

    revalidatePath('/admin')
    return session
}

/**
 * Cierra la sesión de caja actual y el turno asociado.
 */
export async function closeCashbox(
    sessionId: string,
    userId: string,
    closingAmount: number,
    notes?: string
) {
    const supabase = await createClient()

    // 1. Obtener la sesión y sus movimientos para calcular el balance teórico
    const { data: sessionData, error: sessionError } = await supabase
        .from('cashbox_sessions')
        .select('*, cash_movements(*)')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single()

    if (sessionError || !sessionData) {
        throw new Error("No se encontró la sesión de caja activa.")
    }

    // Calcular el saldo teórico basado en movimientos
    const movements = sessionData.cash_movements || []
    const systemAmount = movements.reduce((acc: number, m: any) => {
        if (['OPENING', 'SALE', 'DEPOSIT'].includes(m.movement_type)) {
            return acc + Number(m.amount)
        } else if (['WITHDRAWAL', 'REFUND'].includes(m.movement_type)) {
            return acc - Number(m.amount)
        }
        return acc
    }, 0)

    // 2. Cerrar la sesión de caja
    const { error: closeError } = await supabase
        .from('cashbox_sessions')
        .update({
            status: 'CLOSED',
            closing_amount: closingAmount,
            system_amount: systemAmount,
            closing_notes: notes,
            closing_time: new Date().toISOString()
        })
        .eq('id', sessionId)

    if (closeError) throw new Error("Error al cerrar la sesión de caja: " + closeError.message)

    // 3. Cerrar automáticamente el turno asociado
    await supabase
        .from('shifts')
        .update({
            status: 'CLOSED',
            ended_at: new Date().toISOString()
        })
        .eq('id', sessionData.shift_id)

    revalidatePath('/admin/cashier')
    revalidatePath('/admin')

    return { success: true, systemAmount, difference: closingAmount - systemAmount }
}

/**
 * Realiza un arqueo parcial (conteo físico) sin cerrar la caja.
 */
export async function performPartialAudit(
    sessionId: string,
    userId: string,
    countedAmount: number,
    notes?: string
) {
    const supabase = await createClient()

    // 1. Calcular el saldo teórico actual
    const { data: movements, error: movesError } = await supabase
        .from('cash_movements')
        .select('amount, movement_type')
        .eq('cashbox_session_id', sessionId)

    if (movesError) throw new Error("Error al obtener movimientos: " + movesError.message)

    const systemAmount = (movements || []).reduce((acc: number, m: any) => {
        if (['OPENING', 'SALE', 'DEPOSIT'].includes(m.movement_type)) {
            return acc + Number(m.amount)
        } else if (['WITHDRAWAL', 'REFUND'].includes(m.movement_type)) {
            return acc - Number(m.amount)
        }
        return acc
    }, 0)

    // 2. Registrar el arqueo
    const { data, error } = await supabase
        .from('cashbox_audits')
        .insert({
            cashbox_session_id: sessionId,
            user_id: userId,
            counted_amount: countedAmount,
            system_amount: systemAmount,
            notes: notes
        })
        .select()
        .single()

    if (error) throw new Error("Error al registrar arqueo: " + error.message)

    return { ...data, difference: countedAmount - systemAmount }
}

/**
 * Procesa el pago de una orden existente de forma atómica.
 */
export async function processOrderPayment(
    orderId: string,
    userId: string,
    paymentMethod: 'cash' | 'card' | 'transfer',
    amount: number
) {
    const supabase = await createClient()

    // 1. Obtener estado POS para asegurar que hay caja abierta (si es efectivo)
    const posStatus = await getPosStatus(userId)

    if (paymentMethod === 'cash' && !posStatus.hasOpenCashbox) {
        throw new Error("No hay caja abierta. Debes abrir caja para recibir efectivo.")
    }

    const sessionId = posStatus.activeCashboxSession?.id || null

    // 2. Ejecutar RPC
    const { data, error } = await supabase.rpc('pay_order_atomic', {
        p_order_id: orderId,
        p_user_id: userId,
        p_cashbox_session_id: sessionId,
        p_payment_method: paymentMethod,
        p_amount: amount
    })

    if (error) {
        console.error("Error paying order:", error)
        throw new Error(error.message)
    }

    revalidatePath('/admin/orders')
    revalidatePath('/admin/cashier')
    revalidatePath('/admin/tables')
    return data
}

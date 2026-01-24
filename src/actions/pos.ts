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

    // 1. Buscar turno activo
    const { data: shift } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'OPEN')
        .single()

    // 2. Si hay turno, buscar sesión de caja activa para ese turno
    let cashboxSession = null
    if (shift) {
        const { data: session } = await supabase
            .from('cashbox_sessions')
            .select('*, cashbox:cashboxes(*)')
            .eq('shift_id', shift.id)
            .eq('status', 'OPEN')
            .single()
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
 * Inicia un nuevo turno de trabajo.
 * Valida que no exista uno previo.
 */
export async function startShift(userId: string, shiftType: ShiftType) {
    const supabase = await createClient()

    // Validar si ya existe
    const { data: existing } = await supabase
        .from('shifts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'OPEN')
        .single()

    if (existing) {
        throw new Error("Ya tienes un turno activo. Debes cerrarlo antes de iniciar otro.")
    }

    const { data, error } = await supabase
        .from('shifts')
        .insert({
            user_id: userId,
            shift_type: shiftType,
            status: 'OPEN',
            started_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    revalidatePath('/admin') // Refrescar UI si es necesario
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
 * Cierra la sesión de caja actual.
 */
export async function closeCashbox(
    sessionId: string,
    userId: string,
    closingAmount: number,
    notes?: string
) {
    const supabase = await createClient()

    // 1. Obtener totales del sistema para comparar
    // Aquí deberíamos sumar todas las ventas en efectivo
    // Por simplicidad inicial simulamos el cálculo, luego conectaremos con pos_sales
    const systemAmount = 0 // TODO: Calcular real desde pos_sales + cash_movements

    const { data, error } = await supabase
        .from('cashbox_sessions')
        .update({
            status: 'CLOSED',
            closing_amount: closingAmount,
            system_amount: systemAmount, // Se guardará automáticamente la diferencia
            closing_notes: notes,
            closing_time: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId) // Seguridad extra
        .select()
        .single()

    if (error) throw new Error(error.message)

    revalidatePath('/admin')
    return data
}

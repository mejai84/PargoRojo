/**
 * ACCIONES OPTIMIZADAS PARA VENTAS - PARGO ROJO POS
 * 
 * Implementa flujos críticos optimizados usando transacciones atómicas
 * y validaciones preventivas según mejores prácticas de sistemas POS profesionales.
 * 
 * Fecha: 27 de enero de 2026
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface SaleItem {
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface CompleteSaleData {
    restaurant_id: string;
    user_id: string;
    cashbox_session_id: string;
    items: SaleItem[];
    payment_method: 'cash' | 'card' | 'transfer' | 'mixed';
    subtotal: number;
    tax?: number;
    total: number;
    customer_id?: string;
    table_id?: string;
    notes?: string;
}

export interface CancelSaleData {
    order_id: string;
    user_id: string;
    approver_id?: string;
    reason: string;
}

export interface StockValidation {
    available: boolean;
    reason?: string;
    stock_available?: number;
    requested?: number;
    product_name?: string;
}

// ============================================================================
// 1. VALIDACIÓN PREVENTIVA DE STOCK
// ============================================================================

/**
 * Valida que haya stock disponible ANTES de agregar al carrito
 * Previene errores de venta con stock insuficiente
 */
export async function validateProductStock(
    productId: string,
    quantity: number,
    restaurantId: string
): Promise<StockValidation> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .rpc('validate_stock_availability', {
                p_product_id: productId,
                p_quantity: quantity,
                p_restaurant_id: restaurantId
            })

        if (error) {
            console.error('Error validating stock:', error)
            return {
                available: false,
                reason: 'Error al validar stock'
            }
        }

        return data as StockValidation

    } catch (error: any) {
        console.error('Exception validating stock:', error)
        return {
            available: false,
            reason: error.message || 'Error desconocido'
        }
    }
}

/**
 * Valida stock para múltiples productos de una vez
 */
export async function validateCartStock(
    items: SaleItem[],
    restaurantId: string
): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    for (const item of items) {
        const validation = await validateProductStock(
            item.product_id,
            item.quantity,
            restaurantId
        )

        if (!validation.available) {
            errors.push(
                `${validation.product_name || 'Producto'}: ${validation.reason}`
            )
        }
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

// ============================================================================
// 2. VENTA COMPLETA ATÓMICA
// ============================================================================

/**
 * Procesa una venta completa de forma atómica
 * TODO o NADA: orden, items, pago, stock, caja, auditoría
 * 
 * @throws Error si falla cualquier paso (rollback automático)
 */
export async function completeSaleAtomic(saleData: CompleteSaleData) {
    const supabase = await createClient()

    try {
        // 1. VALIDACIÓN PREVIA: Stock disponible
        const stockValidation = await validateCartStock(
            saleData.items,
            saleData.restaurant_id
        )

        if (!stockValidation.valid) {
            throw new Error(
                'Stock insuficiente:\n' + stockValidation.errors.join('\n')
            )
        }

        // 2. EJECUTAR TRANSACCIÓN ATÓMICA
        const { data, error } = await supabase
            .rpc('complete_sale_atomic', {
                p_restaurant_id: saleData.restaurant_id,
                p_user_id: saleData.user_id,
                p_cashbox_session_id: saleData.cashbox_session_id,
                p_items: JSON.stringify(saleData.items),
                p_payment_method: saleData.payment_method,
                p_subtotal: saleData.subtotal,
                p_tax: saleData.tax || 0,
                p_total: saleData.total,
                p_customer_id: saleData.customer_id || null,
                p_table_id: saleData.table_id || null,
                p_notes: saleData.notes || null
            })

        if (error) {
            console.error('Error en venta atómica:', error)
            throw new Error(error.message || 'Error al procesar la venta')
        }

        // 3. REVALIDAR RUTAS
        revalidatePath('/admin/cashier')
        revalidatePath('/admin/orders')
        revalidatePath('/admin/dashboard')

        return {
            success: true,
            data: data,
            message: 'Venta procesada exitosamente'
        }

    } catch (error: any) {
        console.error('Exception en venta atómica:', error)
        throw new Error(error.message || 'Error al procesar la venta')
    }
}

// ============================================================================
// 3. ANULACIÓN ATÓMICA CON AUDITORÍA
// ============================================================================

/**
 * Anula una venta de forma atómica con validaciones de seguridad
 * Revierte: orden, stock, pagos, caja y registra auditoría completa
 * 
 * Reglas:
 * - Después de 30 minutos requiere autorización de supervisor
 * - No se puede anular si la caja ya está cerrada (validación en DB)
 * - Registra quién solicitó y quién autorizó
 * 
 * @throws Error si no cumple validaciones o falla la reversión
 */
export async function cancelSaleAtomic(cancelData: CancelSaleData) {
    const supabase = await createClient()

    try {
        // EJECUTAR REVERSIÓN ATÓMICA
        const { data, error } = await supabase
            .rpc('revert_sale_atomic', {
                p_order_id: cancelData.order_id,
                p_user_id: cancelData.user_id,
                p_approver_id: cancelData.approver_id || null,
                p_reason: cancelData.reason
            })

        if (error) {
            console.error('Error al anular venta:', error)
            throw new Error(error.message || 'Error al anular la venta')
        }

        // REVALIDAR RUTAS
        revalidatePath('/admin/cashier')
        revalidatePath('/admin/orders')
        revalidatePath('/admin/dashboard')
        revalidatePath('/admin/audit')

        return {
            success: true,
            data: data,
            message: 'Venta anulada exitosamente'
        }

    } catch (error: any) {
        console.error('Exception al anular venta:', error)
        throw new Error(error.message || 'Error al anular la venta')
    }
}

// ============================================================================
// 4. VALIDACIÓN DE ESTADO DE CAJA
// ============================================================================

/**
 * Verifica que la caja esté abierta antes de permitir ventas
 */
export async function validateCashboxOpen(sessionId: string): Promise<boolean> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('cashbox_sessions')
            .select('status')
            .eq('id', sessionId)
            .single()

        if (error || !data) return false

        return data.status === 'OPEN'

    } catch (error) {
        return false
    }
}

// ============================================================================
// 5. OBTENER CONTEXTO DE APERTURA (para optimización de UX)
// ============================================================================

export interface OpeningContext {
    lastClosingAmount: number;
    lastDifference: number;
    averageOpening: number;
    suggestedAmount: number;
}

/**
 * Obtiene contexto histórico para ayudar al cajero en la apertura
 */
export async function getOpeningContext(
    userId: string,
    restaurantId: string
): Promise<OpeningContext | null> {
    const supabase = await createClient()

    try {
        // Obtener últimas 7 sesiones del usuario
        const { data: sessions, error } = await supabase
            .from('cashbox_sessions')
            .select('opening_amount, closing_amount, system_amount')
            .eq('user_id', userId)
            .eq('restaurant_id', restaurantId)
            .eq('status', 'CLOSED')
            .order('created_at', { ascending: false })
            .limit(7)

        if (error || !sessions || sessions.length === 0) {
            return null
        }

        const lastSession = sessions[0]
        const avgOpening = sessions.reduce(
            (sum, s) => sum + Number(s.opening_amount), 0
        ) / sessions.length

        return {
            lastClosingAmount: Number(lastSession.closing_amount || 0),
            lastDifference: Number(lastSession.closing_amount || 0) - Number(lastSession.system_amount || 0),
            averageOpening: Math.round(avgOpening),
            suggestedAmount: Math.round(avgOpening) // Podría mejorarse con IA
        }

    } catch (error) {
        console.error('Error getting opening context:', error)
        return null
    }
}

// ============================================================================
// 6. VALIDACIONES DE NEGOCIO CONFIGURABLES
// ============================================================================

export interface CashboxValidations {
    minimumOpening: number;
    maximumOpening: number;
    requiresAuthAbove: number;
}

/**
 * Valida monto de apertura según reglas de negocio
 */
export function validateOpeningAmount(
    amount: number,
    validations: CashboxValidations = {
        minimumOpening: 50000,    // $50,000 COP
        maximumOpening: 5000000,  // $5,000,000 COP
        requiresAuthAbove: 2000000 // $2,000,000 COP
    }
): { valid: boolean; error?: string; requiresAuth: boolean } {
    if (amount < validations.minimumOpening) {
        return {
            valid: false,
            error: `El monto mínimo es $${validations.minimumOpening.toLocaleString()}`,
            requiresAuth: false
        }
    }

    if (amount > validations.maximumOpening) {
        return {
            valid: false,
            error: `El monto máximo es $${validations.maximumOpening.toLocaleString()}`,
            requiresAuth: false
        }
    }

    const requiresAuth = amount > validations.requiresAuthAbove

    return {
        valid: true,
        requiresAuth,
        error: requiresAuth 
            ? `Monto superior a $${validations.requiresAuthAbove.toLocaleString()}, requiere autorización`
            : undefined
    }
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

export {
    type SaleItem,
    type CompleteSaleData,
    type CancelSaleData,
    type StockValidation,
    type OpeningContext,
    type CashboxValidations
}

/**
 * ACCIONES PARA GESTIÓN DE PEDIDOS - CORRECCIONES DE PRODUCCIÓN
 * 
 * Implementa funcionalidades corregidas según bugs reportados:
 * - Transferencia de pedidos entre mesas
 * - Agregar observaciones a productos
 * - Guardar comprobantes
 * - Auditoría completa
 * 
 * Fecha: 27 de enero de 2026
 * Versión: Single Tenant (Sin restaurant_id)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Pool } from 'pg'

// Configuración de conexión directa a BD (Bypass RLS)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Necesario para Supabase en producción
})

// ============================================================================
// TIPOS
// ============================================================================

export interface OrderItemWithNotes {
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    notes?: string; // ✅ Observaciones del cliente
}

export interface CreateOrderData {
    restaurant_id: string; // ✅ Re-habilitado para multi-tenancy
    user_id: string;
    waiter_id: string; // ✅ Obligatorio para auditoría
    table_id?: string;
    customer_id?: string;
    items: OrderItemWithNotes[];
    subtotal: number;
    tax?: number;
    total: number;
    notes?: string;
}

export interface TransferOrderData {
    order_id: string;
    target_table_id: string;
    user_id: string;
    reason?: string;
}

export interface Receipt {
    order_id: string;
    customer_name?: string;
    customer_tax_id?: string;
    generate_pdf?: boolean;
}

// ============================================================================
// 1. CREAR PEDIDO CON OBSERVACIONES Y MESERO
// ============================================================================

/**
 * Crea un nuevo pedido con observaciones por producto y registro del mesero
 */
export async function createOrderWithNotes(orderData: CreateOrderData) {
    const supabase = await createClient()

    try {
        // INTENTO 1: USAR CONEXIÓN DIRECTA (pg) PARA BYPASS RLS
        // Esto es crucial para el modo "Kiosco" donde el usuario puede no estar autenticado en Supabase
        const client = await pool.connect()
        try {
            await client.query('BEGIN')

            // 1. Insertar Orden
            const insertOrderQuery = `
                INSERT INTO orders (
                    restaurant_id, user_id, waiter_id, table_id, customer_id, 
                    order_type, status, subtotal, tax, total, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `
            const orderValues = [
                orderData.restaurant_id,
                orderData.user_id,
                orderData.waiter_id,
                orderData.table_id || null,
                orderData.customer_id || null,
                orderData.table_id ? 'dine_in' : 'pos',
                'pending',
                orderData.subtotal,
                orderData.tax || 0,
                orderData.total,
                orderData.notes || null
            ]

            const { rows: orderRows } = await client.query(insertOrderQuery, orderValues)
            const order = orderRows[0]

            // 2. Insertar Items
            if (orderData.items.length > 0) {
                const insertItemsQuery = `
                    INSERT INTO order_items (
                        order_id, product_id, quantity, unit_price, subtotal, notes
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `

                for (const item of orderData.items) {
                    await client.query(insertItemsQuery, [
                        order.id,
                        item.product_id,
                        item.quantity,
                        item.unit_price,
                        item.subtotal,
                        item.notes || null
                    ])
                }
            }

            await client.query('COMMIT')

            // Revalidar paths
            revalidatePath('/admin/orders')
            revalidatePath('/admin/waiter')
            if (orderData.table_id) revalidatePath('/admin/tables')

            return { success: true, data: order, message: 'Pedido creado exitosamente (Direct DB)' }

        } catch (dbError: any) {
            await client.query('ROLLBACK')
            console.error('Error DB Directo:', dbError)
            throw new Error(dbError.message)
        } finally {
            client.release()
        }

    } catch (error: any) {
        console.error('Error creando pedido:', error)
        throw new Error(error.message || 'Error al crear el pedido')
    }
}

// ============================================================================
// 2. TRANSFERIR PEDIDO ENTRE MESAS (Bug #6 y #8)
// ============================================================================

/**
 * Transfiere un pedido de una mesa a otra
 * Si la mesa destino tiene pedido activo, SUMA los items (no reemplaza)
 */
export async function transferOrderBetweenTables(transferData: TransferOrderData) {
    const supabase = await createClient()

    try {
        // INTENTO 1: USAR CONEXIÓN DIRECTA (pg) PARA BYPASS RLS
        const client = await pool.connect()
        try {
            await client.query('BEGIN')

            // Llamar a la función RPC directamente desde SQL
            const transferQuery = `
                SELECT transfer_order_to_table($1, $2, $3, $4) as result
            `
            const transferValues = [
                transferData.order_id,
                transferData.target_table_id,
                transferData.user_id,
                transferData.reason || 'Cambio de mesa'
            ]

            const { rows } = await client.query(transferQuery, transferValues)
            const result = rows[0].result

            await client.query('COMMIT')

            revalidatePath('/admin/tables')
            revalidatePath('/admin/orders')
            revalidatePath('/admin/waiter')

            return {
                success: true,
                data: result,
                message: result.merged
                    ? 'Pedido fusionado con orden existente en mesa destino'
                    : 'Pedido transferido a nueva mesa'
            }

        } catch (dbError: any) {
            await client.query('ROLLBACK')
            console.error('Error DB Directo:', dbError)
            throw new Error(dbError.message)
        } finally {
            client.release()
        }

    } catch (error: any) {
        console.error('Exception transfiriendo pedido:', error)
        throw new Error(error.message || 'Error al transferir el pedido')
    }
}

// ============================================================================
// 3. AGREGAR OBSERVACIONES A ITEM EXISTENTE
// ============================================================================

export async function updateOrderItemNotes(
    orderItemId: string,
    notes: string,
    userId: string
) {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('order_items')
            .update({
                notes: notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderItemId)
            .select('order_id')
            .single()

        if (error) throw new Error(error.message)

        revalidatePath('/admin/orders')
        revalidatePath('/admin/kitchen')

        return {
            success: true,
            message: 'Observaciones actualizadas'
        }

    } catch (error: any) {
        console.error('Error actualizando observaciones:', error)
        throw new Error(error.message || 'Error al actualizar observaciones')
    }
}

// ============================================================================
// 4. GENERAR Y GUARDAR COMPROBANTE (Bug #2)
// ============================================================================

export async function generateReceipt(receiptData: Receipt) {
    const supabase = await createClient()

    try {
        // 1. Obtener datos de la orden
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (name)
                )
            `)
            .eq('id', receiptData.order_id)
            .single()

        if (orderError || !order) {
            throw new Error('Orden no encontrada')
        }

        // 2. Generar número de comprobante
        const { data: lastReceipt } = await supabase
            .from('receipts')
            .select('receipt_number')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        let nextNumber = 1
        if (lastReceipt) {
            const lastNumber = parseInt(lastReceipt.receipt_number.replace(/\D/g, ''))
            nextNumber = lastNumber + 1
        }

        const receiptNumber = `REC-${nextNumber.toString().padStart(8, '0')}`

        // 3. Crear comprobante
        const { data: receipt, error: receiptError } = await supabase
            .from('receipts')
            .insert({
                // restaurant_id eliminado
                order_id: order.id,
                receipt_number: receiptNumber,
                customer_name: receiptData.customer_name,
                customer_tax_id: receiptData.customer_tax_id,
                subtotal: order.subtotal,
                tax: order.tax || 0,
                total: order.total,
                payment_method: order.payment_method
            })
            .select()
            .single()

        if (receiptError) throw new Error(receiptError.message)

        revalidatePath('/admin/orders')

        return {
            success: true,
            data: receipt,
            message: `Comprobante ${receiptNumber} generado exitosamente`
        }

    } catch (error: any) {
        console.error('Error generando comprobante:', error)
        throw new Error(error.message || 'Error al generar comprobante')
    }
}

// ============================================================================
// 5. OBTENER HISTORIAL DE TRANSFERENCIAS
// ============================================================================

export async function getTransferHistory(
    filters: {
        table_id?: string;
        order_id?: string;
        limit?: number;
    }
) {
    const supabase = await createClient()

    try {
        let query = supabase
            .from('table_transfers')
            .select(`
                *,
                source_table:tables!table_transfers_source_table_id_fkey(table_name),
                target_table:tables!table_transfers_target_table_id_fkey(table_name),
                transferred_by_user:profiles(full_name)
            `)
            .order('transferred_at', { ascending: false })

        if (filters.table_id) {
            query = query.or(`source_table_id.eq.${filters.table_id},target_table_id.eq.${filters.table_id}`)
        }

        if (filters.order_id) {
            query = query.eq('order_id', filters.order_id)
        }

        if (filters.limit) {
            query = query.limit(filters.limit)
        }

        const { data, error } = await query

        if (error) {
            // Si la tabla no existe, devolver array vacío sin error
            if (error.code === '42P01') return { success: true, data: [] }
            throw new Error(error.message)
        }

        return {
            success: true,
            data: data || []
        }

    } catch (error: any) {
        console.error('Error obteniendo historial:', error)
        return {
            success: false,
            data: [],
            error: error.message
        }
    }
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

// FIN DEL ARCHIVO

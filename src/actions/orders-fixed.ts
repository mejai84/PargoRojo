/**
 * ACCIONES PARA GESTIÓN DE PEDIDOS - CORRECCIONES DE PRODUCCIÓN
 * 
 * Implementa funcionalidades corregidas:
 * - Creación de pedidos (Bypass RLS con PG directo)
 * - Transferencia de pedidos
 * - División de cuentas (Split Check)
 * - Gestión de observaciones
 * - Auditoría
 * 
 * Fecha: 27 de enero de 2026
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Pool } from 'pg'

// Configuración de conexión directa a BD (Bypass RLS & Transaction Support)
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
    notes?: string;
}

export interface CreateOrderData {
    restaurant_id: string;
    user_id: string;
    waiter_id: string;
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
// 1. CREAR PEDIDO (PG DIRECTO)
// ============================================================================

export async function createOrderWithNotes(orderData: CreateOrderData) {
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

        revalidatePath('/admin/orders')
        revalidatePath('/admin/waiter')
        if (orderData.table_id) revalidatePath('/admin/tables')

        return { success: true, data: order, message: 'Pedido creado exitosamente' }

    } catch (dbError: any) {
        await client.query('ROLLBACK')
        console.error('Error DB Directo:', dbError)
        throw new Error(dbError.message)
    } finally {
        client.release()
    }
}

// ============================================================================
// 2. TRANSFERIR PEDIDO (PG DIRECTO)
// ============================================================================

export async function transferOrderBetweenTables(transferData: TransferOrderData) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        const transferQuery = `SELECT transfer_order_to_table($1, $2, $3, $4) as result`
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
}

// ============================================================================
// 3. AGREGAR OBSERVACIONES (SUPABASE CLIENT)
// ============================================================================

export async function updateOrderItemNotes(
    orderItemId: string,
    notes: string,
    userId: string
) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('order_items')
            .update({ notes: notes, updated_at: new Date().toISOString() })
            .eq('id', orderItemId)

        if (error) throw new Error(error.message)

        revalidatePath('/admin/orders')
        revalidatePath('/admin/kitchen')
        return { success: true, message: 'Observaciones actualizadas' }
    } catch (error: any) {
        console.error('Error actualizando observaciones:', error)
        throw new Error(error.message)
    }
}

// ============================================================================
// 4. DIVIDIR CUENTA (SPLIT CHECK) - NUEVO
// ============================================================================

/**
 * Divide una orden moviendo items seleccionados a una nueva orden.
 * Útil para cobrar por separado.
 */
export async function splitOrder(
    sourceOrderId: string,
    itemsToMove: { itemId: string, quantity: number }[],
    userId: string
) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // 1. Obtener orden original
        const { rows: [sourceOrder] } = await client.query('SELECT * FROM orders WHERE id = $1', [sourceOrderId])
        if (!sourceOrder) throw new Error('Orden original no encontrada')

        // 2. Crear nueva orden (Clonada)
        const newOrderQuery = `
            INSERT INTO orders (
                restaurant_id, table_id, user_id, waiter_id, customer_id, 
                order_type, status, notes, created_at, subtotal, total, payment_status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, NOW(), 0, 0, 'pending')
            RETURNING *
        `
        const newOrderValues = [
            sourceOrder.restaurant_id,
            sourceOrder.table_id,
            userId, // Usuario que realiza el split es el nuevo 'creador' temporal
            sourceOrder.waiter_id,
            sourceOrder.customer_id,
            sourceOrder.order_type,
            `Sub-cuenta de Orden #${sourceOrder.id.substring(0, 8)}`
        ]

        const { rows: [newOrder] } = await client.query(newOrderQuery, newOrderValues)

        // 3. Mover items
        for (const item of itemsToMove) {
            const { rows: [dbItem] } = await client.query('SELECT * FROM order_items WHERE id = $1', [item.itemId])
            if (!dbItem) continue

            if (item.quantity >= dbItem.quantity) {
                // Mover item completo
                await client.query('UPDATE order_items SET order_id = $1, updated_at = NOW() WHERE id = $2', [newOrder.id, item.itemId])
            } else {
                // Dividir item
                const remainingQty = dbItem.quantity - item.quantity
                const remainingSub = remainingQty * dbItem.unit_price

                // Actualizar original
                await client.query('UPDATE order_items SET quantity = $1, subtotal = $2, updated_at = NOW() WHERE id = $3', [remainingQty, remainingSub, item.itemId])

                // Crear nuevo item en nueva orden
                await client.query(`
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, notes)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [newOrder.id, dbItem.product_id, item.quantity, dbItem.unit_price, item.quantity * dbItem.unit_price, dbItem.notes])
            }
        }

        // 4. Recalcular totales (Original)
        await client.query(`
            UPDATE orders 
            SET subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = $1),
                total = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = $1)
            WHERE id = $1
        `, [sourceOrderId])

        // 5. Recalcular totales (Nueva)
        await client.query(`
            UPDATE orders 
            SET subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = $1),
                total = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = $1)
            WHERE id = $1
        `, [newOrder.id])

        await client.query('COMMIT')

        revalidatePath('/admin/orders')
        revalidatePath('/admin/waiter')

        return {
            success: true,
            data: newOrder,
            message: 'Cuenta dividida exitosamente. Nueva orden creada.'
        }

    } catch (e: any) {
        await client.query('ROLLBACK')
        console.error('Error splitOrder:', e)
        throw new Error(e.message || 'Error al dividir la cuenta')
    } finally {
        client.release()
    }
}

// ============================================================================
// 5. GENERAR COMPROBANTE (SUPABASE CLIENT)
// ============================================================================

export async function generateReceipt(receiptData: Receipt) {
    const supabase = await createClient()

    try {
        const { data: order } = await supabase.from('orders').select('*').eq('id', receiptData.order_id).single()
        if (!order) throw new Error('Orden no encontrada')

        const { data: lastReceipt } = await supabase.from('receipts').select('receipt_number').order('created_at', { ascending: false }).limit(1).maybeSingle()

        let nextNumber = 1
        if (lastReceipt) nextNumber = parseInt(lastReceipt.receipt_number.replace(/\D/g, '')) + 1
        const receiptNumber = `REC-${nextNumber.toString().padStart(8, '0')}`

        const { data: receipt } = await supabase.from('receipts').insert({
            order_id: order.id,
            receipt_number: receiptNumber,
            customer_name: receiptData.customer_name,
            customer_tax_id: receiptData.customer_tax_id,
            subtotal: order.subtotal,
            tax: order.tax || 0,
            total: order.total,
            payment_method: order.payment_method
        }).select().single()

        revalidatePath('/admin/orders')
        return { success: true, data: receipt, message: `Comprobante ${receiptNumber} generado` }

    } catch (error: any) {
        console.error('Error recibo:', error)
        throw new Error(error.message)
    }
}

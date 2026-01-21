import { NextRequest, NextResponse } from 'next/server'
import { wompiService } from '@/lib/payments/wompi'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const signature = request.headers.get('x-signature') || ''
        const timestamp = request.headers.get('x-timestamp') || ''

        // Verify webhook signature
        const isValid = wompiService.verifyWebhookSignature(body, signature, timestamp)

        if (!isValid) {
            console.error('Invalid webhook signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const event = body.event
        const data = body.data

        console.log('Wompi webhook received:', event, data)

        // Handle different event types
        switch (event) {
            case 'transaction.updated':
                await handleTransactionUpdated(data)
                break

            default:
                console.log('Unhandled event type:', event)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}

async function handleTransactionUpdated(transaction: any) {
    const { id, status, reference, amount_in_cents, payment_method_type } = transaction

    console.log(`Transaction ${id} updated to status: ${status}`)

    // Extract order ID from reference (format: ORDER-{orderId}-{timestamp})
    const orderIdMatch = reference.match(/ORDER-([a-f0-9-]+)-/)
    if (!orderIdMatch) {
        console.error('Invalid reference format:', reference)
        return
    }

    const orderId = orderIdMatch[1]

    // Update order in database based on transaction status
    switch (status) {
        case 'APPROVED':
            await updateOrderStatus(orderId, 'paid', {
                transaction_id: id,
                payment_method: payment_method_type,
                amount_paid: amount_in_cents / 100,
                paid_at: new Date().toISOString(),
            })
            break

        case 'DECLINED':
        case 'ERROR':
            await updateOrderStatus(orderId, 'payment_failed', {
                transaction_id: id,
                payment_method: payment_method_type,
                error_message: transaction.status_message,
            })
            break

        case 'VOIDED':
            await updateOrderStatus(orderId, 'cancelled', {
                transaction_id: id,
                cancelled_reason: 'Payment voided',
            })
            break

        default:
            console.log('Unhandled transaction status:', status)
    }
}

async function updateOrderStatus(orderId: string, status: string, paymentData: any) {
    try {
        // Update order status
        const { error: orderError } = await supabase
            .from('orders')
            .update({
                status: status,
                payment_status: status === 'paid' ? 'completed' : status,
                payment_data: paymentData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)

        if (orderError) {
            console.error('Error updating order:', orderError)
            return
        }

        console.log(`Order ${orderId} updated to status: ${status}`)

        // If payment approved, also update to pending (ready for kitchen)
        if (status === 'paid') {
            await supabase
                .from('orders')
                .update({ status: 'pending' })
                .eq('id', orderId)
        }
    } catch (error) {
        console.error('Error in updateOrderStatus:', error)
    }
}

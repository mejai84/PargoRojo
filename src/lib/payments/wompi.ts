// Wompi Payment Integration for Colombia
// Supports: Credit/Debit Cards, Nequi, PSE, Bancolombia

export interface WompiConfig {
    publicKey: string
    currency: 'COP'
    redirectUrl: string
}

export interface WompiTransaction {
    id: string
    amount_in_cents: number
    reference: string
    customer_email: string
    currency: 'COP'
    signature?: string
    redirect_url?: string
    payment_method_type?: 'CARD' | 'NEQUI' | 'PSE' | 'BANCOLOMBIA_TRANSFER'
    payment_method?: {
        type: string
        extra?: any
        installments?: number
    }
    customer_data?: {
        phone_number?: string
        full_name?: string
        legal_id?: string
        legal_id_type?: 'CC' | 'CE' | 'NIT' | 'PP'
    }
}

export interface WompiResponse {
    data: {
        id: string
        created_at: string
        amount_in_cents: number
        reference: string
        customer_email: string
        currency: 'COP'
        payment_method_type: string
        payment_method: any
        status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR'
        status_message: string | null
        shipping_address: any | null
        redirect_url: string | null
        payment_source_id: string | null
        payment_link_id: string | null
        customer_data: any | null
        billing_data: any | null
    }
}

class WompiService {
    private publicKey: string
    private privateKey: string
    private integritySecret: string
    private baseUrl: string

    constructor() {
        this.publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || ''
        this.privateKey = process.env.WOMPI_PRIVATE_KEY || ''
        this.integritySecret = process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET || ''
        this.baseUrl = 'https://production.wompi.co/v1'

        // Use sandbox for testing
        if (this.publicKey.includes('test')) {
            this.baseUrl = 'https://sandbox.wompi.co/v1'
        }
    }

    // Generate integrity signature for transaction
    generateSignature(reference: string, amountInCents: number, currency: 'COP'): string {
        const crypto = require('crypto')
        const concatenated = `${reference}${amountInCents}${currency}${this.integritySecret}`
        return crypto.createHash('sha256').update(concatenated).digest('hex')
    }

    // Create payment link
    async createPaymentLink(transaction: WompiTransaction): Promise<string> {
        const signature = this.generateSignature(
            transaction.reference,
            transaction.amount_in_cents,
            transaction.currency
        )

        const params = new URLSearchParams({
            'public-key': this.publicKey,
            currency: transaction.currency,
            'amount-in-cents': transaction.amount_in_cents.toString(),
            reference: transaction.reference,
            signature: signature,
            'redirect-url': transaction.redirect_url || '',
            'customer-data:email': transaction.customer_email,
        })

        if (transaction.customer_data?.phone_number) {
            params.append('customer-data:phone-number', transaction.customer_data.phone_number)
        }
        if (transaction.customer_data?.full_name) {
            params.append('customer-data:full-name', transaction.customer_data.full_name)
        }
        if (transaction.customer_data?.legal_id) {
            params.append('customer-data:legal-id', transaction.customer_data.legal_id)
        }
        if (transaction.customer_data?.legal_id_type) {
            params.append('customer-data:legal-id-type', transaction.customer_data.legal_id_type)
        }

        return `https://checkout.wompi.co/p/?${params.toString()}`
    }

    // Get transaction status
    async getTransaction(transactionId: string): Promise<WompiResponse> {
        const response = await fetch(`${this.baseUrl}/transactions/${transactionId}`, {
            headers: {
                'Authorization': `Bearer ${this.privateKey}`,
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to get transaction: ${response.statusText}`)
        }

        return response.json()
    }

    // Verify webhook signature
    verifyWebhookSignature(payload: any, signature: string, timestamp: string): boolean {
        const crypto = require('crypto')
        const properties = payload.data ? Object.keys(payload.data).sort() : []
        const concatenated = properties.reduce((acc, key) => {
            return acc + payload.data[key]
        }, '') + timestamp + this.integritySecret

        const calculatedSignature = crypto.createHash('sha256').update(concatenated).digest('hex')
        return calculatedSignature === signature
    }

    // Get accepted payment methods
    async getAcceptedPaymentMethods(): Promise<any> {
        const response = await fetch(`${this.baseUrl}/merchants/${this.publicKey}`)

        if (!response.ok) {
            throw new Error(`Failed to get payment methods: ${response.statusText}`)
        }

        return response.json()
    }

    // Create tokenized card transaction
    async createCardTransaction(
        token: string,
        amountInCents: number,
        reference: string,
        customerEmail: string,
        installments: number = 1
    ): Promise<WompiResponse> {
        const signature = this.generateSignature(reference, amountInCents, 'COP')

        const response = await fetch(`${this.baseUrl}/transactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.privateKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount_in_cents: amountInCents,
                currency: 'COP',
                signature: signature,
                customer_email: customerEmail,
                reference: reference,
                payment_method: {
                    type: 'CARD',
                    token: token,
                    installments: installments,
                },
            }),
        })

        if (!response.ok) {
            throw new Error(`Failed to create transaction: ${response.statusText}`)
        }

        return response.json()
    }

    // Get payment method icons
    getPaymentMethodIcon(type: string): string {
        const icons: Record<string, string> = {
            'CARD': '💳',
            'NEQUI': '🟣',
            'PSE': '🏦',
            'BANCOLOMBIA_TRANSFER': '🟡',
            'BANCOLOMBIA_QR': '📱',
        }
        return icons[type] || '💰'
    }

    // Get payment method name in Spanish
    getPaymentMethodName(type: string): string {
        const names: Record<string, string> = {
            'CARD': 'Tarjeta de Crédito/Débito',
            'NEQUI': 'Nequi',
            'PSE': 'PSE - Débito Bancario',
            'BANCOLOMBIA_TRANSFER': 'Transferencia Bancolombia',
            'BANCOLOMBIA_QR': 'QR Bancolombia',
        }
        return names[type] || 'Otro método'
    }
}

export const wompiService = new WompiService()

// Helper function to format Colombian Pesos
export function formatCOP(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(amount)
}

// Helper function to convert COP to cents
export function copToCents(amount: number): number {
    return Math.round(amount * 100)
}

// Helper function to convert cents to COP
export function centsToCOP(cents: number): number {
    return cents / 100
}

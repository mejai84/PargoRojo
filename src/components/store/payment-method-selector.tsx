"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Smartphone, Building2, Wallet, Loader2 } from "lucide-react"

export type PaymentMethod = 'CARD' | 'NEQUI' | 'PSE' | 'BANCOLOMBIA' | 'CASH'

interface PaymentMethodSelectorProps {
    onSelect: (method: PaymentMethod) => void
    selected?: PaymentMethod
    loading?: boolean
}

export function PaymentMethodSelector({ onSelect, selected, loading }: PaymentMethodSelectorProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | undefined>(selected)

    const paymentMethods = [
        {
            id: 'CARD' as PaymentMethod,
            name: 'Tarjeta de Crédito/Débito',
            description: 'Visa, Mastercard, American Express',
            icon: CreditCard,
            color: 'from-blue-500/20 to-blue-600/20',
            borderColor: 'border-blue-500/30',
            iconColor: 'text-blue-500',
            popular: true,
        },
        {
            id: 'NEQUI' as PaymentMethod,
            name: 'Nequi',
            description: 'Pago con tu cuenta Nequi',
            icon: Smartphone,
            color: 'from-purple-500/20 to-purple-600/20',
            borderColor: 'border-purple-500/30',
            iconColor: 'text-purple-500',
            popular: true,
        },
        {
            id: 'PSE' as PaymentMethod,
            name: 'PSE',
            description: 'Débito desde tu cuenta bancaria',
            icon: Building2,
            color: 'from-green-500/20 to-green-600/20',
            borderColor: 'border-green-500/30',
            iconColor: 'text-green-500',
            popular: false,
        },
        {
            id: 'BANCOLOMBIA' as PaymentMethod,
            name: 'Bancolombia',
            description: 'Transferencia o QR Bancolombia',
            icon: Wallet,
            color: 'from-yellow-500/20 to-yellow-600/20',
            borderColor: 'border-yellow-500/30',
            iconColor: 'text-yellow-500',
            popular: false,
        },
        {
            id: 'CASH' as PaymentMethod,
            name: 'Efectivo',
            description: 'Pagar al recibir el pedido',
            icon: Wallet,
            color: 'from-gray-500/20 to-gray-600/20',
            borderColor: 'border-gray-500/30',
            iconColor: 'text-gray-400',
            popular: false,
        },
    ]

    const handleSelect = (method: PaymentMethod) => {
        setSelectedMethod(method)
        onSelect(method)
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-bold mb-2">Método de Pago</h3>
                <p className="text-sm text-muted-foreground">
                    Selecciona cómo deseas pagar tu pedido
                </p>
            </div>

            <div className="grid gap-3">
                {paymentMethods.map((method) => {
                    const Icon = method.icon
                    const isSelected = selectedMethod === method.id

                    return (
                        <button
                            key={method.id}
                            onClick={() => handleSelect(method.id)}
                            disabled={loading}
                            className={`
                                relative p-4 rounded-xl border-2 transition-all text-left
                                ${isSelected
                                    ? `${method.borderColor} bg-gradient-to-r ${method.color} ring-2 ring-offset-2 ring-offset-background`
                                    : 'border-white/10 hover:border-white/20 bg-card'
                                }
                                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            {method.popular && (
                                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                                    Popular
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-white/5 ${method.iconColor}`}>
                                    <Icon className="w-6 h-6" />
                                </div>

                                <div className="flex-1">
                                    <div className="font-bold text-base mb-1">
                                        {method.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {method.description}
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className={`w-6 h-6 rounded-full ${method.iconColor} flex items-center justify-center`}>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>

            {selectedMethod && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-start gap-3">
                        <div className="text-primary mt-0.5">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1 text-sm">
                            {selectedMethod === 'CARD' && (
                                <p>Serás redirigido a una página segura para ingresar los datos de tu tarjeta. Aceptamos Visa, Mastercard y American Express.</p>
                            )}
                            {selectedMethod === 'NEQUI' && (
                                <p>Recibirás una notificación en tu app Nequi para aprobar el pago. Asegúrate de tener saldo suficiente.</p>
                            )}
                            {selectedMethod === 'PSE' && (
                                <p>Serás redirigido al portal de tu banco para autorizar el débito desde tu cuenta bancaria.</p>
                            )}
                            {selectedMethod === 'BANCOLOMBIA' && (
                                <p>Podrás pagar mediante transferencia o escaneando un código QR desde tu app Bancolombia.</p>
                            )}
                            {selectedMethod === 'CASH' && (
                                <p>Pagarás en efectivo al momento de recibir tu pedido. Asegúrate de tener el monto exacto.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Procesando pago...</span>
                </div>
            )}
        </div>
    )
}

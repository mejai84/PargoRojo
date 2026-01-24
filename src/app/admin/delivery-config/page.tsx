"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Save, Truck, MapPin, Clock, DollarSign, Settings } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface DeliverySettings {
    id: string
    delivery_fee_enabled: boolean
    delivery_fee: number
    free_delivery_threshold: number | null
    max_delivery_radius_km: number
    estimated_delivery_time_min: number
    estimated_delivery_time_max: number
    restaurant_address: string
    restaurant_lat: number | null
    restaurant_lng: number | null
    restaurant_phone: string
    delivery_active: boolean
    pickup_active: boolean
    notes: string
}

export default function DeliveryConfigPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<DeliverySettings | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('delivery_settings')
                .select('*')
                .single()

            if (error) throw error
            setSettings(data)
        } catch (error: any) {
            console.error('Error fetching settings:', error)
            setMessage({ type: 'error', text: 'Error al cargar configuración' })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!settings) return

        setSaving(true)
        setMessage(null)

        try {
            const { error } = await supabase
                .from('delivery_settings')
                .update({
                    delivery_fee_enabled: settings.delivery_fee_enabled,
                    delivery_fee: settings.delivery_fee,
                    free_delivery_threshold: settings.free_delivery_threshold,
                    max_delivery_radius_km: settings.max_delivery_radius_km,
                    estimated_delivery_time_min: settings.estimated_delivery_time_min,
                    estimated_delivery_time_max: settings.estimated_delivery_time_max,
                    restaurant_address: settings.restaurant_address,
                    restaurant_phone: settings.restaurant_phone,
                    delivery_active: settings.delivery_active,
                    pickup_active: settings.pickup_active,
                    notes: settings.notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', settings.id)

            if (error) throw error

            setMessage({ type: 'success', text: '✅ Configuración guardada correctamente' })

            // Recargar para ver los cambios
            await fetchSettings()
        } catch (error: any) {
            console.error('Error saving settings:', error)
            setMessage({ type: 'error', text: `Error: ${error.message}` })
        } finally {
            setSaving(false)
        }
    }

    const updateSetting = (key: keyof DeliverySettings, value: any) => {
        if (!settings) return
        setSettings({ ...settings, [key]: value })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!settings) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    No se encontró configuración de delivery. Por favor ejecuta las migraciones.
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold">Configuración de Delivery</h1>
                </div>
                <p className="text-muted-foreground">
                    Gestiona todos los parámetros del sistema de entregas a domicilio y recogida en local
                </p>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* SECCIÓN 1: ACTIVACIÓN DE SERVICIOS */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <Truck className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold">Servicios Activos</h2>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition">
                            <div className="flex items-center gap-3">
                                <Truck className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="font-bold">Delivery Activo</p>
                                    <p className="text-sm text-gray-500">Permitir entregas a domicilio</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.delivery_active}
                                onChange={(e) => updateSetting('delivery_active', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition">
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="font-bold">Pickup Activo</p>
                                    <p className="text-sm text-gray-500">Permitir recogida en local</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.pickup_active}
                                onChange={(e) => updateSetting('pickup_active', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                        </label>
                    </div>
                </div>

                {/* SECCIÓN 2: TARIFAS DE ENVÍO */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <DollarSign className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold">Tarifas de Envío</h2>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-100 transition">
                            <div>
                                <p className="font-bold text-amber-900">Cobrar Envío</p>
                                <p className="text-sm text-amber-700">Activar/desactivar costo de delivery</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.delivery_fee_enabled}
                                onChange={(e) => updateSetting('delivery_fee_enabled', e.target.checked)}
                                className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                        </label>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Valor del Envío (COP)</label>
                            <input
                                type="number"
                                value={settings.delivery_fee}
                                onChange={(e) => updateSetting('delivery_fee', parseFloat(e.target.value) || 0)}
                                disabled={!settings.delivery_fee_enabled}
                                className={`w-full h-12 px-4 rounded-xl border-2 font-bold text-lg ${settings.delivery_fee_enabled
                                        ? 'bg-white border-gray-300 focus:border-primary'
                                        : 'bg-gray-100 border-gray-200 text-gray-400'
                                    } outline-none transition`}
                                placeholder="5000"
                            />
                            {settings.delivery_fee_enabled && (
                                <p className="text-sm text-green-600 font-medium">
                                    Los clientes pagarán: {formatPrice(settings.delivery_fee)}
                                </p>
                            )}
                            {!settings.delivery_fee_enabled && (
                                <p className="text-sm text-green-600 font-medium">
                                    ✅ Envío GRATIS para todos los pedidos
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Pedido Mínimo para Envío Gratis (Opcional)</label>
                            <input
                                type="number"
                                value={settings.free_delivery_threshold || ''}
                                onChange={(e) => updateSetting('free_delivery_threshold', e.target.value ? parseFloat(e.target.value) : null)}
                                className="w-full h-12 px-4 rounded-xl border-2 border-gray-300 focus:border-primary outline-none transition"
                                placeholder="50000 (opcional)"
                            />
                            {settings.free_delivery_threshold && (
                                <p className="text-sm text-blue-600">
                                    Pedidos mayores a {formatPrice(settings.free_delivery_threshold)} tendrán envío gratis
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 3: ZONA DE ENTREGA */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <MapPin className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold">Zona de Entrega</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Radio Máximo de Entrega (km)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={settings.max_delivery_radius_km}
                                onChange={(e) => updateSetting('max_delivery_radius_km', parseFloat(e.target.value) || 3)}
                                className="w-full h-12 px-4 rounded-xl border-2 border-gray-300 focus:border-primary outline-none transition font-bold"
                                placeholder="3"
                            />
                            <p className="text-sm text-gray-500">
                                📍 Solo se aceptarán pedidos dentro de <strong>{settings.max_delivery_radius_km} km</strong> del restaurante
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Dirección del Restaurante</label>
                            <input
                                type="text"
                                value={settings.restaurant_address}
                                onChange={(e) => updateSetting('restaurant_address', e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border-2 border-gray-300 focus:border-primary outline-none transition"
                                placeholder="Calle Principal #123, Barrio Centro"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Teléfono de Contacto</label>
                            <input
                                type="tel"
                                value={settings.restaurant_phone}
                                onChange={(e) => updateSetting('restaurant_phone', e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border-2 border-gray-300 focus:border-primary outline-none transition"
                                placeholder="+57 300 123 4567"
                            />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 4: TIEMPOS DE ENTREGA */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <Clock className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold">Tiempos Estimados</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Tiempo Mínimo (min)</label>
                                <input
                                    type="number"
                                    value={settings.estimated_delivery_time_min}
                                    onChange={(e) => updateSetting('estimated_delivery_time_min', parseInt(e.target.value) || 30)}
                                    className="w-full h-12 px-4 rounded-xl border-2 border-gray-300 focus:border-primary outline-none transition"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Tiempo Máximo (min)</label>
                                <input
                                    type="number"
                                    value={settings.estimated_delivery_time_max}
                                    onChange={(e) => updateSetting('estimated_delivery_time_max', parseInt(e.target.value) || 45)}
                                    className="w-full h-12 px-4 rounded-xl border-2 border-gray-300 focus:border-primary outline-none transition"
                                />
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-blue-700">
                                ⏱️ Los clientes verán: <strong>"{settings.estimated_delivery_time_min}-{settings.estimated_delivery_time_max} minutos"</strong>
                            </p>
                        </div>
                    </div>
                </div>

                {/* NOTAS INTERNAS */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                    <label className="text-sm font-bold text-gray-700">Notas Internas (Opcional)</label>
                    <textarea
                        value={settings.notes || ''}
                        onChange={(e) => updateSetting('notes', e.target.value)}
                        className="w-full h-24 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-primary outline-none transition resize-none"
                        placeholder="Ej: Solo delivery los fines de semana, zona norte limitada, etc."
                    />
                </div>
            </div>

            {/* Botón de Guardar */}
            <div className="mt-8 flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-12 px-8 text-lg font-bold flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Guardar Configuración
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

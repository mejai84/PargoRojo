"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
// import { Switch } from "@/components/ui/switch" // Asumiendo que tienes un componente Switch o uso checkbox
import { Loader2, Save } from "lucide-react"

// Si no tengo componente Switch, uso un checkbox simple estilizado
function SimpleSwitch({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (c: boolean) => void }) {
    return (
        <button
            onClick={() => onCheckedChange(!checked)}
            className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${checked ? 'bg-primary' : 'bg-white/10'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    )
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<any>({})

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('key', 'feature_flags')
            .single()

        if (data) {
            setSettings(data.value || {})
        }
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        const { error } = await supabase
            .from('settings')
            .upsert({
                key: 'feature_flags',
                value: settings,
                description: 'Global feature flags updated from admin'
            })

        if (error) {
            alert("Error al guardar")
        } else {
            alert("Configuración guardada")
        }
        setSaving(false)
    }

    const toggle = (key: string) => {
        setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }))
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
                    <p className="text-muted-foreground">Habilita o deshabilita módulos y características globales.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2 font-bold">
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    Guardar Cambios
                </Button>
            </div>

            <div className="grid gap-6">
                <div className="bg-card/50 border border-white/10 rounded-2xl p-6 space-y-6">
                    <h2 className="text-xl font-bold border-b border-white/10 pb-4">Módulos Operativos</h2>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                            <div className="font-bold">Sistema de Cocina (KDS)</div>
                            <div className="text-sm text-muted-foreground">Permite ver y gestionar pedidos en pantalla de cocina.</div>
                        </div>
                        <SimpleSwitch checked={settings.enable_kitchen_kds} onCheckedChange={() => toggle('enable_kitchen_kds')} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                            <div className="font-bold">POS Meseros</div>
                            <div className="text-sm text-muted-foreground">Habilita la interfaz de toma de pedidos para meseros.</div>
                        </div>
                        <SimpleSwitch checked={settings.enable_waiter_pos} onCheckedChange={() => toggle('enable_waiter_pos')} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                            <div className="font-bold">Aprobación de Caja</div>
                            <div className="text-sm text-muted-foreground">Requiere que un cajero apruebe los pedidos antes de ir a cocina.</div>
                        </div>
                        <SimpleSwitch checked={settings.require_cashier_approval} onCheckedChange={() => toggle('require_cashier_approval')} />
                    </div>
                </div>

                <div className="bg-card/50 border border-white/10 rounded-2xl p-6 space-y-6">
                    <h2 className="text-xl font-bold border-b border-white/10 pb-4">Características Cliente</h2>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                            <div className="font-bold">Reservas en Línea</div>
                            <div className="text-sm text-muted-foreground">Permite a los clientes reservar mesas desde la web.</div>
                        </div>
                        <SimpleSwitch checked={settings.enable_reservations} onCheckedChange={() => toggle('enable_reservations')} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                            <div className="font-bold">Cupones y Descuentos</div>
                            <div className="text-sm text-muted-foreground">Habilita el sistema de cupones promocionales.</div>
                        </div>
                        <SimpleSwitch checked={settings.enable_coupons} onCheckedChange={() => toggle('enable_coupons')} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                            <div className="font-bold">Combos</div>
                            <div className="text-sm text-muted-foreground">Muestra la sección de combos en el menú.</div>
                        </div>
                        <SimpleSwitch checked={settings.enable_combos} onCheckedChange={() => toggle('enable_combos')} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                            <div className="font-bold">Imágenes en Menú</div>
                            <div className="text-sm text-muted-foreground">Muestra fotos de los platos en el menú digital. Si se desactiva, el menú será más compacto.</div>
                        </div>
                        <SimpleSwitch checked={settings.menu_show_images ?? false} onCheckedChange={() => toggle('menu_show_images')} />
                    </div>
                </div>
            </div>
        </div>
    )
}

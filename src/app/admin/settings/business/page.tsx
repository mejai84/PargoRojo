"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Building2,
    Settings,
    Save,
    Loader2,
    Hash,
    Phone,
    Mail,
    MapPin,
    Globe,
    Coins,
    ReceiptText,
    Percent,
    FileSignature,
    CheckCircle2,
    Smartphone,
    CreditCard
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function BusinessSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [businessInfo, setBusinessInfo] = useState({
        business_name: "",
        identification_number: "",
        phone: "",
        email: "",
        address: "",
        website: "",
        currency: "COP",
        currency_symbol: "$"
    })
    const [taxSettings, setTaxSettings] = useState({
        tax_name: "IVA",
        tax_percentage: 0,
        consumption_tax: 0,
        include_tax_in_price: true,
        invoice_prefix: "",
        invoice_start_number: 1,
        legal_text: ""
    })

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('settings').select('*')
            if (data) {
                const info = data.find(s => s.key === 'business_info')?.value
                const taxes = data.find(s => s.key === 'tax_settings')?.value
                if (info) setBusinessInfo(info)
                if (taxes) setTaxSettings(taxes)
            }
            setLoading(false)
        }
        fetchSettings()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error: infoError } = await supabase
                .from('settings')
                .update({ value: businessInfo })
                .eq('key', 'business_info')

            const { error: taxError } = await supabase
                .from('settings')
                .update({ value: taxSettings })
                .eq('key', 'tax_settings')

            if (infoError || taxError) throw new Error("Error al guardar")
            alert("Configuración guardada correctamente ✅")
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-slate-900 p-4 md:p-8 font-sans selection:bg-primary selection:text-black">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-10 h-10 text-primary" />
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900">Configuración de <span className="text-primary text-gradient">Empresa</span></h1>
                        </div>
                        <p className="text-slate-400 font-medium italic uppercase text-[10px] tracking-widest mt-2 leading-none">Datos legales, fiscales y de contacto del restaurante</p>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-16 px-8 rounded-2xl bg-primary text-black hover:bg-slate-900 hover:text-white transition-all font-black uppercase text-xs tracking-[0.2em] italic shadow-xl shadow-primary/20 group border-none"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <div className="flex items-center gap-2">
                                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                GUARDAR CAMBIOS
                            </div>
                        )}
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* COL 1: DATOS GENERALES */}
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                            <Building2 className="w-64 h-64 text-slate-900" />
                        </div>

                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2 mb-10 italic">
                            <Settings className="w-4 h-4 text-primary" /> Perfil Comercial
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" /> Nombre del Negocio
                                </label>
                                <input
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 outline-none focus:border-primary transition-all font-bold text-slate-900 italic shadow-inner"
                                    value={businessInfo.business_name}
                                    onChange={e => setBusinessInfo({ ...businessInfo, business_name: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                    <Hash className="w-3 h-3" /> NIT / Identificación
                                </label>
                                <input
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 outline-none focus:border-primary transition-all font-bold text-slate-900 shadow-inner"
                                    value={businessInfo.identification_number}
                                    onChange={e => setBusinessInfo({ ...businessInfo, identification_number: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Teléfono
                                </label>
                                <input
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 outline-none focus:border-primary transition-all font-bold text-slate-900 shadow-inner"
                                    value={businessInfo.phone}
                                    onChange={e => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> Correo Electrónico
                                </label>
                                <input
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 outline-none focus:border-primary transition-all font-bold text-slate-900 shadow-inner"
                                    value={businessInfo.email}
                                    onChange={e => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Dirección Jurídica
                                </label>
                                <input
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 outline-none focus:border-primary transition-all font-bold text-slate-900 shadow-inner"
                                    value={businessInfo.address}
                                    onChange={e => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                    <Coins className="w-3 h-3" /> Moneda
                                </label>
                                <select
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 outline-none focus:border-primary transition-all font-bold text-slate-900 uppercase italic cursor-pointer shadow-inner"
                                    value={businessInfo.currency}
                                    onChange={e => setBusinessInfo({ ...businessInfo, currency: e.target.value })}
                                >
                                    <option value="COP" className="bg-white">Peso Colombiano (COP)</option>
                                    <option value="USD" className="bg-white">Dólar (USD)</option>
                                    <option value="EUR" className="bg-white">Euro (EUR)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                    <Smartphone className="w-3 h-3" /> Símbolo
                                </label>
                                <input
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 outline-none focus:border-primary transition-all font-black text-center text-xl text-primary shadow-inner"
                                    value={businessInfo.currency_symbol}
                                    onChange={e => setBusinessInfo({ ...businessInfo, currency_symbol: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* COL 2: FISCALIDAD Y FACTURACIÓN */}
                    <div className="space-y-8">
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2 mb-10 italic">
                                <ReceiptText className="w-4 h-4 text-primary" /> Configuración Fiscal
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <button
                                        onClick={() => setTaxSettings({ ...taxSettings, include_tax_in_price: !taxSettings.include_tax_in_price })}
                                        className={cn(
                                            "w-full h-14 rounded-2xl border flex items-center justify-between px-6 transition-all group",
                                            taxSettings.include_tax_in_price
                                                ? "bg-primary/5 border-primary/20 text-primary"
                                                : "bg-slate-50 border-slate-200 text-slate-300"
                                        )}
                                    >
                                        <span className="text-xs font-black uppercase tracking-widest italic flex items-center gap-2">
                                            {taxSettings.include_tax_in_price && <CheckCircle2 className="w-4 h-4" />}
                                            Impuestos incluidos en el precio
                                        </span>
                                        <div className={cn(
                                            "w-10 h-5 rounded-full relative transition-all",
                                            taxSettings.include_tax_in_price ? "bg-primary" : "bg-slate-200"
                                        )}>
                                            <div className={cn(
                                                "w-3 h-3 rounded-full bg-white absolute top-1 transition-all",
                                                taxSettings.include_tax_in_price ? "right-1" : "left-1"
                                            )} />
                                        </div>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                        <Percent className="w-3 h-3" /> IVA / Impuesto (%)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 outline-none focus:border-primary transition-all font-bold text-slate-900 text-right shadow-inner"
                                        value={taxSettings.tax_percentage}
                                        onChange={e => setTaxSettings({ ...taxSettings, tax_percentage: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                        <Percent className="w-3 h-3" /> Imp. Consumo (%)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 outline-none focus:border-primary transition-all font-bold text-slate-900 text-right shadow-inner"
                                        value={taxSettings.consumption_tax}
                                        onChange={e => setTaxSettings({ ...taxSettings, consumption_tax: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                        <FileSignature className="w-3 h-3" /> Prefijo Factura
                                    </label>
                                    <input
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 outline-none focus:border-primary transition-all font-black text-slate-900 uppercase italic text-center shadow-inner"
                                        value={taxSettings.invoice_prefix}
                                        onChange={e => setTaxSettings({ ...taxSettings, invoice_prefix: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                        Consecutivo Inicial
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 outline-none focus:border-primary transition-all font-bold text-slate-900 text-right shadow-inner"
                                        value={taxSettings.invoice_start_number}
                                        onChange={e => setTaxSettings({ ...taxSettings, invoice_start_number: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                                        <ReceiptText className="w-3 h-3" /> Leyenda Legal Ticket
                                    </label>
                                    <textarea
                                        className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl p-5 outline-none focus:border-primary transition-all font-medium text-xs resize-none text-slate-600 shadow-inner"
                                        value={taxSettings.legal_text}
                                        onChange={e => setTaxSettings({ ...taxSettings, legal_text: e.target.value })}
                                        placeholder="Ej: Régimen simple, contribuyente..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white rounded-[2rem] border border-slate-200 flex items-center gap-6 group hover:bg-slate-50 transition-all cursor-help shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
                                <Building2 className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-black italic uppercase text-primary">Previsualización de Factura</h4>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-relaxed italic">
                                    Estos datos aparecerán en el encabezado y pie de página de todos los tickets generados para {businessInfo.business_name || "TU RESTAURANTE"}.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

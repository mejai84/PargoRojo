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
    CreditCard,
    ArrowLeft,
    ShieldCheck,
    Zap,
    Briefcase,
    Fingerprint,
    Search,
    RefreshCcw,
    Layers,
    Activity,
    Database,
    ShieldAlert,
    ChevronRight,
    Terminal
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
                .upsert({
                    key: 'business_info',
                    value: businessInfo,
                    description: 'Public business identity and contact info'
                })

            const { error: taxError } = await supabase
                .from('settings')
                .upsert({
                    key: 'tax_settings',
                    value: taxSettings,
                    description: 'Fiscal and tax parameters'
                })

            if (infoError || taxError) throw new Error("Error al guardar")
            alert("Configuración de Elite Ledger guardada correctamente ✅")
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-8 animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                </div>
                <div className="space-y-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic animate-pulse">Sincronizando Business Logic Hub...</p>
                    <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">Master Identity v5.4</p>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* 🌌 AMBIANCE LAYER */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -top-40 -right-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-30 z-0 animate-pulse" />

            <div className="max-w-[1600px] mx-auto space-y-16 animate-in fade-in duration-1000 relative z-10">

                {/* 🔝 REFINED STRATEGIC COMMAND HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 border-b border-border/50 pb-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <Link href="/admin/settings">
                            <Button variant="ghost" size="icon" className="h-20 w-20 rounded-[2.5rem] bg-card border border-border shadow-3xl hover:bg-muted active:scale-90 transition-all group overflow-hidden relative">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ArrowLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-foreground">PERFIL <span className="text-primary italic">COMERCIAL</span></h1>
                                <div className="px-5 py-2 bg-primary/10 border-2 border-primary/20 rounded-[1.5rem] text-[11px] font-black text-primary tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                    <ShieldCheck className="w-4 h-4" />
                                    VERIFIED ENTITY
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-6">
                                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                    <Briefcase className="w-5 h-5 text-primary" /> Maestro de Identidad Jurídica & Matriz Fiscal Certificada
                                </p>
                                <div className="w-2 h-2 rounded-full bg-border" />
                                <p className="text-[10px] text-primary/40 font-black uppercase tracking-[0.3em] italic">Vencimiento Licencia: 12/26</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-8 bg-card border border-border p-3 rounded-[3rem] shadow-3xl">
                        <Link href="/admin/settings">
                            <Button variant="ghost" className="h-20 px-10 bg-muted/20 border border-border/50 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] italic shadow-xl transition-all gap-4 hover:bg-muted active:scale-95 group">
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> RETORNO PROTOCOLO
                            </Button>
                        </Link>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-20 px-12 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black uppercase text-xs tracking-[0.4em] italic rounded-[2.5rem] shadow-3xl shadow-primary/20 transition-all gap-5 border-none group active:scale-95"
                        >
                            {saving ? <Loader2 className="w-7 h-7 animate-spin" /> : (
                                <>
                                    <Save className="w-7 h-7 group-hover:scale-110 transition-transform" />
                                    SINCRONIZAR LEDGER
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                    {/* 🏢 ENTITY NOD (IDENTITY) */}
                    <div className="bg-card border border-border rounded-[4.5rem] p-12 md:p-16 shadow-3xl relative overflow-hidden group/card animate-in slide-in-from-left-12 duration-1000">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/card:scale-110 transition-all duration-1000 rotate-12">
                            <Building2 className="w-[500px] h-[500px]" />
                        </div>

                        <div className="flex items-center gap-6 mb-16 border-l-8 border-primary px-8 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xl">
                                <Fingerprint className="w-9 h-9" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic leading-none">Credenciales Jurídicas</h3>
                                <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic">GLOBAL IDENTITY PARAMETERS</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <div className="space-y-4 col-span-1 md:col-span-2 group/input">
                                <label className="text-[11px] font-black text-primary/60 uppercase tracking-[0.5em] ml-10 italic group-focus-within/input:text-primary transition-colors flex items-center gap-3 leading-none">
                                    <Hash className="w-4 h-4" /> NOMBRE O RAZÓN SOCIAL DEL TITULAR
                                </label>
                                <input
                                    className="w-full h-20 bg-muted/30 border border-border rounded-[2.5rem] px-10 outline-none focus:border-primary transition-all font-black text-3xl italic text-foreground tracking-tighter shadow-inner placeholder:text-muted-foreground/10 leading-none"
                                    value={businessInfo.business_name}
                                    placeholder="JAMALI OS CORE ENTITY..."
                                    onChange={e => setBusinessInfo({ ...businessInfo, business_name: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="space-y-4 group/input">
                                <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-10 italic leading-none flex items-center gap-3">
                                    <ShieldCheck className="w-4 h-4" /> TAX ID / NIT / RUT
                                </label>
                                <input
                                    className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-black text-xl italic text-foreground tracking-tighter shadow-inner leading-none"
                                    value={businessInfo.identification_number}
                                    onChange={e => setBusinessInfo({ ...businessInfo, identification_number: e.target.value })}
                                />
                            </div>

                            <div className="space-y-4 group/input">
                                <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-10 italic leading-none flex items-center gap-3">
                                    <Phone className="w-4 h-4" /> LÍNEA DE ENLACE CORE
                                </label>
                                <input
                                    className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-black text-xl italic text-foreground tracking-tighter shadow-inner leading-none"
                                    value={businessInfo.phone}
                                    onChange={e => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-4 col-span-1 md:col-span-2 group/input">
                                <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-10 italic leading-none flex items-center gap-3">
                                    <Mail className="w-4 h-4" /> CANAL DE NOTIFICACIÓN DIGITAL
                                </label>
                                <input
                                    className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-black text-xl text-foreground tracking-tighter shadow-inner leading-none italic"
                                    value={businessInfo.email}
                                    onChange={e => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                                    placeholder="enterprise@jamalios.com"
                                />
                            </div>

                            <div className="space-y-4 col-span-1 md:col-span-2 group/input">
                                <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-10 italic leading-none flex items-center gap-3">
                                    <MapPin className="w-4 h-4" /> HUB DE OPERACIÓN FÍSICA
                                </label>
                                <input
                                    className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-bold text-foreground tracking-tighter shadow-inner leading-none h-20 text-lg uppercase italic"
                                    value={businessInfo.address}
                                    onChange={e => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-10 italic leading-none flex items-center gap-3">
                                    <Globe className="w-4 h-4" /> DIVISA DE INTERCAMBIO
                                </label>
                                <div className="relative group/sel">
                                    <select
                                        className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-black text-foreground uppercase italic cursor-pointer shadow-inner appearance-none relative z-10"
                                        value={businessInfo.currency}
                                        onChange={e => setBusinessInfo({ ...businessInfo, currency: e.target.value })}
                                    >
                                        <option value="COP">PESO COLOMBIANO (COP)</option>
                                        <option value="USD">DÓLAR AMERICANO (USD)</option>
                                        <option value="EUR">EURO ZONE (EUR)</option>
                                        <option value="MXN">PESO MEXICANO (MXN)</option>
                                    </select>
                                    <ArrowRight className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 rotate-90" />
                                </div>
                            </div>

                            <div className="space-y-4 text-center">
                                <label className="text-[11px] font-black text-primary uppercase tracking-[0.5em] italic leading-none">SÍMBOLO CORE</label>
                                <input
                                    className="w-full h-18 bg-card border-4 border-primary/20 rounded-[2rem] px-6 outline-none focus:border-primary transition-all font-black text-5xl text-primary text-center shadow-3xl shadow-primary/10 relative overflow-hidden"
                                    value={businessInfo.currency_symbol}
                                    onChange={e => setBusinessInfo({ ...businessInfo, currency_symbol: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ⚖️ FISCAL NOD (TAXES) */}
                    <div className="space-y-12 animate-in slide-in-from-right-12 duration-1000">
                        <div className="bg-card border border-border rounded-[4.5rem] p-12 md:p-16 shadow-3xl relative overflow-hidden group/card transition-all hover:border-primary/20">
                            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/card:scale-110 transition-all duration-1000 -rotate-12">
                                <ReceiptText className="w-[500px] h-[500px]" />
                            </div>

                            <div className="flex items-center gap-6 mb-16 border-l-8 border-primary px-8 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-xl">
                                    <Layers className="w-9 h-9" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic leading-none">Matriz Tributaria</h3>
                                    <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic">FISCAL CORE AUTO-PILOT</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                <div className="col-span-1 md:col-span-2">
                                    <button
                                        onClick={() => setTaxSettings({ ...taxSettings, include_tax_in_price: !taxSettings.include_tax_in_price })}
                                        className={cn(
                                            "w-full h-24 rounded-[3rem] border-4 flex items-center justify-between px-10 transition-all group/switch shadow-3xl relative overflow-hidden",
                                            taxSettings.include_tax_in_price
                                                ? "bg-primary/5 border-primary text-primary"
                                                : "bg-muted/40 border-border/50 text-muted-foreground/30"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/switch:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl group-hover/switch:scale-110",
                                                taxSettings.include_tax_in_price ? "bg-primary text-primary-foreground" : "bg-muted-foreground/10 text-muted-foreground"
                                            )}>
                                                {taxSettings.include_tax_in_price ? <CheckCircle2 className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                                            </div>
                                            <div className="text-left">
                                                <span className="text-lg font-black uppercase tracking-tighter italic block leading-none mb-1 transition-colors group-hover/switch:text-foreground">Impuesto Integrado</span>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">CALCULAR IVA EN EL PRECIO DE VENTA</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-16 h-8 rounded-full relative transition-all border-2 border-transparent",
                                            taxSettings.include_tax_in_price ? "bg-primary shadow-lg shadow-primary/20" : "bg-muted-foreground/10"
                                        )}>
                                            <div className={cn(
                                                "w-6 h-6 rounded-full bg-white absolute top-0.5 shadow-xl transition-all duration-500",
                                                taxSettings.include_tax_in_price ? "translate-x-9" : "translate-x-1"
                                            )} />
                                        </div>
                                    </button>
                                </div>

                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic flex items-center gap-3">
                                        <Percent className="w-4 h-4 text-emerald-500" /> IVA / TASA BASE
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full h-20 bg-muted/30 border border-border rounded-[2.5rem] px-10 outline-none focus:border-primary transition-all font-black text-4xl italic text-emerald-500 text-center shadow-inner placeholder:text-emerald-500/10"
                                            value={taxSettings.tax_percentage}
                                            onChange={e => setTaxSettings({ ...taxSettings, tax_percentage: parseFloat(e.target.value) || 0 })}
                                        />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-500/20">%</span>
                                    </div>
                                </div>

                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic flex items-center gap-3">
                                        <Percent className="w-4 h-4 text-primary" /> IMP. CONSUMO
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full h-20 bg-muted/30 border border-border rounded-[2.5rem] px-10 outline-none focus:border-primary transition-all font-black text-4xl italic text-primary text-center shadow-inner placeholder:text-primary/10"
                                            value={taxSettings.consumption_tax}
                                            onChange={e => setTaxSettings({ ...taxSettings, consumption_tax: parseFloat(e.target.value) || 0 })}
                                        />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/20">%</span>
                                    </div>
                                </div>

                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic flex items-center gap-3 leading-none">
                                        <Terminal className="w-4 h-4" /> PREFIJO DE FACTURACIÓN
                                    </label>
                                    <input
                                        className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-black text-2xl italic text-foreground uppercase text-center shadow-inner tracking-widest"
                                        value={taxSettings.invoice_prefix}
                                        placeholder="EJ: PRE-"
                                        onChange={e => setTaxSettings({ ...taxSettings, invoice_prefix: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic leading-none">PUNTO DE PARTIDA</label>
                                    <input
                                        type="number"
                                        className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-black text-2xl italic text-foreground text-center shadow-inner"
                                        value={taxSettings.invoice_start_number}
                                        onChange={e => setTaxSettings({ ...taxSettings, invoice_start_number: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="space-y-4 col-span-1 md:col-span-2 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic flex items-center gap-3">
                                        <ReceiptText className="w-4 h-4 text-primary" /> CLÁUSULA LEGAL / PIE DE PÁGINA
                                    </label>
                                    <textarea
                                        className="w-full h-36 bg-muted/30 border border-border rounded-[3rem] p-10 outline-none focus:border-primary transition-all font-black text-[11px] uppercase tracking-tighter resize-none text-muted-foreground italic shadow-inner leading-relaxed placeholder:text-muted-foreground/10"
                                        value={taxSettings.legal_text}
                                        onChange={e => setTaxSettings({ ...taxSettings, legal_text: e.target.value.toUpperCase() })}
                                        placeholder="INTRODUCE EL TEXTO LEGAL PARA TUS TICKETS DE VENTA..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 🔍 FORENSIC PREVIEW PANEL */}
                        <div className="bg-foreground text-background rounded-[4.5rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative overflow-hidden group/pre group hover:scale-[1.02] transition-all duration-700 animate-pulse-slow">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent opacity-0 group-hover/pre:opacity-100 transition-opacity" />
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[120px] rounded-full -mr-32 -mt-32 group-hover/pre:scale-125 transition-transform duration-1000" />

                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                                <div className="w-28 h-28 rounded-[2.5rem] bg-background border border-white/10 flex items-center justify-center shrink-0 shadow-3xl group-hover/pre:rotate-12 transition-transform duration-500">
                                    <ReceiptText className="w-14 h-14 text-primary drop-shadow-[0_0_20px_rgba(255,77,0,0.6)] animate-bounce-slow" />
                                </div>
                                <div className="space-y-4 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-4">
                                        <h4 className="text-3xl font-black italic uppercase tracking-tighter text-primary group-hover/pre:text-white transition-colors">Forensics Preview</h4>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                    <p className="text-[12px] text-background/40 font-black uppercase tracking-[0.3em] leading-relaxed italic max-w-lg">
                                        LA CONFIGURACIÓN ACTUAL SERÁ INYECTADA EN EL KERNEL DE IMPRESIÓN Y FACTURACIÓN ELECTRÓNICA PARA <span className="text-primary border-b border-primary/20">{businessInfo.business_name || "JAMALI OS MASTER HUB"}</span>. VERIFIQUE LOS RANGOS ANTES DE SINCRONIZAR.
                                    </p>
                                    <div className="flex items-center justify-center md:justify-start gap-6 pt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">Status: Sync Ready</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">Node: Secure</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 flex justify-end items-center">
                                    <Button variant="ghost" className="h-16 h-16 rounded-full bg-white/5 border border-white/10 hover:bg-primary hover:text-white transition-all">
                                        <ChevronRight className="w-8 h-8" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.95; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 5s ease-in-out infinite;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            `}</style>
        </div>
    )
}

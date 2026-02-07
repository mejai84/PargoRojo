"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Navbar } from "@/components/store/navbar"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, Clock, Upload, Camera, Banknote, MapPin, Phone, MessageCircle } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"

export default function OrderStatusPage() {
    const params = useParams()
    const router = useRouter()
    const [delivery, setDelivery] = useState<any>(null)
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [proofUrl, setProofUrl] = useState<string | null>(null)
    const [businessInfo, setBusinessInfo] = useState<any>({})

    useEffect(() => {
        if (params.id) {
            fetchOrder()
            fetchSettings()

            // Suscripción a cambios en ORDEN y DELIVERY
            const channel = supabase.channel('order-status-' + params.id)
                .on('postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${params.id}` },
                    (payload) => setOrder(prev => ({ ...prev, ...payload.new }))
                )
                .on('postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'delivery_tracking', filter: `order_id=eq.${params.id}` },
                    (payload) => setDelivery(prev => ({ ...prev, ...payload.new }))
                )
                .subscribe()

            return () => { supabase.removeChannel(channel) }
        }
    }, [params.id])

    const fetchOrder = async () => {
        // Cargar Orden
        const { data, error } = await supabase
            .from('orders')
            .select(`*, order_items (quantity, unit_price, products (name), customizations)`)
            .eq('id', params.id)
            .single()

        if (data) {
            setOrder(data)
            // Cargar Delivery Tracking
            const { data: dData } = await supabase
                .from('delivery_tracking')
                .select('*, profiles(full_name, phone)')
                .eq('order_id', params.id)
                .maybeSingle()
            if (dData) setDelivery(dData)
        }
        setLoading(false)
    }

    // ... (fetchSettings y handleFileUpload se mantienen igual) ...
    const fetchSettings = async () => {
        const { data } = await supabase.from('settings').select('value').eq('key', 'business_info').single()
        if (data) setBusinessInfo(data.value)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setUploading(true)
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${params.id}_payment_${Date.now()}.${fileExt}`

        try {
            const { error: uploadError } = await supabase.storage
                .from('payment_proofs')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('payment_proofs')
                .getPublicUrl(fileName)

            setProofUrl(publicUrl)

            await supabase.from('orders').update({
                notes: order.notes ? `${order.notes} | 📸 Comprobante subido: ${publicUrl}` : `📸 Comprobante subido: ${publicUrl}`,
            }).eq('id', order.id)

            alert("✅ Comprobante subido correctamente. Estamos verificando tu pago.")

        } catch (error: any) {
            console.error(error)
            alert("Error al subir imagen: " + error.message)
        } finally {
            setUploading(false)
        }
    }


    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black/95"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>

    if (!order) return <div className="min-h-screen flex items-center justify-center text-white">Pedido no encontrado</div>

    const isNequi = order.payment_method === 'nequi_daviplata'
    const needsPayment = isNequi && order.payment_status === 'pending'

    // Estados Trackeables
    const STATUS_STEPS = [
        { id: 'pending', label: 'Recibido', description: "Pedido confirmado" },
        { id: 'preparing', label: 'En Cocina', description: "Preparando ingredientes" },
        { id: 'ready', label: 'Listo', description: "Empacado para entrega" },
        { id: 'picked_up', label: 'En Camino', description: "Conductor en ruta" }, // Estado virtual
        { id: 'delivered', label: 'Entregado', description: "¡Disfruta!" }
    ]

    const getCurrentStatusStep = () => {
        if (order.status === 'delivered') return 4
        if (delivery?.status === 'picked_up') return 3
        if (order.status === 'ready') return 2
        if (order.status === 'preparing') return 1
        return 0
    }
    const currentStep = getCurrentStatusStep()

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-primary selection:text-black pb-20">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 max-w-2xl">

                {/* STATUS HEADER */}
                <div className="text-center space-y-6 mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-bold tracking-widest uppercase">
                        Ticket #{order.id.slice(0, 8)}
                    </div>

                    {/* SI NECESITA PAGO PRIORITARIO */}
                    {needsPayment && !proofUrl ? (
                        <div className="bg-primary/10 border border-primary text-white p-8 rounded-[2rem] animate-in zoom-in">
                            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-4 text-primary">Confirma tu Pago</h1>
                            <p className="text-slate-300 mb-6">Sube el comprobante para que cocina empiece a preparar tu orden.</p>

                            <div className="bg-black/40 p-6 rounded-2xl mb-6 text-left">
                                <p className="font-bold text-sm mb-2 text-slate-400">Transfiere a Nequi / Daviplata:</p>
                                <p className="text-2xl font-black tracking-tight text-white mb-1">{businessInfo.nequi || "300 123 4567"}</p>
                                <p className="text-4xl font-black text-primary underline">{formatPrice(order.total)}</p>
                            </div>

                            <label className="block w-full cursor-pointer group">
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                <div className="w-full h-16 bg-primary text-black rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-wider group-hover:bg-white transition-all shadow-xl shadow-primary/20">
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-6 h-6" />}
                                    {uploading ? "Subiendo..." : "Subir Comprobante"}
                                </div>
                            </label>
                        </div>
                    ) : (
                        // MODO TRACKING
                        <>
                            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
                                {STATUS_STEPS[currentStep].label}
                            </h1>
                            <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
                                {STATUS_STEPS[currentStep].description}
                            </p>

                            {/* TIMELINE VISUAL */}
                            <div className="mt-8 flex justify-between items-center relative px-4">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -z-10" />
                                <div
                                    className="absolute top-1/2 left-0 h-1 bg-primary -z-10 transition-all duration-1000"
                                    style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                                />

                                {STATUS_STEPS.map((step, idx) => (
                                    <div key={step.id} className={`flex flex-col items-center gap-2 transition-all ${idx <= currentStep ? 'opacity-100 scale-105' : 'opacity-30'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 ${idx <= currentStep ? 'bg-primary border-primary text-black' : 'bg-black border-white/20 text-white'}`}>
                                            {idx + 1}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* DRIVER MAP CARD */}
                {delivery?.status === 'picked_up' && (
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 text-white shadow-xl animate-in slide-in-from-bottom-4 mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/20 rounded-full text-primary"><MapPin className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-bold">En Camino</h3>
                                <p className="text-white/60 text-xs">Tu repartidor está cerca</p>
                            </div>
                        </div>

                        {/* Fake Map */}
                        <div className="h-48 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden mb-4 group cursor-pointer">
                            <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(order.delivery_address?.street || "Restaurante")}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                className="w-full h-full opacity-60 grayscale group-hover:grayscale-0 transition-all"
                            />
                            <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 border border-white/10 text-xs font-bold uppercase">
                                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                En vivo
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold text-black text-lg">
                                    {(delivery.profiles?.full_name || "D").charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold">{delivery.profiles?.full_name || "Repartidor"}</p>
                                    <p className="text-[10px] text-white/50 uppercase tracking-wider">Pargo Delivery</p>
                                </div>
                            </div>
                            {delivery.profiles?.phone && (
                                <a href={`tel:${delivery.profiles.phone}`} className="p-3 bg-emerald-500 rounded-full hover:bg-emerald-400 text-white transition-colors">
                                    <Phone className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* HELP & SUPPORT */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                    <div>
                        <h4 className="font-bold text-white mb-1">¿Necesitas ayuda con tu pedido?</h4>
                        <p className="text-sm text-slate-400">Contáctanos directamente al restaurante</p>
                    </div>
                    <a href={`https://wa.me/57${(businessInfo.phone || '3001234567').replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                        <Button variant="outline" className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white">
                            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                        </Button>
                    </a>
                </div>

            </div>
        </div>
    )
}

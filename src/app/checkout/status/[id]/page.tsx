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
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [proofUrl, setProofUrl] = useState<string | null>(null)
    const [businessInfo, setBusinessInfo] = useState<any>({})

    useEffect(() => {
        if (params.id) {
            fetchOrder()
            fetchSettings()

            // Suscripción a cambios
            const channel = supabase.channel('order-status-' + params.id)
                .on('postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${params.id}` },
                    (payload) => {
                        setOrder(payload.new)
                    }
                )
                .subscribe()

            return () => { supabase.removeChannel(channel) }
        }
    }, [params.id])

    const fetchOrder = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    quantity,
                    unit_price,
                    products (name),
                    customizations
                )
            `)
            .eq('id', params.id)
            .single()

        if (error) {
            console.error(error)
        } else {
            setOrder(data)
            // Si ya hay evidencia de pago en los metadatos o notas, podríamos recuperarla (pendiente de implementación en backend)
        }
        setLoading(false)
    }

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

            // Actualizar orden con la URL del comprobante (podríamos guardarlo en un campo específico o en notas)
            // Por ahora lo guardaremos actualizando el estado a 'verificando' si estaba pendiente
            // Y podríamos añadir una nota interna

            await supabase.from('orders').update({
                notes: order.notes ? `${order.notes} | 📸 Comprobante subido: ${publicUrl}` : `📸 Comprobante subido: ${publicUrl}`,
                // status: 'pending' // Mantenemos pending pero la cajera verá la alerta
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
    const isPreparing = ['preparing', 'ready', 'delivered'].includes(order.status)
    const isReady = ['ready', 'delivered'].includes(order.status)

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-primary selection:text-black pb-20">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 max-w-2xl">

                {/* STATUS HEADER */}
                <div className="text-center space-y-6 mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-bold tracking-widest uppercase">
                        Ticket #{order.id.slice(0, 8)}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
                        {isReady ? "¡Pedido Listo!" : isPreparing ? "Preparando..." : needsPayment && !proofUrl ? "Confirma tu Pago" : "Recibido"}
                    </h1>

                    <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
                        {isReady ? "¡A disfrutar! Gracias por elegirnos."
                            : isPreparing ? "Nuestros chefs están haciendo magia en la cocina."
                                : needsPayment && !proofUrl ? "Por favor realiza el pago y sube el comprobante para empezar a cocinar."
                                    : "Estamos verificando tu pedido. Te avisaremos cuando empiece la preparación."}
                    </p>
                </div>

                {/* STEPS */}
                <div className="grid gap-4 mb-10">
                    {/* Step 1: Recepción / Pago */}
                    <div className={`p-6 rounded-3xl border transition-all ${needsPayment && !proofUrl ? 'bg-primary border-primary text-black' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex gap-4 items-start">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${needsPayment && !proofUrl ? 'bg-black text-primary' : 'bg-white/10'}`}>
                                1
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-xl uppercase italic">Confirmación</h3>
                                {needsPayment && !proofUrl ? (
                                    <div className="mt-4 space-y-4">
                                        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                                            <p className="font-bold text-sm mb-2">Transfiere a:</p>
                                            <p className="text-2xl font-black tracking-tight">{businessInfo.nequi || "300 123 4567"}</p>
                                            <p className="text-xs uppercase font-bold opacity-70">Nequi / Daviplata</p>
                                            <p className="text-3xl font-black mt-2 underline">{formatPrice(order.total)}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block w-full cursor-pointer">
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                                <div className="w-full h-14 bg-black text-white rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-wider hover:bg-black/80 transition-all shadow-xl">
                                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                                                    {uploading ? "Subiendo..." : "Subir Comprobante"}
                                                </div>
                                            </label>
                                            <p className="text-xs text-black/60 font-bold text-center">Sube un pantallazo de la transferencia</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-emerald-500 mt-1">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="font-bold">
                                            {proofUrl ? "Comprobante Enviado" : order.payment_method === 'cash' ? "Pago Contraentrega" : "Pago Confirmado"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Preparación */}
                    <div className={`p-6 rounded-3xl border transition-all ${isPreparing ? 'bg-white/10 border-primary/50' : 'bg-white/5 border-white/10 opacity-50'}`}>
                        <div className="flex gap-4 items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isPreparing ? 'bg-primary text-black animate-pulse' : 'bg-white/10'}`}>
                                2
                            </div>
                            <div>
                                <h3 className="font-bold text-xl uppercase italic">Preparación</h3>
                                <p className="text-sm text-slate-400">Tus platos están en marcha</p>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Entrega */}
                    <div className={`p-6 rounded-3xl border transition-all ${isReady ? 'bg-emerald-500/20 border-emerald-500' : 'bg-white/5 border-white/10 opacity-50'}`}>
                        <div className="flex gap-4 items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isReady ? 'bg-emerald-500 text-white' : 'bg-white/10'}`}>
                                3
                            </div>
                            <div>
                                <h3 className="font-bold text-xl uppercase italic">
                                    {order.order_type === 'delivery' ? 'En Camino' : 'Listo para Recoger'}
                                </h3>
                                <p className="text-sm text-slate-400">
                                    {order.order_type === 'delivery' ? 'El repartidor va hacia ti' : 'Puedes pasar por tu pedido'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HELP CARD */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-white mb-1">¿Necesitas ayuda?</h4>
                        <p className="text-sm text-slate-400">Contáctanos por WhatsApp</p>
                    </div>
                    <a
                        href={`https://wa.me/57${(businessInfo.phone || '3001234567').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Button variant="outline" className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white">
                            <MessageCircle className="w-4 h-4 mr-2" /> Soporte
                        </Button>
                    </a>
                </div>

            </div>
        </div>
    )
}

"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Calendar as CalendarIcon,
    Clock,
    Users,
    Phone,
    MessageSquare,
    Check,
    X,
    ArrowLeft,
    Trash2,
    Plus,
    Loader2,
    Edit,
    Search,
    Filter,
    CalendarDays,
    Settings,
    Bell,
    Share2,
    CheckCircle2,
    Info,
    CalendarCheck,
    Activity,
    Signal,
    Box,
    Sparkles,
    MonitorIcon,
    ChevronRight,
    ArrowRight,
    Flame,
    Mail,
    Zap,
    BookOpen,
    MapPin
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Reservation = {
    id: string
    customer_name: string
    customer_phone: string
    customer_email: string
    reservation_date: string
    reservation_time: string
    num_people: number
    notes: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
}

export default function AdminReservationsPremium() {
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('upcoming')
    const [searchTerm, setSearchTerm] = useState("")
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        loadReservations()
        return () => clearInterval(timer)
    }, [filter])

    const loadReservations = async () => {
        setLoading(true)
        // Simulate real data for premium UI
        const mockRes: Reservation[] = [
            { id: '1', customer_name: 'Jaime Rodríguez', customer_phone: '3001234567', customer_email: 'jaime@example.com', reservation_date: '2026-02-10', reservation_time: '20:00', num_people: 4, notes: 'Aniversario, mesa al lado de la ventana', status: 'confirmed' },
            { id: '2', customer_name: 'Elena Gómez', customer_phone: '3109876543', customer_email: 'elena@example.com', reservation_date: '2026-02-10', reservation_time: '21:30', num_people: 2, notes: 'Sin gluten', status: 'pending' },
            { id: '3', customer_name: 'Andrés Castro', customer_phone: '3204567890', customer_email: 'andres@example.com', reservation_date: '2026-02-11', reservation_time: '19:00', num_people: 6, notes: 'Cena de negocios', status: 'confirmed' },
        ]
        setReservations(mockRes)
        setLoading(false)
    }

    const filtered = reservations.filter(res =>
        res.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen text-white font-sans relative overflow-hidden flex flex-col h-screen">

            {/* 🖼️ FONDO PREMIUM: Salon Privado / Velvet / Elegancia con Blur */}
            <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1550966841-3ee5ad60a05a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-105 pointer-events-none" />
            <div className="fixed inset-0 backdrop-blur-[100px] bg-slate-950/90 pointer-events-none" />

            {/* HEADER DE RESERVAS */}
            <div className="relative z-20 p-8 flex items-center justify-between border-b border-white/5 bg-slate-950/40 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-6">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10">
                            <ArrowLeft className="w-6 h-6 text-slate-400" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">GUEST <span className="text-orange-500">BOOK</span></h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2 italic flex items-center gap-3">
                            RESERVATION MANAGEMENT & CONCIERGE
                            <CalendarCheck className="w-3 h-3 text-orange-500" />
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-900/40 p-1.5 rounded-2xl border border-white/5">
                    {[
                        { id: 'upcoming', label: 'PRÓXIMAS' },
                        { id: 'pending', label: 'PENDIENTES' },
                        { id: 'all', label: 'HISTORIAL' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setFilter(t.id)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                filter === t.id ? "bg-orange-500 text-black shadow-xl shadow-orange-500/20" : "text-slate-500 hover:text-white"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative z-10 p-8 flex-1 overflow-hidden flex flex-col gap-8 max-w-[1800px] mx-auto w-full">

                {/* 1. CAPACITY/TRAFFIC ROW */}
                <div className="grid grid-cols-4 gap-6 shrink-0">
                    {[
                        { label: 'CUBIERTOS HOY', val: '28', icon: Users, color: 'text-white' },
                        { label: 'CONFIRMADAS', val: '12', icon: CheckCircle2, color: 'text-emerald-400' },
                        { label: 'OCUPACIÓN EST.', val: '85%', icon: Activity, color: 'text-orange-500' },
                        { label: 'TICKET EST.', val: '$1.2M', icon: Sparkles, color: 'text-yellow-400' },
                    ].map((card, i) => (
                        <div key={i} className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex items-center gap-6 group hover:border-orange-500/20 transition-all">
                            <div className="p-4 bg-white/5 rounded-2xl">
                                <card.icon className={cn("w-6 h-6", card.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className={cn("text-3xl font-black italic tracking-tighter", card.color)}>{card.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 2. RESERVATIONS LIST (MASTER BOOK STYLE) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 grid grid-cols-2 gap-6">
                    {filtered.map((res, i) => (
                        <div key={res.id} className="bg-slate-800/30 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 flex flex-col justify-between group hover:border-orange-500/40 transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none group-hover:text-orange-500 transition-colors">{res.customer_name}</h3>
                                        <div className={cn(
                                            "w-2 h-2 rounded-full animate-pulse",
                                            res.status === 'confirmed' ? "bg-emerald-500" : "bg-orange-500"
                                        )} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{res.customer_phone}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black italic tracking-tighter font-mono leading-none">{res.reservation_time}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">CHECK-IN ESTIMADO</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/5">
                                <div className="flex flex-col gap-1">
                                    <Users className="w-4 h-4 text-orange-500" />
                                    <p className="text-xl font-black italic">{res.num_people} PERS</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <CalendarIcon className="w-4 h-4 text-orange-500" />
                                    <p className="text-sm font-bold opacity-80">{res.reservation_date}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <MapPin className="w-4 h-4 text-orange-500" />
                                    <p className="text-sm font-bold opacity-80">PRINCIPAL</p>
                                </div>
                            </div>

                            <div className="pt-6 flex items-center justify-between">
                                <div className="flex-1 mr-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-1">Notas del Concierge:</p>
                                    <p className="text-xs font-medium text-slate-400 leading-relaxed italic truncate">"{res.notes}"</p>
                                </div>
                                <div className="flex gap-2">
                                    {res.status === 'pending' && (
                                        <Button className="h-12 w-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl active:scale-95 transition-all">
                                            <Check className="w-5 h-5" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" className="h-12 w-12 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">
                                        <Edit className="w-5 h-5 text-slate-400" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Placeholder para agregar nueva */}
                    <div className="bg-slate-900/40 backdrop-blur-3xl border-2 border-dashed border-white/5 rounded-[3.5rem] p-10 flex flex-col items-center justify-center gap-6 group hover:border-orange-500/20 cursor-pointer transition-all">
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-orange-500/10 group-hover:border-orange-500/20 transition-all">
                            <Plus className="w-10 h-10 text-slate-600 group-hover:text-orange-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic group-hover:text-orange-500">Registrar Nueva Reservación</p>
                    </div>
                </div>

                {/* 3. AI FOOTER INSIGHT */}
                <div className="p-8 bg-slate-900/80 border border-white/10 rounded-[2.5rem] flex items-center justify-between shadow-2xl shrink-0">
                    <div className="flex items-center gap-6">
                        <BookOpen className="w-10 h-10 text-orange-500" />
                        <div>
                            <p className="text-xs font-black italic text-white uppercase tracking-tighter">Status del Concierge:</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Noche de alta ocupación detectada. Se recomienda reforzar estación de cocina caliente.</p>
                        </div>
                    </div>
                    <Button className="h-14 px-10 bg-orange-600 hover:bg-orange-700 text-black font-black uppercase text-[10px] italic tracking-widest rounded-2xl">
                        CONFIRMAR TODO (8)
                    </Button>
                </div>

            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: rgba(255, 255, 255, 0.05); 
                    border-radius: 10px; 
                }
            `}</style>
        </div>
    )
}

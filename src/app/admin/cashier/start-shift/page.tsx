'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { startShift } from "@/actions/pos"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Sun, Moon, Sunset, Clock, User } from "lucide-react"
import { useEffect } from "react"

export default function StartShiftPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
                setUser({ ...user, profile })
            }
        }
        getUser()
    }, [])

    const handleStartShift = async (type: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'CUSTOM') => {
        setLoading(true)
        try {
            if (!user) return
            await startShift(user.id, type)
            router.push("/admin/cashier/open-box") // Siguiente paso lógico
        } catch (error: any) {
            alert(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-2xl w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">

                <div className="text-center space-y-4">
                    <div className="inline-flex p-4 rounded-3xl bg-primary/10 text-primary mb-4 ring-1 ring-primary/20">
                        <Clock className="w-12 h-12" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                        Iniciar <span className="text-primary">Jornada</span>
                    </h1>
                    <p className="text-lg text-gray-400 font-medium max-w-md mx-auto">
                        Hola, <span className="text-white font-bold">{user?.profile?.full_name || 'Cajero'}</span>.
                        Selecciona tu turno para comenzar a operar.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => handleStartShift('MORNING')}
                        disabled={loading}
                        className="group relative h-40 bg-[#111] hover:bg-primary border border-white/10 hover:border-primary rounded-[2rem] p-6 text-left transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all">
                            <Sun className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between group-hover:text-black">
                            <span className="p-3 bg-white/5 group-hover:bg-black/10 w-fit rounded-xl">
                                <Sun className="w-6 h-6" />
                            </span>
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Mañana</h3>
                                <p className="text-sm font-bold opacity-60">06:00 AM - 02:00 PM</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleStartShift('AFTERNOON')}
                        disabled={loading}
                        className="group relative h-40 bg-[#111] hover:bg-orange-500 border border-white/10 hover:border-orange-500 rounded-[2rem] p-6 text-left transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all">
                            <Sunset className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between group-hover:text-black">
                            <span className="p-3 bg-white/5 group-hover:bg-black/10 w-fit rounded-xl">
                                <Sunset className="w-6 h-6" />
                            </span>
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Tarde</h3>
                                <p className="text-sm font-bold opacity-60">02:00 PM - 10:00 PM</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleStartShift('NIGHT')}
                        disabled={loading}
                        className="group relative h-40 bg-[#111] hover:bg-indigo-500 border border-white/10 hover:border-indigo-500 rounded-[2rem] p-6 text-left transition-all duration-300 overflow-hidden md:col-span-2"
                    >
                        <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all">
                            <Moon className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between group-hover:text-white">
                            <span className="p-3 bg-white/5 group-hover:bg-white/10 w-fit rounded-xl">
                                <Moon className="w-6 h-6" />
                            </span>
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Noche / Cierre</h3>
                                <p className="text-sm font-bold opacity-60">10:00 PM - Cierre</p>
                            </div>
                        </div>
                    </button>
                </div>

                {loading && (
                    <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-bold text-sm tracking-widest uppercase">Asignando turno...</span>
                    </div>
                )}
            </div>
        </div>
    )
}

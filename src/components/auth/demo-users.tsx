"use client"

import { Button } from "@/components/ui/button"
import { Users, ChefHat, Wallet, ShieldCheck, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DemoUserProps {
    onSelect: (email: string, pass: string) => void
}

export function DemoUsers({ onSelect }: DemoUserProps) {
    const users = [
        {
            email: "demo@pargorojo.com",
            pass: "DemoUser2026!",
            role: "Administrador",
            icon: ShieldCheck,
            color: "text-primary",
            bg: "bg-primary/10"
        },
        {
            email: "andres.mesero@pargorojo.com",
            pass: "123456",
            role: "Mesero",
            icon: UserIcon,
            color: "text-blue-400",
            bg: "bg-blue-400/10"
        },
        {
            email: "elena.chef@pargorojo.com",
            pass: "123456",
            role: "Chef / Cocina",
            icon: ChefHat,
            color: "text-orange-400",
            bg: "bg-orange-400/10"
        },
        {
            email: "ana.caja@pargorojo.com",
            pass: "123456",
            role: "Cajero",
            icon: Wallet,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10"
        }
    ]

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-2 px-2">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">Acceso Rápido (Pruebas)</span>
                <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-1 gap-2">
                {users.map((user) => (
                    <button
                        key={user.email}
                        onClick={() => onSelect(user.email, user.pass)}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", user.bg)}>
                                <user.icon className={cn("w-5 h-5", user.color)} />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black uppercase italic tracking-tighter text-white">{user.role}</p>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{user.email}</p>
                            </div>
                        </div>
                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest px-2 py-1 bg-black/40 rounded-lg group-hover:text-primary transition-colors">
                            Seleccionar
                        </div>
                    </button>
                ))}
            </div>
            <p className="text-[9px] text-center text-gray-600 font-bold uppercase tracking-widest italic">
                Usa estos usuarios para probar los diferentes módulos del sistema.
            </p>
        </div>
    )
}

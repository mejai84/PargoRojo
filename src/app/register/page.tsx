
"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, Lock, User, Phone } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default function RegisterPage() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("")
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            // 1. Crear usuario en Auth
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        // El rol por defecto será 'customer' (cliente)
                    }
                }
            })

            if (error) throw error

            if (data.user) {
                // 2. Crear perfil explícitamente (si el trigger fallara o para asegurar datos extra)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        email: email,
                        full_name: fullName,
                        phone: phone,
                        role: 'user' // Rol base para clientes
                    })

                if (profileError) {
                    console.error("Error creating profile:", profileError)
                    // No bloqueamos, el usuario se creó
                }
            }

            setMessage({
                type: 'success',
                text: '¡Cuenta creada! Revisa tu correo para confirmar o inicia sesión.'
            })

            // Opcional: Auto-login o redirigir
            setTimeout(() => router.push('/login'), 2000)

        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Ocurrió un error al registrarse.'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
                <div className="p-8 text-center bg-white">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Crear Cuenta</h1>
                    <p className="text-gray-500 text-sm mt-2 font-medium">Únete a la familia Pargo Rojo</p>
                </div>

                <div className="p-8 pt-0 space-y-6">
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full h-14 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                <input
                                    type="email"
                                    required
                                    placeholder="tu@email.com"
                                    className="w-full h-14 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                <input
                                    type="tel"
                                    placeholder="Ej: 300 123 4567"
                                    className="w-full h-14 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full h-14 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 mt-4 hover:scale-[1.02] transition-transform"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "REGISTRARME"}
                        </Button>
                    </form>

                    {message && (
                        <div className={`p-4 rounded-xl text-center text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="text-center pt-4 border-t border-gray-50">
                        <p className="text-gray-400 font-medium text-sm">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login" className="text-primary font-black hover:underline">
                                Inicia Sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

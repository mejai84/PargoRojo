
"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, Lock, User, Phone, MapPin, Calendar, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default function RegisterPage() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("")
    const [address, setAddress] = useState("")
    const [city, setCity] = useState("")
    const [addressReference, setAddressReference] = useState("")
    const [birthDate, setBirthDate] = useState("")
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [privacyAccepted, setPrivacyAccepted] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        // Validaciones de campos legales
        if (!termsAccepted) {
            setMessage({ type: 'error', text: 'Debes aceptar los términos y condiciones.' })
            setLoading(false)
            return
        }

        if (!privacyAccepted) {
            setMessage({ type: 'error', text: 'Debes aceptar la política de privacidad.' })
            setLoading(false)
            return
        }

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
                const now = new Date().toISOString()

                // 2. Crear perfil con todos los campos adicionales
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        email: email,
                        full_name: fullName,
                        phone: phone || null,
                        address: address || null,
                        city: city || null,
                        address_reference: addressReference || null,
                        birth_date: birthDate || null,
                        role: 'user',
                        terms_accepted: termsAccepted,
                        privacy_accepted: privacyAccepted,
                        terms_accepted_at: termsAccepted ? now : null,
                        privacy_accepted_at: privacyAccepted ? now : null
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-12">
            <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
                <div className="p-8 text-center bg-white">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Crear Cuenta</h1>
                    <p className="text-gray-500 text-sm mt-2 font-medium">Únete a la familia Pargo Rojo</p>
                </div>

                <div className="p-8 pt-0 space-y-6">
                    <form onSubmit={handleRegister} className="space-y-6">
                        {/* SECCIÓN 1: DATOS BÁSICOS */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">
                                📋 Datos Básicos
                            </h3>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">Nombre Completo *</label>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">Email *</label>
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
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">Teléfono *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                        <input
                                            type="tel"
                                            required
                                            placeholder="300 123 4567"
                                            className="w-full h-14 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">Contraseña *</label>
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
                        </div>

                        {/* SECCIÓN 2: DIRECCIÓN DE ENTREGA */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">
                                🏠 Dirección de Entrega (Opcional)
                            </h3>
                            <p className="text-xs text-gray-500 -mt-2">
                                Guarda tu dirección para un checkout más rápido en tus pedidos
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">Ciudad / Barrio</label>
                                    <div className="relative">
                                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                        <input
                                            type="text"
                                            placeholder="Ej: Bogotá"
                                            className="w-full h-14 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">Fecha Nacimiento</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                        <input
                                            type="date"
                                            className="w-full h-14 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-900"
                                            value={birthDate}
                                            onChange={(e) => setBirthDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">Dirección Completa</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                    <input
                                        type="text"
                                        placeholder="Ej: Calle 123 # 45-67"
                                        className="w-full h-14 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">Referencias</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Cerca del parque, edificio azul"
                                    className="w-full h-14 px-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                    value={addressReference}
                                    onChange={(e) => setAddressReference(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* SECCIÓN 3: TÉRMINOS LEGALES */}
                        <div className="space-y-4 bg-amber-50 p-6 rounded-2xl border border-amber-200">
                            <h3 className="text-xs font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
                                ⚖️ Términos Legales *
                            </h3>

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    required
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="w-5 h-5 mt-0.5 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 leading-tight group-hover:text-gray-900">
                                    Acepto los{' '}
                                    <a href="#" className="text-primary font-bold hover:underline" onClick={(e) => e.preventDefault()}>
                                        Términos y Condiciones
                                    </a>{' '}
                                    del servicio *
                                </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    required
                                    checked={privacyAccepted}
                                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                    className="w-5 h-5 mt-0.5 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 leading-tight group-hover:text-gray-900">
                                    Acepto la{' '}
                                    <a href="#" className="text-primary font-bold hover:underline" onClick={(e) => e.preventDefault()}>
                                        Política de Privacidad
                                    </a>{' '}
                                    y el tratamiento de mis datos personales *
                                </span>
                            </label>

                            <p className="text-xs text-gray-500 italic">
                                * Campos obligatorios para completar el registro
                            </p>
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

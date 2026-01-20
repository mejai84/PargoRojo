
"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function AuthForm() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error
            router.push('/')
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Ocurrió un error al intentar ingresar.'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-sm space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            className="w-full h-11 pl-10 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground placeholder:text-muted-foreground/50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">Contraseña</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <input
                            type="password"
                            placeholder="Tu contraseña"
                            className="w-full h-11 pl-10 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground placeholder:text-muted-foreground/50"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 font-bold text-base bg-primary hover:bg-primary/90 mt-2"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Ingresando...
                        </>
                    ) : (
                        "Iniciar Sesión"
                    )}
                </Button>
            </form>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success'
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}>
                    {message.text}
                </div>
            )}
        </div>
    )
}

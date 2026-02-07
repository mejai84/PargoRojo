'use client'

import { useEffect, useState } from "react"
import { getUserPermissions, UserPermissions } from "@/lib/permissions"
import { supabase } from "@/lib/supabase/client"
import { ShieldCheck, XCircle, CheckCircle } from "lucide-react"

export default function DebugPermissionsPage() {
    const [perms, setPerms] = useState<UserPermissions | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const p = await getUserPermissions(user.id)
                setPerms(p)
            }
            setLoading(false)
        }
        load()
    }, [])

    if (loading) return <div className="p-10">Cargando permisos...</div>

    if (!perms) return <div className="p-10">No hay usuario activo</div>

    return (
        <div className="p-10 max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-primary" />
                Diagnóstico de Permisos
            </h1>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <span className="text-xs font-bold uppercase text-slate-500">Rol Actual</span>
                        <p className="text-lg font-mono font-bold">{perms.role}</p>
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase text-slate-500">Es Admin?</span>
                        <p className="text-lg font-bold">
                            {perms.isAdmin ?
                                <span className="text-emerald-500">SÍ (Acceso Total)</span> :
                                <span className="text-slate-500">NO</span>
                            }
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider border-b pb-2">Permisos Granulares Asignados</h3>

                    {perms.isAdmin ? (
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center gap-3">
                            <CheckCircle className="w-5 h-5" />
                            <span>Como administrador, tienes todos los permisos implícitamente.</span>
                        </div>
                    ) : (
                        perms.permissions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {perms.permissions.map(p => (
                                    <div key={p} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-100 shadow-sm">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        <span className="font-mono text-sm">{p}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-amber-50 text-amber-700 p-4 rounded-lg flex items-center gap-3">
                                <XCircle className="w-5 h-5" />
                                <span>No tienes permisos granulares asignados explícitamente.</span>
                            </div>
                        )
                    )}
                </div>
            </div>

            <div className="text-xs text-slate-400">
                <p>Nota: Los permisos se cargan desde la tabla 'user_permissions'.</p>
                <p>Si eres 'admin', la lista estará vacía porque tienes acceso total por defecto.</p>
            </div>
        </div>
    )
}

"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Plus,
    QrCode,
    Download,
    Edit,
    Trash2,
    MapPin,
    Users,
    Loader2,
    ArrowLeft,
    LayoutGrid,
    Map as MapIcon,
    Save,
    RefreshCw,
    X,
    Maximize2,
    RotateCcw,
    Circle,
    Square as SquareIcon,
    Flame,
    ArrowLeftRight
} from "lucide-react"
import Link from "next/link"
import QRCodeStyling from "qr-code-styling"
import { cn } from "@/lib/utils"
import { transferOrderBetweenTables } from "@/actions/orders-fixed"

type Table = {
    id: string
    table_number: number
    table_name: string
    capacity: number
    qr_code: string
    status: string
    location: string
    active: boolean
    parent_table_id?: string
    is_merged?: boolean
    x_pos: number
    y_pos: number
    width: number
    height: number
    rotation: number
    shape: 'rectangle' | 'circle' | 'square'
}

export default function TablesAdminPage() {
    const [tables, setTables] = useState<Table[]>([])
    const [loading, setLoading] = useState(true)
    const [isVisualView, setIsVisualView] = useState(false)
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [savingLayout, setSavingLayout] = useState(false)
    const [activeZone, setActiveZone] = useState<string>("TODAS")
    const [isHeatmapMode, setIsHeatmapMode] = useState(false)
    const [tableSales, setTableSales] = useState<Record<string, number>>({})

    // Transferencia de Pedidos
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
    const [transferSourceTable, setTransferSourceTable] = useState<Table | null>(null)
    const [transferTargetTableId, setTransferTargetTableId] = useState<string>("")
    const [activeOrderToTransfer, setActiveOrderToTransfer] = useState<string | null>(null)

    // ... (rest of states and effects)

    const initiateTransfer = async (table: Table) => {
        // Verificar si la mesa tiene orden activa
        const { data: order } = await supabase
            .from('orders')
            .select('id')
            .eq('table_id', table.id)
            .in('status', ['pending', 'preparing', 'ready', 'delivered'])
            .single()

        if (!order) {
            alert("Esta mesa no tiene un pedido activo para transferir.")
            return
        }

        setTransferSourceTable(table)
        setActiveOrderToTransfer(order.id)
        setIsTransferModalOpen(true)
    }

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeOrderToTransfer || !transferTargetTableId) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { alert("Sesión inválida"); return }

            const result = await transferOrderBetweenTables({
                order_id: activeOrderToTransfer,
                target_table_id: transferTargetTableId,
                user_id: user.id,
                reason: "Transferencia solicitada desde mapa de mesas"
            })

            if (result.success) {
                alert(result.message)
                setIsTransferModalOpen(false)
                setTransferSourceTable(null)
                setActiveOrderToTransfer(null)
                setTransferTargetTableId("")
                loadTables()
            }
        } catch (error: any) {
            alert(error.message)
        }
    }

    // Layout Editor State
    const [draggedTableId, setDraggedTableId] = useState<string | null>(null)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadTables()

        // 🚀 Realtime Subscription
        const channel = supabase.channel('tables-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
                loadTables()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const loadTables = async () => {
        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .order('table_number', { ascending: true })

        if (!error && data) {
            setTables(data as Table[])
        }
        setLoading(false)
    }

    const saveLayout = async () => {
        setSavingLayout(true)
        console.log('🔄 [SAVE LAYOUT] Iniciando guardado de layout...')

        try {
            // 1. Verificar autenticación
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                throw new Error('Usuario no autenticado')
            }
            console.log('✅ [AUTH] Usuario autenticado:', user.email)

            // 2. Verificar permisos del usuario
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profileError || !profile) {
                throw new Error('No se pudo verificar el rol del usuario')
            }
            console.log('✅ [PERMISOS] Rol del usuario:', profile.role)

            if (!['admin', 'staff', 'waiter'].includes(profile.role)) {
                throw new Error(`Rol insuficiente: ${profile.role}. Se requiere admin/staff/waiter`)
            }

            // 3. Validar que hay mesas para guardar
            if (!tables || tables.length === 0) {
                throw new Error('No hay mesas para guardar')
            }
            console.log(`📊 [DATOS] Guardando ${tables.length} mesas...`)

            // 4. Preparar datos con validación
            const updates = tables.map((t, index) => {
                const update = {
                    id: t.id,
                    table_number: t.table_number,
                    table_name: t.table_name,
                    x_pos: Math.round(t.x_pos),
                    y_pos: Math.round(t.y_pos),
                    width: t.width || 120,
                    height: t.height || 120,
                    rotation: t.rotation || 0,
                    shape: t.shape || 'rectangle',
                    capacity: t.capacity,
                    location: t.location,
                    qr_code: t.qr_code,
                    status: t.status,
                    active: t.active
                }

                // Log del primer registro para debugging
                if (index === 0) {
                    console.log('📋 [SAMPLE] Ejemplo de datos a guardar:', update)
                }

                return update
            })

            // 5. Ejecutar update
            console.log('💾 [UPSERT] Ejecutando upsert en Supabase...')
            const { data, error, count } = await supabase
                .from('tables')
                .upsert(updates, {
                    onConflict: 'id',
                    count: 'exact'
                })
                .select()

            if (error) {
                console.error('❌ [ERROR] Error de Supabase:', error)
                throw error
            }

            console.log('✅ [SUCCESS] Layout guardado exitosamente')
            console.log(`📊 [RESULT] Registros actualizados: ${count || updates.length}`)

            if (data && data.length > 0) {
                console.log('✅ [VERIFY] Primer registro guardado:', data[0])
            }

            // 6. Recargar para verificar
            console.log('🔄 [RELOAD] Recargando mesas desde BD...')
            await loadTables()

            alert("✅ ¡Layout guardado exitosamente!\n\n" +
                `🎯 ${count || updates.length} mesas actualizadas\n` +
                `📍 Las posiciones se han guardado correctamente`)

        } catch (error: any) {
            console.error('❌ [ERROR FATAL] Error saving layout:', error)
            console.error('Stack:', error.stack)

            // Mensaje de error más detallado para el usuario
            let userMessage = '❌ Error al guardar el layout:\n\n'

            if (error.message.includes('autenticado')) {
                userMessage += '🔒 Sesión expirada. Por favor, vuelve a iniciar sesión.'
            } else if (error.message.includes('permiso') || error.message.includes('Rol insuficiente')) {
                userMessage += `🚫 ${error.message}\n\nContacta al administrador para obtener permisos.`
            } else if (error.code === 'PGRST301') {
                userMessage += '🔒 Error de permisos en la base de datos.\nVerifica las políticas RLS de la tabla tables.'
            } else if (error.code === '42501') {
                userMessage += '🔒 Permiso denegado por PostgreSQL.\nEjecuta la migración 125_fix_tables_rls_and_permissions.sql'
            } else {
                userMessage += `⚠️ ${error.message}\n\n` +
                    `Código: ${error.code || 'N/A'}\n` +
                    `Revisa la consola para más detalles.`
            }

            alert(userMessage)
        } finally {
            setSavingLayout(false)
            console.log('🏁 [FINISH] Proceso de guardado finalizado')
        }
    }

    const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
        if (!isVisualView) return
        e.preventDefault()
        const table = tables.find(t => t.id === tableId)
        if (!table) return

        setDraggedTableId(tableId)
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggedTableId || !containerRef.current) return

        const containerRect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - containerRect.left - offset.x
        const y = e.clientY - containerRect.top - offset.y

        // 📏 GRID SNAP: 20px
        const snappedX = Math.round(x / 20) * 20
        const snappedY = Math.round(y / 20) * 20

        setTables(prev => prev.map(t =>
            t.id === draggedTableId
                ? { ...t, x_pos: Math.max(0, snappedX), y_pos: Math.max(0, snappedY) }
                : t
        ))
    }

    const handleMouseUp = () => {
        setDraggedTableId(null)
    }

    const loadHeatmapData = async () => {
        const { data: sales } = await supabase
            .from('orders')
            .select('table_id, total')
            .not('table_id', 'is', null)

        const salesMap: Record<string, number> = {}
        sales?.forEach(order => {
            if (order.table_id) {
                salesMap[order.table_id] = (salesMap[order.table_id] || 0) + (order.total || 0)
            }
        })
        setTableSales(salesMap)
    }

    const toggleHeatmap = async () => {
        if (!isHeatmapMode) {
            await loadHeatmapData()
        }
        setIsHeatmapMode(!isHeatmapMode)
    }

    const getHeatColor = (tableId: string) => {
        const revenue = tableSales[tableId] || 0
        if (revenue === 0) return "bg-blue-500/10 border-blue-500/20 text-blue-500"

        const maxRevenue = Math.max(...Object.values(tableSales), 1)
        const intensity = (revenue / maxRevenue) * 100

        if (intensity > 80) return "bg-rose-600 border-rose-400 text-white shadow-[0_0_20px_rgba(225,29,72,0.5)]"
        if (intensity > 50) return "bg-orange-500 border-orange-300 text-white"
        if (intensity > 20) return "bg-amber-400 border-amber-200 text-black"
        return "bg-emerald-500/40 border-emerald-400/50 text-emerald-100"
    }

    const updateTableDimension = (id: string, field: 'width' | 'height' | 'rotation', value: number) => {
        setTables(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
    }

    const generateQRCode = (table: Table) => {
        const qrCode = new QRCodeStyling({
            width: 400,
            height: 400,
            type: "svg",
            data: `${window.location.origin}/menu-qr?table=${table.qr_code}`,
            image: "/images/logo.jpg",
            dotsOptions: { color: "#ff6b35", type: "rounded" },
            backgroundOptions: { color: "#000000" },
            imageOptions: { crossOrigin: "anonymous", margin: 10, imageSize: 0.4 },
            cornersSquareOptions: { color: "#ff6b35", type: "extra-rounded" },
            cornersDotOptions: { color: "#ff6b35", type: "dot" }
        })
        qrCode.download({ name: `mesa-${table.table_number}-qr`, extension: "png" })
    }

    const deleteTable = async (table: Table) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar la ${table.table_name}?`)) return
        setIsDeleting(table.id)
        const { error } = await supabase.from('tables').delete().eq('id', table.id)
        if (!error) loadTables()
        setIsDeleting(null)
    }

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedTable) return
        const formData = new FormData(e.currentTarget)
        const { error } = await supabase.from('tables').update({
            table_number: parseInt(formData.get('table_number') as string),
            table_name: formData.get('table_name'),
            capacity: parseInt(formData.get('capacity') as string),
            location: formData.get('location'),
            shape: formData.get('shape'),
            active: formData.get('active') === 'on'
        }).eq('id', selectedTable.id)

        if (!error) { setIsEditModalOpen(false); setSelectedTable(null); loadTables(); }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-transparent"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>

    return (
        <div className="min-h-screen bg-transparent text-slate-900 p-4 md:p-8 font-sans selection:bg-primary">
            <div className="max-w-[1600px] mx-auto space-y-10">

                {/* 🔝 ENTERPRISE HEADER */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-6">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-16 w-16 rounded-[2rem] bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                                <ArrowLeft className="w-6 h-6 text-slate-900" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none text-slate-900">Gestión de <span className="text-primary">Mesas</span></h1>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                                <LayoutGrid className="w-3 h-3" /> Control físico y digital del salón
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Zone Switcher */}
                        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 mr-4 font-black italic shadow-inner">
                            {["TODAS", "Interior", "Terraza", "Barra", "Salon VIP"].map(zone => (
                                <button
                                    key={zone}
                                    onClick={() => setActiveZone(zone)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[8px] uppercase tracking-widest transition-all",
                                        activeZone === zone ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-900"
                                    )}
                                >
                                    {zone}
                                </button>
                            ))}
                        </div>

                        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 mr-4 font-black italic shadow-inner">
                            <button
                                onClick={() => setIsVisualView(false)}
                                className={cn("px-6 py-2.5 rounded-xl text-[9px] uppercase tracking-widest transition-all", !isVisualView ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-900")}
                            >
                                LISTA
                            </button>
                            <button
                                onClick={() => setIsVisualView(true)}
                                className={cn("px-6 py-2.5 rounded-xl text-[9px] uppercase tracking-widest transition-all", isVisualView ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-900")}
                            >
                                DISEÑO 2D
                            </button>
                        </div>
                        {isVisualView && (
                            <Button
                                onClick={toggleHeatmap}
                                className={cn(
                                    "h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest italic transition-all gap-3 shadow-sm",
                                    isHeatmapMode ? "bg-orange-600 text-white shadow-xl shadow-orange-600/30" : "bg-white border border-slate-200 text-slate-400 hover:text-slate-900"
                                )}
                            >
                                <Flame className={cn("w-5 h-5", isHeatmapMode && "animate-pulse")} /> MAPA DE CALOR
                            </Button>
                        )}
                        {isVisualView && (
                            <Button onClick={saveLayout} disabled={savingLayout} className="h-14 px-8 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-slate-900 transition-all gap-3 shadow-sm">
                                {savingLayout ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} GUARDAR PLANO
                            </Button>
                        )}
                        {isVisualView && (
                            <Button
                                onClick={() => {
                                    if (confirm("¿Restablecer mesas fuera de rango? Esto las traerá al centro.")) {
                                        setTables(prev => prev.map((t, i) => ({
                                            ...t,
                                            x_pos: t.x_pos < 50 || t.y_pos < 50 ? (i % 4) * 250 + 100 : t.x_pos,
                                            y_pos: t.y_pos < 50 ? Math.floor(i / 4) * 250 + 100 : t.y_pos
                                        })))
                                    }
                                }}
                                className="h-14 px-6 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-slate-900 hover:text-white transition-all gap-2 shadow-sm"
                                title="Traer mesas perdidas al centro"
                            >
                                <RefreshCw className="w-5 h-5" /> RESCATAR
                            </Button>
                        )}
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-14 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-white transition-all shadow-xl shadow-primary/20 gap-3"
                        >
                            <Plus className="w-5 h-5" /> NUEVA MESA
                        </Button>
                    </div>
                </div>

                {/* 🗺️ VISUAL FLOOR MANAGER ENGINE */}
                {isVisualView ? (
                    <div className="space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase italic">
                                    <MapIcon className="w-4 h-4 text-primary" /> {isHeatmapMode ? "Analizando facturación por punto físico" : "Arrastra las mesas para organizar el salón"}
                                </div>
                                <div className="flex items-center gap-4">
                                    {!isHeatmapMode ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500/10 border border-emerald-500/30" />
                                                <span className="text-[8px] font-black uppercase text-slate-400">Libre</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-rose-500/10 border border-rose-500/30" />
                                                <span className="text-[8px] font-black uppercase text-slate-400">Ocupada</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-rose-600" />
                                                <span className="text-[8px] font-black uppercase text-rose-500">Popular</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-blue-500/40" />
                                                <span className="text-[8px] font-black uppercase text-blue-500">Frío</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="text-[9px] font-black text-primary uppercase italic tracking-widest bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                                GRID SNAP: 20PX ACTIVADO
                            </div>
                        </div>

                        <div
                            ref={containerRef}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className="relative w-full h-[750px] bg-slate-100 rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-inner pattern-grid"
                        >
                            <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                            {tables
                                .filter(t => activeZone === "TODAS" || t.location === activeZone)
                                .map(table => (
                                    <div
                                        key={table.id}
                                        onMouseDown={(e) => handleMouseDown(e, table.id)}
                                        style={{
                                            left: table.x_pos,
                                            top: table.y_pos,
                                            width: table.width,
                                            height: table.height,
                                            transform: `rotate(${table.rotation}deg)`,
                                        }}
                                        className={cn(
                                            "absolute cursor-move transition-all duration-500 flex items-center justify-center font-black italic select-none group border-2 z-10",
                                            table.shape === 'circle' ? "rounded-full" : "rounded-3xl",
                                            isHeatmapMode ? getHeatColor(table.id) : (
                                                table.status === 'occupied' ? "bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-lg shadow-rose-500/10" :
                                                    table.status === 'reserved' ? "bg-amber-500/10 border-amber-500/40 text-amber-500" :
                                                        "bg-emerald-500/5 border-white/5 text-gray-500"
                                            ),
                                            draggedTableId === table.id && "z-50 ring-4 ring-primary/40 shadow-2xl opacity-80 cursor-grabbing",
                                            !isHeatmapMode && "hover:border-primary/50"
                                        )}
                                    >
                                        <div className="text-center relative z-10">
                                            <p className={cn("text-2xl font-black tracking-tighter leading-none", isHeatmapMode ? "text-white" : "text-slate-900")}>{table.table_number}</p>
                                            <p className="text-[8px] uppercase tracking-widest mt-1 opacity-40 group-hover:opacity-100 text-slate-400">
                                                {isHeatmapMode ? `$${(tableSales[table.id] || 0).toLocaleString()}` : `${table.capacity} PAX`}
                                            </p>
                                        </div>

                                        {/* Action Buttons for table tweaks */}
                                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-black border border-white/10 rounded-2xl p-1 gap-1 shadow-3xl z-50 animate-in slide-in-from-bottom-2 duration-300">
                                            <button onClick={(e) => { e.stopPropagation(); updateTableDimension(table.id, 'rotation', (table.rotation + 45) % 360) }} title="Rotar" className="w-10 h-10 rounded-xl hover:bg-white hover:text-black flex items-center justify-center transition-all"><RotateCcw className="w-4 h-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); updateTableDimension(table.id, 'width', table.width + 20) }} title="Aumentar Ancho" className="w-10 h-10 rounded-xl hover:bg-white hover:text-black flex items-center justify-center transition-all"><Maximize2 className="w-4 h-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); updateTableDimension(table.id, 'height', table.height + 20) }} title="Aumentar Alto" className="w-10 h-10 rounded-xl hover:bg-white hover:text-black flex items-center justify-center transition-all rotate-90"><Maximize2 className="w-4 h-4" /></button>
                                            <div className="w-px h-6 bg-white/10 self-center mx-1" />
                                            {table.status !== 'available' && (
                                                <button onClick={(e) => { e.stopPropagation(); initiateTransfer(table); }} title="Mover Pedido" className="w-10 h-10 rounded-xl hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all"><ArrowLeftRight className="w-4 h-4" /></button>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedTable(table); setIsEditModalOpen(true); }} className="w-10 h-10 rounded-xl hover:bg-primary hover:text-black flex items-center justify-center transition-all"><Edit className="w-4 h-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteTable(table); }} className="w-10 h-10 rounded-xl hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-700">
                        {tables
                            .filter(t => activeZone === "TODAS" || t.location === activeZone)
                            .map(table => (
                                <div key={table.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-6 hover:border-primary transition-all group relative overflow-hidden shadow-sm">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 text-primary group-hover:scale-125 transition-all">
                                        <QrCode className="w-12 h-12" />
                                    </div>

                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">{table.table_name}</h3>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 italic flex items-center gap-1.5"><MapPin className="w-3 h-3 text-primary" /> {table.location}</p>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border italic",
                                            table.status === 'available' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                        )}>
                                            {table.status}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                        <Users className="w-4 h-4 text-primary" /> CAPACIDAD: {table.capacity} PERSONAS
                                    </div>

                                    <div className="pt-4 flex gap-2">
                                        <Button onClick={() => generateQRCode(table)} variant="ghost" className="flex-1 h-12 bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all gap-2">
                                            <QrCode className="w-3.5 h-3.5" /> QR
                                        </Button>
                                        {table.status !== 'available' && (
                                            <Button onClick={(e) => { e.stopPropagation(); initiateTransfer(table); }} variant="ghost" className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center">
                                                <ArrowLeftRight className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button onClick={() => { setSelectedTable(table); setIsEditModalOpen(true); }} variant="ghost" className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl hover:bg-primary hover:text-black transition-all flex items-center justify-center">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button onClick={() => deleteTable(table)} variant="ghost" className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 p-10 rounded-[3rem] w-full max-w-xl animate-in zoom-in duration-300 shadow-3xl text-slate-900">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-8">Nueva <span className="text-primary">Mesa</span></h2>
                        <form className="space-y-6" onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const tNum = parseInt(formData.get('table_number') as string);

                            // 1. Insert in DB returning the new object
                            const { data: newTable, error } = await supabase.from('tables').insert({
                                table_number: tNum,
                                table_name: formData.get('table_name'),
                                capacity: parseInt(formData.get('capacity') as string),
                                location: formData.get('location'),
                                shape: formData.get('shape'),
                                qr_code: `TABLE-${tNum}-${Date.now()}`,
                                status: 'available',
                                x_pos: 400, // Safe position away from rounded corners
                                y_pos: 300,
                                width: 120,
                                height: 120,
                                rotation: 0
                            }).select().single();

                            if (!error && newTable) {
                                // 2. Add to local state without reloading (preserves unsaved moves)
                                setTables(prev => [...prev, newTable as Table]);
                                setIsAddModalOpen(false);
                            } else {
                                alert("Error al crear mesa.");
                            }
                        }}>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="table_number" type="number" placeholder="N° MESA" required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black italic" />
                                <input name="table_name" placeholder="NOMBRE (ej: VIP 1)" required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-bold italic" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="capacity" type="number" defaultValue={4} placeholder="PAX" className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black italic" />
                                <select name="location" className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black uppercase italic tracking-widest cursor-pointer">
                                    <option value="Interior">Interior</option>
                                    <option value="Terraza">Terraza</option>
                                    <option value="Barra">Barra</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Geometría de Mesa</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <label className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                                        <input type="radio" name="shape" value="rectangle" className="hidden" defaultChecked />
                                        <SquareIcon className="w-6 h-6 text-slate-400" />
                                        <span className="text-[8px] font-black uppercase text-slate-400">Rectang.</span>
                                    </label>
                                    <label className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                                        <input type="radio" name="shape" value="circle" className="hidden" />
                                        <Circle className="w-6 h-6 text-slate-400" />
                                        <span className="text-[8px] font-black uppercase text-slate-400">Circular</span>
                                    </label>
                                    <label className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                                        <input type="radio" name="shape" value="square" className="hidden" />
                                        <div className="w-6 h-6 border-2 border-slate-300 rounded-md" />
                                        <span className="text-[8px] font-black uppercase text-slate-400">Cuadrada</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <Button type="button" variant="ghost" className="flex-1 rounded-2xl font-black italic uppercase" onClick={() => setIsAddModalOpen(false)}>CANCELAR</Button>
                                <Button type="submit" className="flex-1 h-14 bg-primary text-black rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-slate-900 hover:text-white transition-all">GUARDAR</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditModalOpen && selectedTable && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 p-10 rounded-[3rem] w-full max-w-xl animate-in zoom-in duration-300 shadow-3xl text-slate-900">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-8">Editar <span className="text-primary">{selectedTable.table_name}</span></h2>
                        <form className="space-y-6" onSubmit={handleEditSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="table_number" type="number" defaultValue={selectedTable.table_number} required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black italic" />
                                <input name="table_name" defaultValue={selectedTable.table_name} required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-bold italic" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="capacity" type="number" defaultValue={selectedTable.capacity} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black italic" />
                                <select name="location" defaultValue={selectedTable.location} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black uppercase italic tracking-widest cursor-pointer">
                                    <option value="Interior">Interior</option>
                                    <option value="Terraza">Terraza</option>
                                    <option value="Barra">Barra</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Geometría de Mesa</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <label className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                                        <input type="radio" name="shape" value="rectangle" className="hidden" defaultChecked={selectedTable.shape === 'rectangle'} />
                                        <SquareIcon className="w-6 h-6 text-slate-400" />
                                        <span className="text-[8px] font-black uppercase text-slate-400">Rectang.</span>
                                    </label>
                                    <label className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                                        <input type="radio" name="shape" value="circle" className="hidden" defaultChecked={selectedTable.shape === 'circle'} />
                                        <Circle className="w-6 h-6 text-slate-400" />
                                        <span className="text-[8px] font-black uppercase text-slate-400">Circular</span>
                                    </label>
                                    <label className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                                        <input type="radio" name="shape" value="square" className="hidden" defaultChecked={selectedTable.shape === 'square'} />
                                        <div className="w-6 h-6 border-2 border-slate-300 rounded-md" />
                                        <span className="text-[8px] font-black uppercase text-slate-400">Cuadrada</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <Button type="button" variant="ghost" className="flex-1 rounded-2xl font-black italic uppercase" onClick={() => { setIsEditModalOpen(false); setSelectedTable(null); }}>CANCELAR</Button>
                                <Button type="submit" className="flex-1 h-14 bg-primary text-black rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-slate-900 hover:text-white transition-all">ACTUALIZAR</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isTransferModalOpen && transferSourceTable && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 p-10 rounded-[3rem] w-full max-w-xl animate-in zoom-in duration-300 shadow-3xl text-slate-900">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Mover Pedido</h2>
                        <p className="mb-6 text-slate-500 font-medium">
                            Transfiriendo pedido de <span className="text-primary font-black">{transferSourceTable.table_name}</span> a:
                        </p>

                        <form className="space-y-6" onSubmit={handleTransferSubmit}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Mesa de Destino</label>
                                <select
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black italic text-lg"
                                    value={transferTargetTableId}
                                    onChange={(e) => setTransferTargetTableId(e.target.value)}
                                    required
                                >
                                    <option value="">Seleccione mesa destino...</option>
                                    {tables
                                        .filter(t => t.id !== transferSourceTable.id) // Excluir origen
                                        .sort((a, b) => a.table_number - b.table_number)
                                        .map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.table_number} - {t.table_name} ({t.status === 'available' ? 'Libre' : 'Ocupada'})
                                            </option>
                                        ))
                                    }
                                </select>
                                <p className="text-[10px] text-amber-500 font-bold pl-2 pt-1 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                                    Si la mesa destino está ocupada, los pedidos se FUSIONARÁN.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="ghost" className="flex-1 rounded-2xl font-black italic uppercase" onClick={() => setIsTransferModalOpen(false)}>CANCELAR</Button>
                                <Button type="submit" className="flex-1 h-14 bg-primary text-black rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-slate-900 hover:text-white transition-all">
                                    CONFIRMAR
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

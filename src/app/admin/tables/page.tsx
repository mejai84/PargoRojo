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
    ArrowLeftRight,
    ArrowRight,
    Activity,
    ShieldCheck,
    Navigation,
    Layers,
    Signal,
    Box,
    Sparkles,
    MonitorIcon,
    ChevronRight,
    Zap
} from "lucide-react"
import Link from "next/link"
import QRCodeStyling from "qr-code-styling"
import { cn } from "@/lib/utils"
import { transferOrderBetweenTables } from "@/actions/orders-fixed"
import { toast } from "sonner"

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
    restaurant_id: string
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

    const initiateTransfer = async (table: Table) => {
        // Verificar si la mesa tiene orden activa
        const { data: order } = await supabase
            .from('orders')
            .select('id')
            .eq('table_id', table.id)
            .in('status', ['pending', 'preparing', 'ready', 'delivered', 'paying'])
            .single()

        if (!order) {
            toast.error("Esta mesa no tiene un pedido activo para transferir.")
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
            if (!user) { toast.error("Sesión inválida"); return }

            const result = await transferOrderBetweenTables({
                order_id: activeOrderToTransfer,
                target_table_id: transferTargetTableId,
                user_id: user.id,
                reason: "Transferencia solicitada desde mapa de mesas"
            })

            if (result.success) {
                toast.success(result.message)
                setIsTransferModalOpen(false)
                setTransferSourceTable(null)
                setActiveOrderToTransfer(null)
                setTransferTargetTableId("")
                loadTables()
            }
        } catch (error: any) {
            toast.error(error.message)
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

    const updateTableDimension = (id: string, field: keyof Table, value: number) => {
        setTables(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedTable) return

        const formData = new FormData(e.currentTarget as HTMLFormElement)
        const updatedTable = {
            ...selectedTable,
            table_number: parseInt(formData.get('table_number') as string),
            table_name: formData.get('table_name') as string,
            capacity: parseInt(formData.get('capacity') as string),
            location: formData.get('location') as string,
            shape: formData.get('shape') as Table['shape']
        }

        const { error } = await supabase
            .from('tables')
            .update({
                table_number: updatedTable.table_number,
                table_name: updatedTable.table_name,
                capacity: updatedTable.capacity,
                location: updatedTable.location,
                shape: updatedTable.shape
            })
            .eq('id', updatedTable.id)

        if (!error) {
            toast.success("Calibración de mesa guardada")
            setIsEditModalOpen(false)
            setSelectedTable(null)
            loadTables()
        } else {
            toast.error("Error al calibrar: " + error.message)
        }
    }

    const saveLayout = async () => {
        setSavingLayout(true)
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) throw new Error('Usuario no autenticado')

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, restaurant_id')
                .eq('id', user.id)
                .single()

            if (profileError || !profile) throw new Error('No se pudo verificar el rol del usuario')

            const updates = tables.map((t) => ({
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
                active: t.active,
                restaurant_id: profile.restaurant_id
            }))

            const { error } = await supabase.from('tables').upsert(updates, { onConflict: 'id' })
            if (error) throw error

            await loadTables()
            toast.success("Arquitectura del salón sincronizada")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSavingLayout(false)
        }
    }

    const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
        if (!isVisualView || isHeatmapMode) return
        e.preventDefault()
        setDraggedTableId(tableId)
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggedTableId || !containerRef.current) return
        const containerRect = containerRef.current.getBoundingClientRect()
        const snappedX = Math.round((e.clientX - containerRect.left - offset.x) / 20) * 20
        const snappedY = Math.round((e.clientY - containerRect.top - offset.y) / 20) * 20
        setTables(prev => prev.map(t => t.id === draggedTableId ? { ...t, x_pos: Math.max(0, snappedX), y_pos: Math.max(0, snappedY) } : t))
    }

    const handleMouseUp = () => setDraggedTableId(null)

    const toggleHeatmap = async () => {
        if (!isHeatmapMode) {
            const { data: sales } = await supabase.from('orders').select('table_id, total').not('table_id', 'is', null)
            const salesMap: Record<string, number> = {}
            sales?.forEach(order => { if (order.table_id) salesMap[order.table_id] = (salesMap[order.table_id] || 0) + (order.total || 0) })
            setTableSales(salesMap)
        }
        setIsHeatmapMode(!isHeatmapMode)
    }

    const getHeatColor = (tableId: string) => {
        const revenue = tableSales[tableId] || 0
        if (revenue === 0) return "bg-slate-500/10 border-slate-500/20 text-slate-500"
        const maxRevenue = Math.max(...Object.values(tableSales), 1)
        const intensity = (revenue / maxRevenue) * 100
        if (intensity > 80) return "bg-rose-500 border-rose-400 text-white shadow-[0_0_40px_rgba(244,63,94,0.4)]"
        if (intensity > 50) return "bg-orange-500 border-orange-400 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)]"
        if (intensity > 20) return "bg-amber-400 border-amber-300 text-black shadow-[0_0_20px_rgba(251,191,36,0.2)]"
        return "bg-emerald-500/40 border-emerald-400/50 text-emerald-950"
    }

    const generateQRCode = (table: Table) => {
        const qrCode = new QRCodeStyling({
            width: 600, height: 600, type: "svg",
            data: `${window.location.origin}/menu-qr?table=${table.qr_code}`,
            image: "/logo.png",
            dotsOptions: { color: "#ff4d00", type: "rounded" },
            backgroundOptions: { color: "#ffffff" },
            imageOptions: { crossOrigin: "anonymous", margin: 15, imageSize: 0.4 },
            cornersSquareOptions: { color: "#000000", type: "extra-rounded" },
            cornersDotOptions: { color: "#ff4d00", type: "dot" }
        })
        qrCode.download({ name: `MESA-${table.table_number}-PARGOROJO`, extension: "png" })
        toast.success(`Código QR de Mesa ${table.table_number} descargado`)
    }

    const deleteTable = async (table: Table) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar la ${table.table_name}?`)) return
        setIsDeleting(table.id)
        const { error } = await supabase.from('tables').delete().eq('id', table.id)
        if (!error) loadTables()
        setIsDeleting(null)
        toast.info("Mesa eliminada del sistema")
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-8 animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic animate-pulse">Arquitectando Salón Digital...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* 🌌 AMBIANCE LAYER */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -bottom-40 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-20 z-0 animate-pulse" />

            <div className="max-w-[1700px] mx-auto space-y-16 animate-in fade-in duration-1000 relative z-10">

                {/* 🚀 TABLE MANAGEMENT HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 border-b border-border/50 pb-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-20 w-20 rounded-[2.5rem] bg-card border border-border shadow-3xl hover:bg-muted active:scale-90 transition-all group overflow-hidden relative">
                                <ArrowLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-foreground">GEOMETRÍA <span className="text-primary italic">SALÓN</span></h1>
                                <div className="px-5 py-2 bg-primary/10 border-2 border-primary/20 rounded-[1.5rem] text-[11px] font-black text-primary tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                    <Activity className="w-3 h-3" />
                                    FLOOR_PLAN_ENGINE_V2
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                <LayoutGrid className="w-5 h-5 text-primary" /> Visualización Dinámica, Control de Aforo & Mapas de Calor
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        {/* Zone Switcher */}
                        <div className="flex bg-card/60 backdrop-blur-md p-2 rounded-[2rem] border-2 border-border/40 shadow-xl">
                            {["TODAS", "Interior", "Terraza", "Barra", "VIP"].map(zone => (
                                <button
                                    key={zone}
                                    onClick={() => {
                                        setActiveZone(zone)
                                        toast.info(`FILTRANDO ZONA: ${zone}`)
                                    }}
                                    className={cn(
                                        "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                                        (activeZone === zone) ? "bg-primary text-black shadow-lg" : "text-muted-foreground/40 hover:text-foreground"
                                    )}
                                >
                                    {zone}
                                </button>
                            ))}
                        </div>

                        <div className="flex bg-card/60 backdrop-blur-md p-2 rounded-[2rem] border-2 border-border/40 shadow-xl">
                            <button
                                onClick={() => {
                                    setIsVisualView(false)
                                    toast.info("VISTA DE LISTA ACTIVADA")
                                }}
                                className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic", !isVisualView ? "bg-primary text-black shadow-lg" : "text-muted-foreground/40 hover:text-foreground")}
                            >
                                LISTA
                            </button>
                            <button
                                onClick={() => {
                                    setIsVisualView(true)
                                    toast.info("VISTA DE DISEÑO 2D ACTIVADA")
                                }}
                                className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic", isVisualView ? "bg-primary text-black shadow-lg" : "text-muted-foreground/40 hover:text-foreground")}
                            >
                                DISEÑO 2D
                            </button>
                        </div>

                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-20 px-10 bg-foreground text-background hover:bg-primary hover:text-white font-black uppercase text-xs tracking-[0.4em] italic rounded-[2.5rem] shadow-3xl transition-all gap-5 border-none group active:scale-95"
                        >
                            <Plus className="w-7 h-7 group-hover:scale-110 transition-transform" />
                            NUEVA ENTIDAD_MESA
                        </Button>
                    </div>
                </div>

                {/* 🏗️ FLOOR PLAN ENGINE */}
                {isVisualView ? (
                    <div className="space-y-12 animate-in zoom-in-95 duration-700">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-card/40 backdrop-blur-3xl p-8 rounded-[4rem] border-4 border-border/20 shadow-3xl">
                            <div className="flex flex-wrap items-center gap-10">
                                <div className="flex items-center gap-4 text-[11px] font-black text-primary uppercase italic tracking-[0.4em]">
                                    <MapIcon className="w-6 h-6" /> {isHeatmapMode ? "MODO: ANÁLISIS DE FLUJO_MONETARIO" : "MODO: ARQUITECTURA ESPACIAL ACTIVE"}
                                </div>
                                <div className="h-10 w-px bg-border/40 hidden md:block" />
                                <div className="flex items-center gap-8">
                                    {!isHeatmapMode ? (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                                                <span className="text-[10px] font-black uppercase text-muted-foreground/60 italic tracking-widest">LIBRE</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
                                                <span className="text-[10px] font-black uppercase text-muted-foreground/60 italic tracking-widest">OCUPADA</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full bg-rose-500" />
                                                <span className="text-[10px] font-black uppercase text-rose-500 italic tracking-widest">HOT ZONE</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full bg-blue-500" />
                                                <span className="text-[10px] font-black uppercase text-blue-500 italic tracking-widest">COLD ZONE</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <Button
                                    onClick={toggleHeatmap}
                                    className={cn(
                                        "h-16 px-8 rounded-2xl border-4 font-black uppercase text-[10px] tracking-widest italic transition-all gap-4 shadow-3xl relative overflow-hidden group/heat",
                                        isHeatmapMode
                                            ? "bg-rose-500 border-rose-500 text-white"
                                            : "bg-card border-border/40 text-muted-foreground hover:border-rose-500/40 hover:text-rose-500"
                                    )}
                                >
                                    <Flame className={cn("w-5 h-5", isHeatmapMode && "animate-pulse")} />
                                    {isHeatmapMode ? "DESACTIVAR ANÁLISIS" : "MAPA DE CALOR"}
                                </Button>
                                <Button
                                    onClick={saveLayout}
                                    disabled={savingLayout}
                                    className="h-16 px-8 bg-emerald-500 text-white hover:bg-emerald-600 border-none rounded-2xl font-black uppercase text-[10px] tracking-widest italic transition-all gap-4 shadow-3xl shadow-emerald-500/20 active:scale-95"
                                >
                                    {savingLayout ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    SINCRONIZAR ARQUITECTURA
                                </Button>
                            </div>
                        </div>

                        <div
                            ref={containerRef}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className="relative w-full h-[900px] bg-card/60 backdrop-blur-md rounded-[5rem] border-4 border-border/40 overflow-hidden shadow-3xl blueprint-grid"
                        >
                            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, var(--foreground) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

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
                                            "absolute cursor-move transition-all duration-300 flex items-center justify-center font-black italic select-none group border-4 z-10",
                                            table.shape === 'circle' ? "rounded-full" : "rounded-[3.5rem]",
                                            isHeatmapMode ? getHeatColor(table.id) : (
                                                table.status === 'occupied' || table.status === 'paying'
                                                    ? "bg-rose-500 text-white border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse"
                                                    : table.status === 'reserved'
                                                        ? "bg-amber-500 text-white border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                                                        : "bg-card/80 backdrop-blur-md border-border/60 text-foreground hover:border-primary/50 transition-colors"
                                            ),
                                            draggedTableId === table.id && "z-50 ring-8 ring-primary/20 shadow-5xl opacity-80 cursor-grabbing scale-[1.05]",
                                        )}
                                    >
                                        <div className="text-center relative z-10 w-full p-4 overflow-hidden">
                                            <p className={cn("text-4xl font-black tracking-tighter leading-none transition-all duration-500",
                                                (table.status === 'occupied' || table.status === 'paying' || table.status === 'reserved' || isHeatmapMode) ? "text-white scale-110" : "text-foreground group-hover:text-primary"
                                            )}>{table.table_number}</p>
                                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mt-3 border-t-2 border-current/10 pt-2 transition-opacity group-hover:scale-110",
                                                (table.status === 'occupied' || table.status === 'paying' || table.status === 'reserved' || isHeatmapMode) ? "text-white/40" : "text-muted-foreground/30"
                                            )}>
                                                {isHeatmapMode ? `$${(tableSales[table.id] || 0).toLocaleString()}` : `${table.capacity} PAX`}
                                            </p>
                                        </div>

                                        {/* Precision Control Overlay */}
                                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-foreground text-background rounded-[2rem] p-2 gap-2 shadow-5xl z-50 animate-in slide-in-from-bottom-4 duration-500">
                                            <button onClick={(e) => { e.stopPropagation(); updateTableDimension(table.id, 'rotation', (table.rotation + 45) % 360) }} className="w-12 h-12 rounded-2xl hover:bg-primary hover:text-black flex items-center justify-center transition-all bg-muted/10" title="ROTAR ENTIDAD"><RotateCcw className="w-6 h-6" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); updateTableDimension(table.id, 'width', table.width + 20) }} className="w-12 h-12 rounded-2xl hover:bg-primary hover:text-black flex items-center justify-center transition-all bg-muted/10" title="ESCALA HORIZONTAL"><Maximize2 className="w-6 h-6" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); updateTableDimension(table.id, 'height', table.height + 20) }} className="w-12 h-12 rounded-2xl hover:bg-primary hover:text-black flex items-center justify-center transition-all rotate-90 bg-muted/10" title="ESCALA VERTICAL"><Maximize2 className="w-6 h-6" /></button>
                                            <div className="w-px h-8 bg-background/20 self-center mx-1" />
                                            {table.status !== 'available' && (
                                                <button onClick={(e) => { e.stopPropagation(); initiateTransfer(table); }} className="w-12 h-12 rounded-2xl hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all bg-muted/10" title="TRASLADAR FLUJO"><ArrowLeftRight className="w-6 h-6" /></button>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedTable(table); setIsEditModalOpen(true); }} className="w-12 h-12 rounded-2xl hover:bg-primary hover:text-black flex items-center justify-center transition-all bg-muted/10" title="CALIBRAR ATRIBUTOS"><Edit className="w-6 h-6" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteTable(table); }} className="w-12 h-12 rounded-2xl hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all bg-muted/10" title="PURGAR ENTIDAD"><Trash2 className="w-6 h-6" /></button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 animate-in fade-in duration-1000">
                        {tables
                            .filter(t => activeZone === "TODAS" || t.location === activeZone)
                            .map(table => (
                                <div key={table.id} className="bg-card border-4 border-border/40 rounded-[4.5rem] p-12 space-y-10 hover:border-primary/40 transition-all group/card relative overflow-hidden shadow-3xl active:scale-[0.98]">
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-primary group-hover/card:scale-150 group-hover/card:rotate-12 transition-all duration-1000 pointer-events-none">
                                        <QrCode className="w-32 h-32" />
                                    </div>

                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="space-y-4">
                                            <h3 className="text-4xl font-black italic uppercase tracking-tighter text-foreground leading-none group-hover/card:text-primary transition-colors">{table.table_name}</h3>
                                            <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic flex items-center gap-3"><MapPin className="w-4 h-4 text-primary" /> {table.location.toUpperCase()}</p>
                                        </div>
                                        <div className={cn(
                                            "px-5 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] border-2 italic transition-all shadow-xl",
                                            table.status === 'available' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse"
                                        )}>
                                            {table.status.toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-xl font-black text-foreground/80 uppercase tracking-tighter italic border-b-2 border-border/20 pb-8 relative z-10">
                                        <Users className="w-7 h-7 text-primary" />
                                        {table.capacity} <span className="text-[10px] text-muted-foreground tracking-[0.4em] ml-2">COMENSALES_MAX</span>
                                    </div>

                                    <div className="flex gap-4 relative z-10">
                                        <Button onClick={() => generateQRCode(table)} variant="ghost" className="flex-1 h-20 bg-muted/40 border-2 border-border/40 text-[10px] font-black uppercase tracking-[0.3em] italic rounded-[2rem] hover:bg-foreground hover:text-white transition-all gap-4 shadow-xl group/btn active:scale-95">
                                            <QrCode className="w-5 h-5 group-hover/btn:scale-110 transition-transform" /> QR INTEGRAL
                                        </Button>
                                        {(table.status !== 'available') && (
                                            <Button onClick={(e) => { e.stopPropagation(); initiateTransfer(table); }} variant="ghost" className="w-20 h-20 bg-blue-500/10 border-2 border-blue-500/20 rounded-[2rem] text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center shadow-xl active:scale-75">
                                                <ArrowLeftRight className="w-7 h-7" />
                                            </Button>
                                        )}
                                        <Button onClick={() => { setSelectedTable(table); setIsEditModalOpen(true); }} variant="ghost" className="w-20 h-20 bg-muted/40 border-2 border-border/40 rounded-[2rem] hover:bg-primary hover:text-black transition-all flex items-center justify-center shadow-xl active:scale-75">
                                            <Edit className="w-7 h-7" />
                                        </Button>
                                        <Button onClick={() => deleteTable(table)} variant="ghost" className="w-20 h-20 bg-rose-500/10 border-2 border-rose-500/20 rounded-[2rem] text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-xl active:scale-75">
                                            <Trash2 className="w-7 h-7" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {/* 🏷️ GLOBAL METRIC */}
                <div className="p-10 bg-foreground rounded-[4rem] text-background flex flex-col md:flex-row items-center justify-between shadow-3xl group/metric relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-background/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl group-hover/metric:rotate-12 transition-transform duration-500">
                            <MonitorIcon className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(255,77,0,0.6)]" />
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Master Tables Node</h4>
                            <p className="text-[10px] text-background/40 font-black uppercase tracking-[0.4em] italic leading-none">
                                SYSTEM v8.42 • KERNEL OPTIMIZED FOR REAL-TIME SPATIAL SYNC
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-12 mt-8 md:mt-0 relative z-10">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Total Nodes</p>
                            <p className="text-2xl font-black italic tracking-tighter text-emerald-500">{tables.length} MESAS ACTIVAS</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Node Status</p>
                            <p className="text-2xl font-black italic tracking-tighter text-white">SYNC_HEALTHY</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🛠️ TABLE MODAL REFINED */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-card border-4 border-primary/20 rounded-[5rem] w-full max-w-2xl p-16 shadow-[0_0_150px_rgba(255,102,0,0.15)] relative overflow-hidden group/modal animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/modal:scale-110 transition-transform duration-1000 rotate-12">
                            <LayoutGrid className="w-[450px] h-[450px]" />
                        </div>

                        <div className="flex justify-between items-start mb-16 relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-primary text-black flex items-center justify-center shadow-3xl">
                                        <Box className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                                        {isAddModalOpen ? 'CALIBRAR ' : 'MODULAR '}
                                        <span className="text-primary italic">NODO_MESA</span>
                                    </h2>
                                </div>
                                <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic pl-20 italic">
                                    {isEditModalOpen ? `IDENTIDAD: ${selectedTable?.table_name.toUpperCase()}` : 'PARÁMETROS DE ARQUITECTURA DIGITAL'}
                                </p>
                            </div>
                            <Button variant="ghost" className="h-16 w-16 rounded-[1.5rem] bg-muted/40 hover:bg-primary hover:text-white transition-all active:scale-90" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedTable(null); }}>
                                <X className="w-8 h-8" />
                            </Button>
                        </div>

                        <form className="space-y-12 relative z-10" onSubmit={isAddModalOpen ? (async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const tNum = parseInt(formData.get('table_number') as string);
                            const { data: newTable, error } = await supabase.from('tables').insert({
                                table_number: tNum,
                                table_name: formData.get('table_name'),
                                capacity: parseInt(formData.get('capacity') as string),
                                location: formData.get('location'),
                                shape: formData.get('shape'),
                                qr_code: `T${tNum}-${Math.random().toString(36).substr(2, 9)}`,
                                status: 'available',
                                x_pos: 200,
                                y_pos: 200,
                                width: 140,
                                height: 140,
                                rotation: 0,
                                restaurant_id: (await supabase.from('profiles').select('restaurant_id').eq('id', (await supabase.auth.getUser()).data.user?.id).single()).data?.restaurant_id
                            }).select().single();
                            if (!error && newTable) { setTables(prev => [...prev, newTable as Table]); setIsAddModalOpen(false); toast.success("Nueva mesa integrada al sistema"); } else toast.error("Error: " + error?.message);
                        }) : handleEditSubmit}>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4 group/field">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic">N° DE SISTEMA</label>
                                    <input name="table_number" type="number" defaultValue={selectedTable?.table_number} required className="w-full h-20 bg-muted/40 border-4 border-border rounded-[2.5rem] px-10 outline-none text-foreground focus:border-primary font-black italic text-2xl shadow-inner transition-all tracking-tighter" />
                                </div>
                                <div className="space-y-4 group/field">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic">ALIAS EN SALÓN</label>
                                    <input name="table_name" placeholder="EJ: VIP ZONA_ALPHA" defaultValue={selectedTable?.table_name} required className="w-full h-20 bg-muted/40 border-4 border-border rounded-[2.5rem] px-10 outline-none text-foreground focus:border-primary font-black italic text-xs tracking-[0.4em] shadow-inner transition-all uppercase placeholder:text-muted-foreground/10" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4 group/field">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic">AFORO COMENSALES</label>
                                    <input name="capacity" type="number" defaultValue={selectedTable?.capacity || 4} className="w-full h-20 bg-muted/40 border-4 border-border rounded-[2.5rem] px-10 outline-none text-foreground focus:border-primary font-black italic text-2xl shadow-inner transition-all tracking-tighter" />
                                </div>
                                <div className="space-y-4 group/field">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic">ZONA_CLUSTER</label>
                                    <div className="relative">
                                        <select name="location" defaultValue={selectedTable?.location || "Interior"} className="w-full h-20 bg-muted/40 border-4 border-border rounded-[2.5rem] px-10 outline-none text-foreground focus:border-primary font-black uppercase italic tracking-[0.3em] text-xs cursor-pointer shadow-inner appearance-none transition-all">
                                            <option value="Interior" className="bg-card">INTERIOR_SYS</option>
                                            <option value="Terraza" className="bg-card">TERRAZA_HUB</option>
                                            <option value="Barra" className="bg-card">BARRA_FLUX</option>
                                            <option value="VIP" className="bg-card">VIP_EXCLUSIVE</option>
                                        </select>
                                        <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-white/10 pointer-events-none rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic">MATRIZ GEOMÉTRICA</label>
                                <div className="grid grid-cols-3 gap-6">
                                    {[
                                        { id: 'rectangle', label: 'RADIAL', icon: SquareIcon },
                                        { id: 'circle', label: 'ESFÉRICA', icon: Circle },
                                        { id: 'square', label: 'MATRIX', icon: LayoutGrid },
                                    ].map((sh) => (
                                        <label key={sh.id} className="flex flex-col items-center gap-4 p-8 bg-muted/20 rounded-[3rem] border-4 border-border/40 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/10 transition-all hover:bg-muted/40 shadow-xl relative overflow-hidden group/opt active:scale-95">
                                            <input type="radio" name="shape" value={sh.id} className="hidden" defaultChecked={selectedTable?.shape === sh.id || (!selectedTable && sh.id === 'rectangle')} />
                                            <sh.icon className="w-10 h-10 text-muted-foreground/40 group-hover/opt:text-primary transition-all group-has-[:checked]/opt:text-primary group-has-[:checked]/opt:scale-120 group-has-[:checked]/opt:rotate-12" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 group-hover/opt:text-primary group-has-[:checked]/opt:text-primary">{sh.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-8 pt-10">
                                <Button type="button" variant="ghost" className="flex-1 h-24 rounded-[2.5rem] font-black italic uppercase tracking-[0.5em] text-muted-foreground/40 hover:bg-muted/10 transition-all" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedTable(null); }}>ABORTAR</Button>
                                <Button type="submit" className="flex-[2] h-24 bg-foreground text-background hover:bg-primary hover:text-white font-black rounded-[3rem] uppercase italic tracking-[0.4em] shadow-5xl transition-all border-none text-xl group active:scale-95">
                                    <span className="flex items-center gap-5">
                                        {isAddModalOpen ? 'CONSTRUIR NODO' : 'SALVAR CALIBRACIÓN'} <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform" />
                                    </span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🔄 TRANSFER MODAL REFINED */}
            {isTransferModalOpen && transferSourceTable && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[250] flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-card border-4 border-blue-500/20 rounded-[5rem] w-full max-w-2xl p-16 shadow-[0_0_150px_rgba(59,130,246,0.15)] animate-in zoom-in-105 duration-500 shadow-black/50 relative group/transfer">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/transfer:scale-110 transition-transform duration-1000 rotate-12">
                            <ArrowLeftRight className="w-[450px] h-[450px]" />
                        </div>

                        <div className="space-y-6 mb-16 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-3xl">
                                    <ArrowLeftRight className="w-8 h-8" />
                                </div>
                                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-foreground leading-none">MIGRACIÓN DE <span className="text-blue-500 italic">FLUJO</span></h1>
                            </div>
                            <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] italic pl-20 italic">
                                ORIGEN: MESA {transferSourceTable.table_number.toString().padStart(2, '0')}_NODE — ESTADO: ACTIVO
                            </p>
                        </div>

                        <form className="space-y-12 relative z-10" onSubmit={handleTransferSubmit}>
                            <div className="space-y-6">
                                <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-12 italic">DEFINIR DESTINO COMERCIAL</label>
                                <div className="relative">
                                    <select
                                        className="w-full h-24 bg-muted/40 border-4 border-border rounded-[3rem] px-12 outline-none text-foreground focus:border-blue-500 font-black italic text-3xl tracking-tighter appearance-none shadow-inner transition-all"
                                        value={transferTargetTableId}
                                        onChange={(e) => setTransferTargetTableId(e.target.value)}
                                        required
                                    >
                                        <option value="" className="bg-card">SELECCIONAR NODO DESTINO...</option>
                                        {tables
                                            .filter(t => t.id !== transferSourceTable.id)
                                            .sort((a, b) => a.table_number - b.table_number)
                                            .map(t => (
                                                <option key={t.id} value={t.id} className="bg-card text-lg py-4">
                                                    MESA {t.table_number.toString().padStart(2, '0')} — Cluster: {t.location.toUpperCase()} ({t.status === 'available' ? 'LIBRE' : 'OCUPADA'})
                                                </option>
                                            ))
                                        }
                                    </select>
                                    <ChevronRight className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 text-white/5 pointer-events-none rotate-90" />
                                </div>
                                <div className="p-8 bg-blue-500/5 rounded-[3rem] border-4 border-blue-500/20 flex gap-6 items-start shadow-inner">
                                    <div className="w-4 h-4 rounded-full bg-blue-500 mt-1 shrink-0 animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                                    <p className="text-[10px] text-blue-500/80 font-black leading-relaxed italic uppercase tracking-[0.2em]">
                                        PROTOCOL_SYNC: El proceso de migración transferirá todas las comandas, cargos y estado de servicio de la cuenta original a la entidad seleccionada. Si el destino posee un proceso activo, se ejecutará una FUSIÓN_FLUJO.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-8 pt-8">
                                <Button type="button" variant="ghost" className="flex-1 h-24 rounded-[2.5rem] font-black italic uppercase tracking-[0.6em] text-muted-foreground/40 hover:bg-muted/10 transition-all" onClick={() => setIsTransferModalOpen(false)}>ABORTAR_SYNC</Button>
                                <Button type="submit" className="flex-[2] h-24 bg-blue-600 text-white hover:bg-blue-500 font-black rounded-[3rem] uppercase italic tracking-[0.4em] shadow-5xl transition-all border-none text-xl group active:scale-95">
                                    <span className="flex items-center gap-5">CONFIRMAR MIGRACIÓN <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform" /></span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .blueprint-grid {
                    background-image: 
                        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 40px 40px;
                    background-position: center center;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,102,0,0.1); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,102,0,0.3); }
            `}</style>
        </div>
    )
}

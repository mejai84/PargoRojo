"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, Calendar, ArrowUpRight, ArrowLeft } from "lucide-react"
import Link from "next/link"

type KPI = {
    total_revenue_month: number
    total_orders_month: number
    avg_ticket: number
    total_customers: number
}

type DailySales = {
    day: string
    total_sales: number
    order_count: number
}

type TopProduct = {
    product_name: string
    total_quantity: number
    total_revenue: number
}

export default function ReportsPage() {
    const [kpis, setKpis] = useState<KPI | null>(null)
    const [dailySales, setDailySales] = useState<DailySales[]>([])
    const [topProducts, setTopProducts] = useState<TopProduct[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        // Load KPIs
        const { data: kpiData } = await supabase.rpc('get_dashboard_kpis')
        if (kpiData && kpiData[0]) setKpis(kpiData[0])

        // Load Daily Sales
        const { data: salesData } = await supabase.rpc('get_sales_daily')
        if (salesData) setDailySales(salesData)

        // Load Top Products
        const { data: productsData } = await supabase.rpc('get_top_products')
        if (productsData) setTopProducts(productsData)

        setLoading(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    // Calculate max value for charts scaling
    const maxSales = Math.max(...dailySales.map(d => d.total_sales), 1)

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Reportes y Analytics</h1>
                            <p className="text-muted-foreground">Métricas clave del negocio</p>
                        </div>
                    </div>
                </div>

                {/* KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-green-500/20 text-green-500">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-green-500/80 font-medium">Ventas del Mes</p>
                                <h3 className="text-2xl font-bold text-green-500">
                                    ${kpis?.total_revenue_month.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-500/80 font-medium">Pedidos del Mes</p>
                                <h3 className="text-2xl font-bold text-blue-500">
                                    {kpis?.total_orders_month}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-purple-500/80 font-medium">Ticket Promedio</p>
                                <h3 className="text-2xl font-bold text-purple-500">
                                    ${kpis?.avg_ticket.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-orange-500/20 text-orange-500">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-orange-500/80 font-medium">Clientes Totales</p>
                                <h3 className="text-2xl font-bold text-orange-500">
                                    {kpis?.total_customers}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-white/10">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Ventas Diarias (Últimos 30 días)
                        </h3>

                        <div className="h-64 flex items-end gap-2">
                            {dailySales.slice(0, 14).reverse().map((day, i) => {
                                const heightPercentage = (day.total_sales / maxSales) * 100
                                const date = new Date(day.day).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                                        {/* Tooltip */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-800 text-xs p-2 rounded pointer-events-none transition-opacity z-10 w-max whitespace-nowrap border border-white/10">
                                            <div className="font-bold">${day.total_sales.toLocaleString('es-CO')}</div>
                                            <div className="text-gray-400">{day.order_count} pedidos</div>
                                        </div>

                                        <div
                                            className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-sm"
                                            style={{ height: `${heightPercentage}%` }}
                                        />
                                        <div className="text-[10px] text-muted-foreground mt-2 rotate-0 truncate w-full text-center">
                                            {date}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-card rounded-2xl p-6 border border-white/10">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <ArrowUpRight className="w-5 h-5 text-green-500" />
                            Top Productos
                        </h3>
                        <div className="space-y-4">
                            {topProducts.map((product, i) => (
                                <div key={i} className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-bold text-sm text-muted-foreground">
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold">{product.product_name}</div>
                                            <div className="text-xs text-muted-foreground">{product.total_quantity} vendidos</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-green-500">
                                        ${product.total_revenue.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

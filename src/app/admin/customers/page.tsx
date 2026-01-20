"use client"

import { Users, Search, ShoppingBag, Phone, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

interface Customer {
    name: string
    phone: string
    totalOrders: number
    totalSpent: number
    lastOrder: string
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const fetchCustomers = async () => {
        setLoading(true)
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
        } else if (orders) {
            const customerMap = new Map<string, Customer>()

            orders.forEach(order => {
                const name = order.guest_info?.name || "Desconocido"
                const phone = order.guest_info?.phone || "Sin teléfono"
                const key = `${name}-${phone}`

                if (!customerMap.has(key)) {
                    customerMap.set(key, {
                        name,
                        phone,
                        totalOrders: 0,
                        totalSpent: 0,
                        lastOrder: order.created_at
                    })
                }

                const customer = customerMap.get(key)!
                customer.totalOrders += 1
                customer.totalSpent += (order.total || 0)
            })

            setCustomers(Array.from(customerMap.values()))
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchCustomers()
    }, [])

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">Gestiona la base de datos de tus clientes a partir de sus pedidos.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2 pl-10 outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p>Cargando base de datos...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="p-20 text-center text-muted-foreground">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <p>No se encontraron clientes.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-xs uppercase font-bold text-muted-foreground">
                            <tr>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Teléfono</th>
                                <th className="p-4 text-center">Pedidos</th>
                                <th className="p-4 text-right">Total Gastado</th>
                                <th className="p-4 text-right">Último Pedido</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCustomers.map((customer, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <span className="font-medium">{customer.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3 h-3" />
                                            {customer.phone}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                            {customer.totalOrders}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-primary">
                                        {customer.totalSpent.toFixed(2)}€
                                    </td>
                                    <td className="p-4 text-right text-sm text-muted-foreground">
                                        {new Date(customer.lastOrder).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

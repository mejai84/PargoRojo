import { Users, Search, ShoppingBag, Phone, Loader2, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/utils"

interface Customer {
    id?: string
    name: string
    email?: string
    phone: string
    totalOrders: number
    totalSpent: number
    lastOrder: string
    points: number
    type: 'user' | 'guest'
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const fetchCustomers = async () => {
        setLoading(true)

        // Fetch registered profiles
        const { data: profiles } = await supabase.from('profiles').select('*')

        // Fetch all orders to calculate totals
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
        } else if (orders) {
            const customerMap = new Map<string, Customer>()

            // 1. Process orders
            orders.forEach(order => {
                const userId = order.user_id
                const guestName = order.guest_info?.name
                const guestPhone = order.guest_info?.phone

                const key = userId || `${guestName}-${guestPhone}`

                if (!customerMap.has(key)) {
                    // Try to find profile if linked
                    const profile = userId ? profiles?.find(p => p.id === userId) : null

                    customerMap.set(key, {
                        id: userId,
                        name: profile?.full_name || guestName || "Desconocido",
                        email: profile?.email || null,
                        phone: profile?.phone || guestPhone || "Sin teléfono",
                        totalOrders: 0,
                        totalSpent: 0,
                        lastOrder: order.created_at,
                        points: profile?.loyalty_points || 0,
                        type: userId ? 'user' : 'guest'
                    })
                }

                const customer = customerMap.get(key)!
                customer.totalOrders += 1
                customer.totalSpent += Number(order.total || 0)
            })

            // 2. Add profiles that haven't ordered yet
            profiles?.forEach(profile => {
                if (!customerMap.has(profile.id)) {
                    customerMap.set(profile.id, {
                        id: profile.id,
                        name: profile.full_name || "Usuario",
                        email: profile.email,
                        phone: profile.phone || "Sin teléfono",
                        totalOrders: 0,
                        totalSpent: 0,
                        lastOrder: 'Sin pedidos',
                        points: profile.loyalty_points || 0,
                        type: 'user'
                    })
                }
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
        c.phone.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">Gestiona la base de datos de tus clientes y sus puntos de lealtad.</p>
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 text-xs uppercase font-bold text-muted-foreground">
                                <tr>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4 text-center">Puntos</th>
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
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{customer.name}</span>
                                                    <span className="text-xs text-muted-foreground">{customer.email || customer.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                                                customer.type === 'user' ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/10 text-muted-foreground"
                                            )}>
                                                {customer.type === 'user' ? 'Registrado' : 'Invitado'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-yellow-500 font-bold">
                                                <Star className="w-3 h-3 fill-yellow-500" />
                                                {customer.points}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="bg-white/5 px-2 py-1 rounded-lg border border-white/5 font-medium">
                                                {customer.totalOrders}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-primary">
                                            {formatPrice(customer.totalSpent)}
                                        </td>
                                        <td className="p-4 text-right text-sm text-muted-foreground">
                                            {customer.lastOrder !== 'Sin pedidos' ? new Date(customer.lastOrder).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

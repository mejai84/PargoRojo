"use client"

import { Bell, Check, Package, Truck, CheckCircle2, XCircle } from "lucide-react"
import { useCustomerNotifications } from "@/lib/supabase/notifications"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export function CustomerNotifications() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useCustomerNotifications()

    if (isLoading) {
        return (
            <div className="bg-card rounded-2xl p-6 border border-white/10">
                <div className="animate-pulse">
                    <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-16 bg-white/10 rounded"></div>
                        <div className="h-16 bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    const getStatusIcon = (notification: any) => {
        const status = notification.data?.new_status
        switch (status) {
            case 'preparing':
                return <Package className="w-5 h-5 text-yellow-500" />
            case 'ready':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />
            case 'delivered':
                return <Truck className="w-5 h-5 text-blue-500" />
            case 'cancelled':
                return <XCircle className="w-5 h-5 text-red-500" />
            default:
                return <Bell className="w-5 h-5 text-primary" />
        }
    }

    const getStatusColor = (notification: any) => {
        const status = notification.data?.new_status
        switch (status) {
            case 'preparing':
                return 'border-yellow-500/20 bg-yellow-500/5'
            case 'ready':
                return 'border-green-500/20 bg-green-500/5'
            case 'delivered':
                return 'border-blue-500/20 bg-blue-500/5'
            case 'cancelled':
                return 'border-red-500/20 bg-red-500/5'
            default:
                return 'border-white/10 bg-white/5'
        }
    }

    return (
        <div className="bg-card rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="w-6 h-6 text-primary" />
                    Notificaciones
                    {unreadCount > 0 && (
                        <span className="bg-primary/20 text-primary text-sm px-3 py-1 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </h2>
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-sm gap-1"
                    >
                        <Check className="w-4 h-4" />
                        Marcar todas como leídas
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No tienes notificaciones</p>
                    <p className="text-sm mt-2">Te avisaremos cuando haya novedades con tus pedidos</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 rounded-xl border transition-all ${getStatusColor(notification)} ${!notification.read ? 'ring-2 ring-primary/20' : ''
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    {getStatusIcon(notification)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-bold text-base mb-1">
                                                {notification.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {new Date(notification.created_at).toLocaleString('es-CO', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => markAsRead(notification.id)}
                                                className="text-xs"
                                            >
                                                <Check className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

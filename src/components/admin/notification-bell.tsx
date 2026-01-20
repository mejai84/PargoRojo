"use client"

import { Bell, Check, X } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useNotifications } from "@/lib/supabase/notifications"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false)
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications()
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getNotificationLink = (notification: any) => {
        switch (notification.type) {
            case 'new_order':
                return '/admin/orders'
            case 'order_ready':
                return '/admin/kitchen'
            default:
                return '/admin'
        }
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_order':
                return '🛒'
            case 'order_ready':
                return '✅'
            case 'low_stock':
                return '⚠️'
            case 'new_customer':
                return '👤'
            default:
                return '🔔'
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-card border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <h3 className="font-bold flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" />
                            Notificaciones
                            {unreadCount > 0 && (
                                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                className="text-xs gap-1"
                            >
                                <Check className="w-3 h-3" />
                                Marcar todas
                            </Button>
                        )}
                    </div>

                    <div className="max-h-[500px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No hay notificaciones</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-white/5 transition-colors ${!notification.read ? 'bg-primary/5' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="text-2xl">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    href={getNotificationLink(notification)}
                                                    onClick={() => {
                                                        markAsRead(notification.id)
                                                        setIsOpen(false)
                                                    }}
                                                >
                                                    <div className="font-bold text-sm mb-1">
                                                        {notification.title}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {notification.message}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {new Date(notification.created_at).toLocaleTimeString('es-ES', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </Link>
                                            </div>
                                            <button
                                                onClick={() => clearNotification(notification.id)}
                                                className="p-1 hover:bg-white/10 rounded"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

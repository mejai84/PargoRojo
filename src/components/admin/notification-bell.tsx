"use client"

import { Bell, Check, X } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useAdminNotifications } from "@/lib/supabase/notifications"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface NotificationBellProps {
    variant?: 'sidebar' | 'header'
}

export function NotificationBell({ variant = 'sidebar' }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useAdminNotifications()
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
            case 'new_reservation':
                return '/admin/reservations'
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
            case 'new_reservation':
                return '📅'
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
            {variant === 'sidebar' ? (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all relative group shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase italic tracking-widest group-hover:text-slate-900">Notificaciones</span>
                    </div>
                    {unreadCount > 0 && (
                        <span className="flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full w-5 h-5 shadow-lg shadow-rose-500/30 animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-2xl relative hover:bg-slate-100 transition-colors"
                >
                    <Bell className="w-5 h-5 text-slate-400" />
                    {unreadCount > 0 && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                </button>
            )}

            {isOpen && (
                <div className={cn(
                    "absolute w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[200] overflow-hidden max-w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-2 duration-200",
                    variant === 'sidebar' ? "left-0 bottom-full mb-4" : "top-full right-0 mt-4 origin-top-right"
                )}>
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold flex items-center gap-2 truncate text-slate-900">
                            <Bell className="w-5 h-5 text-primary" />
                            <span className="truncate text-sm uppercase tracking-widest font-black italic">Notificaciones</span>
                            {unreadCount > 0 && (
                                <span className="bg-primary text-black text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0">
                                    {unreadCount}
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                className="text-[10px] gap-1 flex-shrink-0 text-slate-500 hover:text-primary uppercase font-bold tracking-wider"
                            >
                                <Check className="w-3 h-3" />
                                <span className="hidden sm:inline">Marcar Leídas</span>
                            </Button>
                        )}
                    </div>

                    <div className="max-h-[min(400px,60vh)] overflow-y-auto bg-white custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center text-slate-400">
                                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">Sin novedades</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-slate-50 transition-colors group relative ${!notification.read ? 'bg-primary/5' : ''
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="text-2xl flex-shrink-0 pt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    href={getNotificationLink(notification)}
                                                    onClick={() => {
                                                        markAsRead(notification.id)
                                                        setIsOpen(false)
                                                    }}
                                                    className="block"
                                                >
                                                    <div className="font-black text-xs uppercase tracking-tight text-slate-900 mb-1 line-clamp-1">
                                                        {notification.title}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                                        {notification.message}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-wider flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        {new Date(notification.created_at).toLocaleTimeString('es-ES', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </Link>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearNotification(notification.id);
                                                }}
                                                className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Eliminar notificación"
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
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            `}</style>
        </div>
    )
}

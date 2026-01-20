import { supabase } from './client'
import { useEffect, useState } from 'react'

export interface Notification {
    id: string
    type: 'new_order' | 'order_ready' | 'low_stock' | 'new_customer'
    title: string
    message: string
    read: boolean
    created_at: string
    data?: any
}

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        // Subscribe to new orders
        const ordersChannel = supabase.channel('new-orders')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    const newNotification: Notification = {
                        id: `order-${payload.new.id}`,
                        type: 'new_order',
                        title: '🔔 Nuevo Pedido',
                        message: `Pedido #${payload.new.id.substring(0, 8)} - ${payload.new.total.toFixed(2)}€`,
                        read: false,
                        created_at: new Date().toISOString(),
                        data: payload.new
                    }

                    addNotification(newNotification)

                    // Show browser notification if permitted
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(newNotification.title, {
                            body: newNotification.message,
                            icon: '/images/logo.jpg'
                        })
                    }

                    // Play sound
                    playNotificationSound()
                }
            )
            .subscribe()

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }

        return () => {
            supabase.removeChannel(ordersChannel)
        }
    }, [])

    const addNotification = (notification: Notification) => {
        setNotifications(prev => [notification, ...prev].slice(0, 50)) // Keep last 50
        setUnreadCount(prev => prev + 1)
    }

    const markAsRead = (notificationId: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    const clearNotification = (notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        const notification = notifications.find(n => n.id === notificationId)
        if (notification && !notification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
        }
    }

    const clearAll = () => {
        setNotifications([])
        setUnreadCount(0)
    }

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll
    }
}

const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.5
    audio.play().catch(err => console.log('Could not play sound:', err))
}

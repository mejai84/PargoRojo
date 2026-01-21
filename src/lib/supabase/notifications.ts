import { supabase } from './client'
import { useEffect, useState, useCallback } from 'react'

export interface Notification {
    id: string
    user_id?: string
    order_id?: string
    type: 'new_order' | 'order_status_change' | 'low_stock' | 'new_reservation' | 'new_customer'
    title: string
    message: string
    read: boolean
    created_at: string
    data?: any
}

// Hook para notificaciones de admin (cocina)
export const useAdminNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    // Cargar notificaciones existentes
    const loadNotifications = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error

            if (data) {
                setNotifications(data)
                setUnreadCount(data.filter(n => !n.read).length)
            }
        } catch (error) {
            console.error('Error loading notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadNotifications()

        // Suscribirse a nuevos pedidos
        const ordersChannel = supabase.channel('admin-new-orders')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    const newNotification: Notification = {
                        id: `order-${payload.new.id}-${Date.now()}`,
                        order_id: payload.new.id,
                        type: 'new_order',
                        title: '🔔 Nuevo Pedido',
                        message: `Pedido #${payload.new.id.substring(0, 8)} - $${payload.new.total.toLocaleString('es-CO')} COP`,
                        read: false,
                        created_at: new Date().toISOString(),
                        data: payload.new
                    }

                    addNotification(newNotification)

                    // Mostrar notificación del navegador
                    showBrowserNotification(newNotification)

                    // Reproducir sonido
                    playNotificationSound('new-order')
                }
            )
            .subscribe()

        // Suscribirse a notificaciones de la base de datos
        const notificationsChannel = supabase.channel('admin-notifications')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                },
                async (payload) => {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user && payload.new.user_id === user.id) {
                        addNotification(payload.new as Notification)
                        showBrowserNotification(payload.new as Notification)
                        playNotificationSound('notification')
                    }
                }
            )
            .subscribe()

        // Solicitar permiso para notificaciones del navegador
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }

        return () => {
            supabase.removeChannel(ordersChannel)
            supabase.removeChannel(notificationsChannel)
        }
    }, [loadNotifications])

    const addNotification = (notification: Notification) => {
        setNotifications(prev => [notification, ...prev].slice(0, 50))
        setUnreadCount(prev => prev + 1)
    }

    const markAsRead = async (notificationId: string) => {
        try {
            // Actualizar en la base de datos si existe
            const notification = notifications.find(n => n.id === notificationId)
            if (notification && notification.user_id) {
                await supabase
                    .from('notifications')
                    .update({ read: true })
                    .eq('id', notificationId)
            }

            // Actualizar localmente
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase
                    .from('notifications')
                    .update({ read: true })
                    .eq('user_id', user.id)
                    .eq('read', false)
            }

            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
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
        isLoading,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        refresh: loadNotifications
    }
}

// Hook para notificaciones de cliente
export const useCustomerNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    const loadNotifications = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setIsLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('type', 'order_status_change')
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) throw error

            if (data) {
                setNotifications(data)
                setUnreadCount(data.filter(n => !n.read).length)
            }
        } catch (error) {
            console.error('Error loading customer notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadNotifications()

        // Suscribirse a cambios de estado de pedidos del usuario
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const channel = supabase.channel('customer-notifications')
                .on('postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        const notification = payload.new as Notification
                        setNotifications(prev => [notification, ...prev].slice(0, 20))
                        setUnreadCount(prev => prev + 1)

                        // Mostrar notificación del navegador
                        showBrowserNotification(notification)

                        // Reproducir sonido
                        playNotificationSound('notification')
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        setupSubscription()

        // Solicitar permiso para notificaciones
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [loadNotifications])

    const markAsRead = async (notificationId: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId)

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase
                    .from('notifications')
                    .update({ read: true })
                    .eq('user_id', user.id)
                    .eq('read', false)
            }

            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refresh: loadNotifications
    }
}

// Función auxiliar para mostrar notificaciones del navegador
const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
            body: notification.message,
            icon: '/images/logo.jpg',
            badge: '/images/logo.jpg',
            tag: notification.id,
            requireInteraction: notification.type === 'new_order' // Requiere interacción para nuevos pedidos
        })

        // Cerrar automáticamente después de 10 segundos (excepto nuevos pedidos)
        if (notification.type !== 'new_order') {
            setTimeout(() => browserNotification.close(), 10000)
        }

        // Manejar clic en la notificación
        browserNotification.onclick = () => {
            window.focus()
            browserNotification.close()

            // Navegar a la página relevante
            if (notification.type === 'new_order') {
                window.location.href = '/admin/kitchen'
            } else if (notification.order_id) {
                window.location.href = '/cuenta'
            }
        }
    }
}

// Función para reproducir sonidos de notificación
const playNotificationSound = (type: 'new-order' | 'notification' = 'notification') => {
    try {
        const soundFile = type === 'new-order' ? '/sounds/new-order.mp3' : '/sounds/notification.mp3'
        const audio = new Audio(soundFile)
        audio.volume = type === 'new-order' ? 0.7 : 0.5

        // Reproducir el sonido
        audio.play().catch(err => {
            console.log('Could not play sound:', err)
            // Fallback: intentar con el sonido genérico
            if (type === 'new-order') {
                const fallbackAudio = new Audio('/sounds/notification.mp3')
                fallbackAudio.volume = 0.5
                fallbackAudio.play().catch(e => console.log('Fallback sound failed:', e))
            }
        })
    } catch (error) {
        console.error('Error playing notification sound:', error)
    }
}

// Función para solicitar permisos de notificación
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

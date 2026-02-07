import { supabase } from '@/lib/supabase/client'

export type Permission =
    | 'sell'
    | 'refund'
    | 'discount'
    | 'void_order'
    | 'open_cash'
    | 'close_cash'
    | 'view_reports'
    | 'manage_inventory'
    | 'manage_employees'
    | 'change_prices'
    | 'access_waiter_portal'
    | 'access_kitchen'
    | 'manage_reservations'

export interface UserPermissions {
    role: string
    permissions: Permission[]
    isAdmin: boolean
}

/**
 * Obtiene todos los permisos de un usuario específico.
 * Incluye lógica de Super Admin (role='admin' -> tiene todo).
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {

    // 1. Obtener Rol
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    const role = profile?.role || 'customer'
    const isAdmin = role === 'admin'

    // 2. Si es Admin, retornamos todo (o bandera especial)
    if (isAdmin) {
        return {
            role,
            permissions: [], // Admin implícito tiene acceso a todo
            isAdmin: true
        }
    }

    // 3. Obtener Permisos Granulares
    const { data: permissionsData } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', userId)

    const permissions = (permissionsData?.map(p => p.permission) || []) as Permission[]

    return {
        role,
        permissions,
        isAdmin: false
    }
}

/**
 * Helper rápido para componentes (Hook).
 * Uso: const { can } = usePermissions(user)
 */
export function checkPermission(userPerms: UserPermissions, required: Permission): boolean {
    if (userPerms.isAdmin) return true
    return userPerms.permissions.includes(required)
}

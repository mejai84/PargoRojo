# 🚀 MEJORAS SUGERIDAS - Sistema de Roles y Acceso

## 📊 ANÁLISIS DEL ESTADO ACTUAL

### ✅ Lo que Ya Funciona Bien

1. **Sistema de Roles Base**
   - Roles bien definidos (admin, cashier, waiter, cook, etc.)
   - Filtrado de menú según permisos
   - RLS en base de datos

2. **Creación de Empleados**
   - Formulario funcional
   - Asignación de roles
   - Integración con Supabase Auth

3. **Redirección Automática**
   - Cada perfil va a su página
   - ShiftGuard protege rutas

---

## 🎯 MEJORAS PRIORITARIAS (Top 5)

### 1. 🔐 **Sistema de Permisos Granular**

**Problema Actual**:
- Permisos basados solo en roles
- No se pueden personalizar permisos por empleado
- Un cajero tiene TODOS los permisos de cajero

**Solución Propuesta**:

#### Crear tabla `user_permissions`:

```sql
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    permission VARCHAR(50) NOT NULL,
    granted_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, permission)
);

-- Permisos disponibles
CREATE TYPE permission_type AS ENUM (
    'sell',                    -- Vender productos
    'refund',                  -- Hacer devoluciones
    'discount',                -- Aplicar descuentos
    'void_order',              -- Anular órdenes
    'open_cash',               -- Abrir caja
    'close_cash',              -- Cerrar caja
    'view_reports',            -- Ver reportes
    'manage_inventory',        -- Gestionar inventario
    'manage_employees',        -- Gestionar empleados
    'change_prices',           -- Cambiar precios
    'access_waiter_portal',    -- Acceso portal mesero
    'access_kitchen',          -- Acceso cocina
    'manage_reservations'      -- Gestionar reservas
);
```

#### Función helper para verificar permisos:

```typescript
// src/lib/permissions.ts
export async function hasPermission(
    userId: string, 
    permission: string
): Promise<boolean> {
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    // Admin siempre tiene todos los permisos
    if (profile?.role === 'admin') return true

    // Verificar permiso específico
    const { data } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', userId)
        .eq('permission', permission)
        .single()

    return !!data
}

// Uso en componentes:
const canRefund = await hasPermission(userId, 'refund')
if (canRefund) {
    // Mostrar botón de devolución
}
```

**Beneficio**:
- ✅ Control fino de qué puede hacer cada empleado
- ✅ Auditoría de quién otorgó cada permiso
- ✅ Flexibilidad para casos especiales

---

### 2. 📱 **Mejora de UX en Inicio de Turno**

**Problema Actual**:
- Modal de "MARCAR ENTRADA" muy genérico
- No muestra información de contexto
- No valida horario del turno

**Solución Propuesta**:

#### Componente mejorado de inicio de turno:

```typescript
// src/app/admin/cashier/start-shift/page.tsx (mejorado)

interface ShiftCardProps {
    shift: ShiftDefinition
    isCurrentShift: boolean
    onSelect: () => void
}

function ShiftCard({ shift, isCurrentShift, onSelect }: ShiftCardProps) {
    const now = new Date()
    const currentTime = now.toLocaleTimeString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit' 
    })

    return (
        <div className={cn(
            "p-6 rounded-2xl border-2 transition-all cursor-pointer",
            isCurrentShift 
                ? "border-primary bg-primary/5 scale-105" 
                : "border-gray-200 hover:border-primary/50"
        )}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{shift.name}</h3>
                {isCurrentShift && (
                    <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                        TURNO ACTUAL
                    </span>
                )}
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{shift.start_time} - {shift.end_time}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{shift.active_employees || 0} en turno ahora</span>
                </div>
            </div>

            <Button 
                onClick={onSelect}
                className="w-full mt-4"
                variant={isCurrentShift ? "default" : "outline"}
            >
                {isCurrentShift ? "INICIAR AHORA" : "Seleccionar Turno"}
            </Button>
        </div>
    )
}
```

**Beneficios**:
- ✅ Empleado ve claramente qué turno le corresponde
- ✅ Información de cuántos compañeros están en turno
- ✅ Validación inteligente de horarios

---

### 3. 🔔 **Sistema de Notificaciones en Tiempo Real**

**Problema Actual**:
- No hay notificaciones push
- Empleados no saben cuándo hay nuevos pedidos
- No hay alertas de eventos importantes

**Solución Propuesta**:

#### Sistema de notificaciones con Supabase Realtime:

```typescript
// src/hooks/useNotifications.ts
export function useNotifications(userRole: string) {
    const [notifications, setNotifications] = useState<Notification[]>([])

    useEffect(() => {
        // Suscribirse a nuevos pedidos (para cocina/meseros)
        if (['cook', 'chef', 'waiter'].includes(userRole)) {
            const channel = supabase
                .channel('new-orders')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `status=eq.PENDING`
                }, (payload) => {
                    // Mostrar notificación
                    showNotification({
                        title: '🍽️ Nuevo Pedido',
                        message: `Mesa ${payload.new.table_number}`,
                        sound: true,
                        priority: 'high'
                    })
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        // Suscribirse a eventos de caja (para cajeros/admins)
        if (['cashier', 'admin', 'manager'].includes(userRole)) {
            const channel = supabase
                .channel('cash-events')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'cashbox_sessions'
                }, (payload) => {
                    if (payload.eventType === 'UPDATE' && 
                        payload.new.status === 'CLOSED') {
                        showNotification({
                            title: '💰 Caja Cerrada',
                            message: `Diferencia: $${payload.new.difference_amount}`
                        })
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [userRole])

    return { notifications }
}
```

**Beneficios**:
- ✅ Empleados alertados en tiempo real
- ✅ Mejor coordinación del equipo
- ✅ Reducción de errores por pedidos perdidos

---

### 4. 📊 **Dashboard Personalizado por Rol**

**Problema Actual**:
- Vista `/admin` es genérica
- No muestra métricas relevantes para cada rol

**Solución Propuesta**:

#### Dashboards específicos:

```typescript
// src/app/admin/page.tsx (mejorado)

function AdminDashboard({ role }: { role: string }) {
    switch (role) {
        case 'cashier':
            return <CashierDashboard />
        case 'waiter':
            return <WaiterDashboard />
        case 'cook':
        case 'chef':
            return <KitchenDashboard />
        case 'manager':
            return <ManagerDashboard />
        default:
            return <GeneralDashboard />
    }
}

// Ejemplo: Dashboard de Cajero
function CashierDashboard() {
    const { sessiondata } = useCashboxSession()
    
    return (
        <div className="grid grid-cols-3 gap-6">
            {/* KPI Cards */}
            <KPICard 
                title="Ventas del Turno"
                value={`$${sessionData?.sales_total || 0}`}
                icon={DollarSign}
                trend="+12%"
            />
            
            <KPICard 
                title="Pedidos Completados"
                value={sessionData?.orders_count || 0}
                icon={ShoppingBag}
                trend="+5"
            />
            
            <KPICard 
                title="Balance de Caja"
                value={`$${sessionData?.current_balance || 0}`}
                icon={Wallet}
            />

            {/* Gráfico de ventas por hora */}
            <SalesChart data={sessionData?.hourly_sales} />

            {/* Últimas transacciones */}
            <RecentTransactions 
                transactions={sessionData?.recent_transactions} 
            />
        </div>
    )
}
```

**Beneficios**:
- ✅ Información relevante al alcance
- ✅ Mejora productividad
- ✅ Toma de decisiones más rápida

---

### 5. 🔐 **Auditoría Completa de Acciones**

**Problema Actual**:
- No hay rastro detallado de quién hizo qué
- Difícil investigar incidentes
- No se puede revertir cambios

**Solución Propuesta**:

#### Sistema de auditoría mejorado:

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

#### Trigger automático:

```sql
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        to_jsonb(OLD),
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas críticas
CREATE TRIGGER audit_orders
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_payments
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION log_audit();
```

**Beneficios**:
- ✅ Trazabilidad completa
- ✅ Cumplimiento normativo
- ✅ Detección de fraudes

---

## 🛠️ MEJORAS SECUNDARIAS

### 6. **Multi-idioma**
- Español/Inglés según región
- Facilita expansión internacional

### 7. **Modo Offline**
- Continuar operando sin internet
- Sincronizar cuando vuelva conexión

### 8. **App Móvil Nativa**
- PWA o React Native
- Notificaciones push nativas
- Mejor rendimiento en dispositivos

### 9. **Integración con Hardware**
- Impresoras térmicas
- Lectores de código de barras
- Básculas electrónicas

### 10. **BI y Analytics Avanzado**
- Predicción de demanda
- Análisis de tendencias
- Sugerencias automáticas

---

## 📋 PLAN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1 (Semana 1-2) - Crítico
1. ✅ Sistema de permisos granular
2. ✅ Auditoría completa
3. ✅ Mejora UX de inicio de turno

### Fase 2 (Semana 3-4) - Importante
4. ✅ Dashboards personalizados
5. ✅ Notificaciones en tiempo real

### Fase 3 (Mes 2) - Mejoras
6. ✅ Multi-idioma
7. ✅ Modo offline
8. ✅ Optimizaciones de rendimiento

### Fase 4 (Mes 3+) - Expansión
9. ✅ App móvil
10. ✅ Integraciones de hardware
11. ✅ BI y Analytics

---

## 🎯 RECOMENDACIÓN INMEDIATA

**Empezar por**:

1. **Sistema de Permisos Granular** (Impacto alto, esfuerzo medio)
   - Más control sobre empleados
   - Reduce riesgos de seguridad

2. **Auditoría Completa** (Impacto alto, esfuerzo bajo)
   - Solo triggers SQL
   - Protección inmediata

3. **Mejorar UX Inicio de Turno** (Impacto medio, esfuerzo bajo)
   - Mejor experiencia
   - Menos confusión

---

**¿Qué mejora te gustaría que implemente primero?**

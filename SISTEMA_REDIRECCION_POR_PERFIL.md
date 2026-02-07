# 🔀 SISTEMA DE REDIRECCIÓN AUTOMÁTICA POR PERFIL

## 📋 CÓMO FUNCIONA

Cuando un empleado hace clic en "Panel Admin" desde la navbar o accede directamente a `/admin`, el sistema lo redirige automáticamente a su página principal según su rol.

---

## 🎯 TABLA DE REDIRECCIONES

| Rol | Redirección Automática | Descripción |
|-----|------------------------|-------------|
| **ADMIN** | `/admin` | Vista general completa del sistema |
| **MANAGER** | `/admin` | Vista general de operaciones |
| **CAJERO** | `/admin/cashier/start-shift` | Inicio de turno y apertura de caja |
| **MESERO** | `/admin/waiter` | Portal del mesero para tomar órdenes |
| **COCINA/CHEF** | `/admin/kitchen` | KDS (Kitchen Display System) |
| **HOST** | `/admin/reservations` | Sistema de reservas y agenda |

---

## 💻 IMPLEMENTACIÓN

### Archivo: `src/components/admin/shift-guard.tsx`

```typescript
// REDIRECCIÓN AUTOMÁTICA SEGÚN EL ROL (solo para /admin exacto)
if (pathname === '/admin') {
    const roleRedirects: Record<string, string> = {
        'cashier': '/admin/cashier/start-shift',
        'waiter': '/admin/waiter',
        'cook': '/admin/kitchen',
        'chef': '/admin/kitchen',
        'host': '/admin/reservations'
    }

    if (roleRedirects[role]) {
        router.push(roleRedirects[role])
        return
    }
}
```

### ¿Por Qué en ShiftGuard?

El `ShiftGuard` envuelve todo el panel de administración y se ejecuta **antes** de renderizar cualquier contenido. Esto permite:

1. ✅ Verificar el rol del usuario
2. ✅ Redirigir inmediatamente a su página
3. ✅ Evitar que vean contenido no autorizado
4. ✅ Mejorar la experiencia de usuario

---

## 🔄 FLUJOS COMPLETOS

### Flujo 1: Cajero hace Login

```
1. Login con cajera@pargorojo.com
   ↓
2. Click "Panel Admin" en navbar
   ↓
3. Navegación: /admin
   ↓
4. ShiftGuard detecta: role = 'cashier'
   ↓
5. Redirección automática: /admin/cashier/start-shift
   ↓
6. Si NO tiene turno activo:
   → Ver opciones de turno (Mañana/Tarde/Noche)
   ↓
7. Si SÍ tiene turno activo:
   → Redirección a: /admin/cashier
   ↓
8. Dashboard de caja ✅
```

### Flujo 2: Mesero hace Login

```
1. Login como mesero@pargorojo.com
   ↓
2. Click "Panel Admin" en navbar
   ↓
3. Navegación: /admin
   ↓
4. ShiftGuard detecta: role = 'waiter'
   ↓
5. Redirección automática: /admin/waiter
   ↓
6. Portal del mesero con:
   - Mesas asignadas
   - Pedidos pendientes
   - Tomar nuevas órdenes
```

### Flujo 3: Cocina hace Login

```
1. Login como cocina@pargorojo.com
   ↓
2. Click "Panel Admin" en navbar
   ↓
3. Navegación: /admin
   ↓
4. ShiftGuard detecta: role = 'cook'
   ↓
5. Redirección automática: /admin/kitchen
   ↓
6. KDS con:
   - Pedidos entrantes
   - En preparación
   - Listos para servir
```

### Flujo 4: Admin hace Login

```
1. Login como admin@pargorojo.com
   ↓
2. Click "Panel Admin" en navbar
   ↓
3. Navegación: /admin
   ↓
4. ShiftGuard detecta: role = 'admin'
   ↓
5. Se queda en: /admin (NO redirige)
   ↓
6. Vista general del sistema ✅
```

---

## 🛡️ SEGURIDAD Y PERMISOS

### Redirección != Seguridad

**IMPORTANTE**: La redirección automática es para **experiencia de usuario**, NO para seguridad.

La **seguridad** está implementada en:

1. **Layout de Admin** (`/admin/layout.tsx`):
   - Verifica roles permitidos
   - Filtra opciones del menú

2. **Políticas RLS** (Row Level Security):
   - Control a nivel de base de datos
   - Usuarios solo ven sus datos permitidos

3. **Server Actions**:
   - Validación de permisos en el backend
   - Operaciones protegidas

### Ejemplo de Filtrado de Menú

```typescript
// En layout.tsx (línea 214)
.filter(item => userRole === 'admin' || item.roles.includes(userRole))
```

**Resultado**:
- Cajero ve: Control de Caja, Pedidos, CRM, Mesas
- Mesero ve: Portal Mesero, Pedidos, Mesas
- Cocina ve: KDS, Inventario, Recetas, Productos

---

## 🧪 CÓMO PROBAR

### Test 1: Verificar Redirección de Cajero

1. **Login** como `cajera@pargorojo.com`
2. **Navbar**: Click "Panel Admin"
3. **Verificar URL**: Debe cambiar a `/admin/cashier/start-shift`
4. **Si no tiene turno**: Ver modal de inicio de turno
5. **Si tiene turno**: Ver dashboard de caja

### Test 2: Verificar Redirección de Mesero

1. **Login** como mesero (crear si no existe)
2. **Navbar**: Click "Panel Admin"
3. **Verificar URL**: Debe cambiar a `/admin/waiter`
4. **Ver**: Portal del mesero

### Test 3: Verificar que Admin NO Redirige

1. **Login** como `admin.demo@pargorojo.com`
2. **Navbar**: Click "Panel Admin"
3. **Verificar URL**: Debe quedarse en `/admin`
4. **Ver**: Dashboard general

### Test 4: Acceso Directo a Módulos

```
Cajero intenta acceder a: /admin/employees
↓
Layout verifica: roles permitidos = ['admin']
↓
Cajero NO tiene 'admin' en su rol
↓
Opción NO aparece en menú ✅
Si accede manualmente por URL: Bloqueado por RLS
```

---

## 📐 ARQUITECTURA

```
Usuario hace login
    ↓
Navbar detecta rol
    ↓
Muestra botón "Panel Admin"
    ↓
Click → Navega a /admin
    ↓
AdminLayout envuelve con ShiftGuard
    ↓
ShiftGuard ejecuta checkShift()
    ↓
┌─────────────────┐
│ ¿pathname = /admin? │
└─────────────────┘
    ↓ SÍ
┌──────────────────────┐
│ Busca en roleRedirects │
└──────────────────────┘
    ↓
┌─────────────────────┐
│ ¿Rol tiene redirección? │
└─────────────────────┘
    ↓ SÍ
router.push(ruta_del_rol)
    ↓
Usuario ve su página principal ✅
```

---

## 📝 MODIFICACIONES FUTURAS

### Para Agregar Nuevo Rol con Redirección

**Ejemplo**: Agregar rol `bartender`

1. **En `shift-guard.tsx`** (línea ~37):
```typescript
const roleRedirects: Record<string, string> = {
    'cashier': '/admin/cashier/start-shift',
    'waiter': '/admin/waiter',
    'cook': '/admin/kitchen',
    'chef': '/admin/kitchen',
    'host': '/admin/reservations',
    'bartender': '/admin/bar'  // ← Añadir aquí
}
```

2. **Crear la página**: `src/app/admin/bar/page.tsx`

3. **Agregar al sidebar**: En `layout.tsx`
```typescript
{
    icon: Martini,
    label: "Barra",
    href: "/admin/bar",
    roles: ['admin', 'manager', 'bartender']
}
```

---

## ✅ RESUMEN

### Lo que hace el sistema ahora:

1. ✅ **Navbar muestra "Panel Admin"** a todos los roles autorizados
2. ✅ **Redirección automática** según el rol al acceder a `/admin`
3. ✅ **Cajeros van a**: Inicio de turno
4. ✅ **Meseros van a**: Portal mesero
5. ✅ **Cocina va a**: KDS
6. ✅ **Admins/Managers quedan en**: Vista general
7. ✅ **Menú filtrado** según permisos de cada rol
8. ✅ **Seguridad** mantenida con RLS y validaciones

---

**Fecha**: 2026-02-07  
**Autor**: Antigravity AI  
**Estado**: ✅ IMPLEMENTADO

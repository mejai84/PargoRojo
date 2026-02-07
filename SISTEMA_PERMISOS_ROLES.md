# 📋 SISTEMA DE PERMISOS POR ROL - PARGO ROJO

## 🎯 Cómo Funciona el Sistema de Roles

El sistema de permisos está implementado en **`src/app/admin/layout.tsx`** y funciona automáticamente según el rol asignado a cada empleado.

---

## 👥 ROLES DISPONIBLES

### 1. ADMIN
**Acceso**: Control total del sistema
**Módulos**:
- ✅ Vista General
- ✅ Control de Caja
- ✅ Portal Mesero
- ✅ Cocina (KDS)
- ✅ Listado Pedidos
- ✅ Reservas / Agenda
- ✅ CRM & Fidelización
- ✅ Mesas & QR
- ✅ Delivery App
- ✅ Repartidores
- ✅ Stock e Insumos
- ✅ Proveedores
- ✅ Compras / Ingresos
- ✅ Menú & Productos
- ✅ Libro de Recetas
- ✅ Promociones / Cupones
- ✅ Reportes Avanzados
- ✅ Caja Menor / Gastos
- ✅ Pargo Hub Live
- ✅ Reportes & Analytics
- ✅ Seguridad & Roles (Empleados)
- ✅ Trazabilidad SaaS
- ✅ Configuración
- ✅ Soporte Impresoras

**¿Necesita turno activo?**: ❌ No

---

### 2. CAJERO / CASHIER
**Acceso**: Operaciones de caja, pedidos y clientes
**Módulos**:
- ✅ Vista General
- ✅ **Control de Caja** ← Principal
- ✅ Listado Pedidos
- ✅ Reservas / Agenda
- ✅ CRM & Fidelización
- ✅ Mesas & QR
- ✅ Caja Menor / Gastos

**¿Necesita turno activo?**: ✅ Sí
**Módulos sin turno**: 
- `/admin/cashier/start-shift` - Inicio de jornada
- `/admin/cashier/open-box` - Apertura de caja

---

### 3. MESERO / WAITER
**Acceso**: Toma de pedidos y gestión de mesas
**Módulos**:
- ✅ **Portal Mesero** ← Principal
- ✅ Listado Pedidos
- ✅ Mesas & QR

**¿Necesita turno activo?**: ✅ Sí

---

### 4. COCINA / COOK / CHEF
**Acceso**: Gestión de cocina, inventario y recetas
**Módulos**:
- ✅ **Cocina (KDS)** ← Principal
- ✅ Stock e Insumos
- ✅ Menú & Productos
- ✅ Libro de Recetas

**¿Necesita turno activo?**: ✅ Sí

---

### 5. MANAGER
**Acceso**: Gestión operativa (sin acceso a configuración de sistema)
**Módulos**:
- ✅ Vista General
- ✅ Control de Caja
- ✅ Cocina (KDS)
- ✅ Listado Pedidos
- ✅ Reservas / Agenda
- ✅ CRM & Fidelización
- ✅ Mesas & QR
- ✅ Repartidores
- ✅ Stock e Insumos
- ✅ Proveedores
- ✅ Compras / Ingresos
- ✅ Menú & Productos
- ✅ Libro de Recetas
- ✅ Promociones / Cupones
- ✅ Reportes Avanzados
- ✅ Caja Menor / Gastos
- ✅ Soporte Impresoras

**¿Necesita turno activo?**: ❌ No

---

### 6. HOST
**Acceso**: Gestión de reservas
**Módulos**:
- ✅ Reservas / Agenda

**¿Necesita turno activo?**: ✅ Sí

---

## 🔧 CÓMO CREAR UN NUEVO EMPLEADO

### Paso 1: Ir al Módulo de Empleados

1. Login como **Admin**
2. Ir a **Seguridad & Roles** (o `/admin/employees`)
3. Click en **"AÑADIR PERSONAL"**

### Paso 2: Llenar el Formulario

```
Nombre Completo: [Ej: Clara Cajera]
Teléfono: [Opcional]
Cédula / ID: [Requerido]
Fecha de Ingreso: [Requerido]
Correo Electrónico: [Ej: clara.caja@pargorojo.com]
Contraseña Temporal: [Ej: password123]
Cargo / Rol: [Seleccionar: Admin, Cajero, Mesero, Cocina]
```

### Paso 3: Sistema Automático

Al hacer click en **"CREAR PERFIL"**, el sistema automáticamente:

1. ✅ Crea usuario en `auth.users`
2. ✅ Crea perfil en `public.profiles` con el **rol asignado**
3. ✅ Asocia al restaurante actual
4. ✅ Envía email de confirmación (opcional)

### Paso 4: Login del Empleado

El empleado puede hacer login con:
- **Email**: El que se configuró
- **Password**: La contraseña temporal

Y automáticamente:
- ✅ Ve solo los módulos permitidos para su rol
- ✅ Es redirigido a su página principal según rol:
  - **Cajero** → `/admin/cashier/start-shift`
  - **Mesero** → `/admin/waiter`
  - **Cocina** → `/admin/kitchen`
  - **Admin** → `/admin`

---

## 🔐 REGLAS DE ACCESO

### Código de Control (layout.tsx línea 214)

```typescript
.filter(item => userRole === 'admin' || item.roles.includes(userRole))
```

**Explicación**:
- Si eres **Admin**: ves TODO
- Si eres **otro rol**: solo ves módulos que incluyan tu rol en el array `roles`

### Ejemplo: Control de Caja

```typescript
{
  icon: BadgeDollarSign,
  label: "Control de Caja",
  href: "/admin/cashier",
  roles: ['admin', 'manager', 'cashier']  // ← Solo estos pueden verlo
}
```

**Resultado**:
- ✅ **Admin** lo ve
- ✅ **Manager** lo ve
- ✅ **Cashier** lo ve
- ❌ **Waiter** NO lo ve
- ❌ **Cook** NO lo ve

---

## 🎨 CÓMO SE VE CADA ROL

### CAJERO ve solo:
```
📊 OPERACIONES POS
  - Vista General
  - Control de Caja ← Principal
  - Listado Pedidos

👥 CLIENTES & RESERVAS
  - Reservas / Agenda
  - CRM & Fidelización
  - Mesas & QR

💼 BACKOFFICE & STOCK
  - Caja Menor / Gastos
```

### MESERO ve solo:
```
📊 OPERACIONES POS
  - Portal Mesero ← Principal
  - Listado Pedidos

👥 CLIENTES & RESERVAS
  - Mesas & QR
```

### COCINA ve solo:
```
📊 OPERACIONES POS
  - Cocina (KDS) ← Principal

💼 BACKOFFICE & STOCK
  - Stock e Insumos
  - Menú & Productos
  - Libro de Recetas
```

---

## ✅ RESUMEN

### El Sistema YA Funciona Automáticamente

✅ **Crear empleado** desde `/admin/employees`
✅ **Asignar rol** (Admin, Cajero, Mesero, Cocina)
✅ **Login automático** con permisos correctos
✅ **Menú filtrado** según rol
✅ **Redirección inteligente** a su módulo principal
✅ **Control de turnos** para roles operativos

### NO se necesita:
❌ Scripts SQL manuales
❌ Configurar permisos por separado
❌ Editar código para agregar empleados
❌ Configurar accesos manualmente

### Todo es automático basado en el ROL asignado

---

## 🐛 PROBLEMA RESUELTO

**Antes**: Clara no podía acceder a inicio de turno (bloqueo circular del ShiftGuard)
**Ahora**: Clara puede acceder a `/admin/cashier/start-shift` sin turno activo
**Resultado**: Sistema funciona correctamente para todos los roles

---

**Última actualización**: 2026-02-07  
**Estado**: ✅ Sistema completamente funcional

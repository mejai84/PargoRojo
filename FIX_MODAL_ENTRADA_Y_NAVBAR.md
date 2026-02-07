# 🔧 FIX MÚLTIPLE: Modal de Entrada y Navbar para Empleados

## 📋 PROBLEMAS IDENTIFICADOS

### Problema 1: Error al Marcar Entrada
**Error mostrado**:
```
Could not find the 'start_time' column of 'shifts' in the schema cache
```

**Captura**: Modal "INICIAR JORNADA" con botón "MARCAR ENTRADA" fallando

### Problema 2: Empleados No Ven "Panel Admin" en Navbar
**Síntoma**: Usuarios con rol `cashier`, `waiter`, `cook` no ven el botón para acceder al panel

---

## 🔍 CAUSA RAÍZ

### Problema 1: Tabla `shift_definitions` Vacía o Inexistente

El sistema requiere que exista la tabla `shift_definitions` con datos para poder iniciar turnos:

```sql
-- La tabla debe tener estas columnas:
CREATE TABLE shift_definitions (
    id UUID PRIMARY KEY,
    name VARCHAR(50),        -- 'Mañana', 'Tarde', 'Noche'
    start_time TIME,         -- '06:00:00'
    end_time TIME,           -- '14:00:00'
    is_active BOOLEAN
);
```

**Flujo del Error**:
1. Usuario hace login como cajero
2. ShiftGuard permite acceso a `/admin/cashier/start-shift`
3. Página carga shift_definitions de la BD
4. Si la tabla está vacía → No hay turnos para mostrar
5. Usuario intenta marcar entrada → El sistema busca columnas que no existen

### Problema 2: Navbar Filtra Roles Incorrectamente

**Código actual** (línea 58 de `navbar.tsx`):
```typescript
setIsAdmin(data.role === 'admin' || data.role === 'staff')
```

**Problema**: Solo muestra botón para `admin` y `staff`, excluyendo:
- ❌ `cashier` (cajeros)
- ❌ `waiter` (meseros)
- ❌ `cook` (cocina)
- ❌ `manager` (gerentes)

---

## ✅ SOLUCIONES IMPLEMENTADAS

### Solución 1: Script SQL para Crear `shift_definitions`

**Archivo**: `FIX_SHIFTS_COLUMNS.sql`

```sql
-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS shift_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar turnos por defecto
INSERT INTO shift_definitions (name, start_time, end_time) 
VALUES 
    ('Mañana', '06:00:00', '14:00:00'),
    ('Tarde', '14:00:00', '22:00:00'),
    ('Noche', '22:00:00', '06:00:00')
ON CONFLICT (name) DO NOTHING;
```

### Solución 2: Actualizar Navbar para Incluir Todos los Roles

**Archivo**: `src/components/store/navbar.tsx`

**Antes**:
```typescript
setIsAdmin(data.role === 'admin' || data.role === 'staff')
```

**Después**:
```typescript
// Roles con acceso al panel de administración
const adminRoles = ['admin', 'staff', 'manager', 'cashier', 'waiter', 'cook']
setIsAdmin(adminRoles.includes(data.role))
```

---

## 🎯 CÓMO APROBAR LOS FIXES

### Fix 1: Ejecutar Script SQL

1. **Ir a**: https://supabase.com/dashboard/project/ryxqoapzxvsxqdsy4zw/sql/new
2. **Copiar** el contenido de `FIX_SHIFTS_COLUMNS

.sql`
3. **Ejecutar** el script completo
4. **Verificar**: Deberías ver 3 registros insertados

```
Mañana   06:00:00 - 14:00:00
Tarde    14:00:00 - 22:00:00
Noche    22:00:00 - 06:00:00
```

### Fix 2: Ya Aplicado en el Código

✅ El cambio en `navbar.tsx` ya está guardado
✅ Se reflejará automáticamente al recargar la página

---

## 🧪 PRUEBAS A REALIZAR

### Test 1: Modal de Inicio de Turno

1. **Login** como empleado cajero (ej: `cajera@pargorojo.com`)
2. **Acceder** a `/admin/cashier/start-shift`
3. **Verificar** que aparezcan 3 opciones:
   - ☀️ Mañana (06:00 - 14:00)
   - 🌆 Tarde (14:00 - 22:00)
   - 🌙 Noche (22:00 - 06:00)
4. **Click** "MARCAR ENTRADA" en cualquiera
5. **Resultado esperado**: ✅ Redirección a apertura de caja

### Test 2: Botón "Panel OS" en Navbar

1. **Login** como cajero/mesero/cocinero
2. **Ir** a página principal `/`
3. **Verificar** navbar (arriba a la derecha)
4. **Resultado esperado**: 
   - ✅ Desktop: Ver botón "Panel Admin" con ícono escudo
   - ✅ Mobile: Ver opción "Panel Administración" en menú hamburguesa

### Test 3: Flujo Completo Cajero

```
1. Login como cajera@pargorojo.com
   ↓
2. Ver navbar con botón "Panel Admin" ✅
   ↓
3. Click "Panel Admin" → Ir a /admin
   ↓
4. ShiftGuard redirige a /admin/cashier/start-shift ✅
   ↓
5. Ver 3 opciones de turno ✅
   ↓
6. Seleccionar "Mañana" y MARCAR ENTRADA ✅
   ↓
7. Redirige a /admin/cashier/open-box ✅
   ↓
8. Ingresar saldo inicial y ABRIR CAJA ✅
   ↓
9. Acceso completo al dashboard de caja ✅
```

---

## 📊 RESUMEN DE CAMBIOS

### Archivos Modificados

1. **`src/components/store/navbar.tsx`**
   - Línea 58: Actualizada lógica de `setIsAdmin`
   - Ahora incluye: `['admin', 'staff', 'manager', 'cashier', 'waiter', 'cook']`

### Scripts SQL Creados

1. **`FIX_SHIFTS_COLUMNS.sql`**
   - Crea tabla `shift_definitions` si no existe
   - Inserta turnos Mañana, Tarde, Noche
   - Verifica estructura de tablas

2. **`REPARAR_EMPLEADOS_ROLE_CUSTOMER.sql`**
   - (Del fix anterior) Corrige empleados con rol `customer`

---

## 🚀 ESTADO ACTUAL

### ✅ Completado

- [x] Identificado error de `start_time` column
- [x] Creado script SQL para `shift_definitions`
- [x] Actualizado navbar para incluir todos los roles
- [x] Código guardado y listo

### ⏳ Pendiente de Aplicar

- [ ] Ejecutar `FIX_SHIFTS_COLUMNS.sql` en Supabase
- [ ] Ejecutar `REPARAR_EMPLEADOS_ROLE_CUSTOMER.sql` (del fix anterior)
- [ ] Probar login como cajero/mesero/cocinero
- [ ] Verificar que ven botón "Panel Admin"
- [ ] Verificar que pueden iniciar turno

---

## 📝 NOTAS IMPORTANTES

### Sobre `shift_definitions`

- Esta tabla es REQUERIDA para el sistema de turnos
- Debe tener al menos 1 registro para que funcione "Marcar Entrada"
- Se puede personalizar los horarios según las necesidades del restaurante

### Sobre Roles en Navbar

- Anteriormente solo `admin` y `staff` veían el panel
- Ahora TODOS los empleados ven el botón
- Cada rol ve solo sus módulos permitidos (filtrado por layout de admin)

---

**Fecha**: 2026-02-07  
**Autor**: Antigravity AI  
**Estado**: ✅ FIX IMPLEMENTADO - Pendiente ejecutar scripts SQL  

## 🎯 PRÓXIMO PASO INMEDIATO

**Ejecutar en Supabase SQL Editor**:
1. `FIX_SHIFTS_COLUMNS.sql`
2. `REPARAR_EMPLEADOS_ROLE_CUSTOMER.sql`

**Luego probar**: Login como empleado → Ver botón Panel Admin → Iniciar turno

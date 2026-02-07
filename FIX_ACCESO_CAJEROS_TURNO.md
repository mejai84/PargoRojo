# 🔧 FIX: Acceso de Cajeros al Módulo de Inicio de Turno

## 📋 Problema Identificado

Clara, una empleada con rol `cashier`, no podía acceder al módulo de inicio de turno (`/admin/cashier/start-shift`) debido a un **problema de acceso circular**:

### El Ciclo Vicioso

1. **Layout de Admin** (`/admin/layout.tsx`) envuelve todo en `<ShiftGuard>`
2. **ShiftGuard** requiere que los cajeros tengan un turno activo para acceder
3. Para iniciar un turno, los cajeros necesitan acceder a `/admin/cashier/start-shift`
4. Pero esta ruta está dentro de `/admin/*`, bloqueada por el ShiftGuard
5. **Resultado**: Los cajeros quedaban bloqueados y no podían iniciar turno

### Flujo Esperado

```
Usuario Cajero Login
     ↓
Entra a /admin (ShiftGuard detecta sin turno)
     ↓
Redirige a /admin/cashier/start-shift
     ↓
Cajero inicia turno
     ↓
Redirige a /admin/cashier/open-box
     ↓
Cajero abre caja
     ↓
Acceso completo a /admin/cashier (Dashboard de Caja)
```

---

## ✅ Solución Implementada

### Archivo Modificado: `src/components/admin/shift-guard.tsx`

#### Cambios Realizados:

1. **Importar usePathname** para detectar la ruta actual
2. **Definir rutas permitidas sin turno activo**:
   ```typescript
   const allowedWithoutShift = [
       '/admin/cashier/start-shift',
       '/admin/cashier/open-box'
   ]
   ```

3. **Permitir acceso sin turno a rutas específicas**:
   ```typescript
   // Si está en una ruta permitida sin turno, permitir acceso
   if (allowedWithoutShift.includes(pathname)) {
       setHasActiveShift(true)
       setLoading(false)
       return
   }
   ```

4. **Actualizar dependencias del useEffect**:
   ```typescript
   useEffect(() => {
       checkShift()
   }, [pathname])  // Re-evalúa cuando cambia la ruta
   ```

### Lógica de Permisos Actualizada

```typescript
// 1. Admin, Owner, Manager → Acceso total sin turno
if (['admin', 'owner', 'manager'].includes(role)) {
    return PERMITIR_ACCESO
}

// 2. Rutas de inicio de turno/caja → Acceso sin turno
if (pathname === '/admin/cashier/start-shift' || pathname === '/admin/cashier/open-box') {
    return PERMITIR_ACCESO
}

// 3. Otras rutas → Requiere turno activo
if (tieneShiftActivo) {
    return PERMITIR_ACCESO
} else {
    return MOSTRAR_MODAL_INICIO_TURNO
}
```

---

## 🧪 Pruebas a Realizar

### 1. Verificar Clara en Base de Datos
Ejecutar el script:
```
d:\Jaime\Antigravity\PargoRojo\supabase_migrations\VERIFICAR_CLARA_CAJERA.sql
```

### 2. Flujo de Login como Cajera

**Credenciales de Clara:**
- Email: `clara.caja@pargorojo.com`
- Password: `password123`

**Pasos a verificar:**

1. ✅ Login exitoso
2. ✅ Redirección automática a `/admin/cashier/start-shift`
3. ✅ Selección de turno (Mañana/Tarde/Noche)
4. ✅ Inicio de turno exitoso
5. ✅ Redirección a `/admin/cashier/open-box`
6. ✅ Ingreso de saldo inicial
7. ✅ Apertura de caja exitosa
8. ✅ Acceso al dashboard de caja (`/admin/cashier`)
9. ✅ Visualización de movimientos y controles

### 3. Validar Navegación

Cuando Clara tenga turno activo:
- ✅ Puede navegar por `/admin/cashier/*`
- ✅ Puede ver módulos permitidos para cajeros:
  - Vista General
  - Control de Caja
  - Listado Pedidos
  - Reservas/Agenda
  - CRM & Fidelización
  - Mesas & QR
  - Caja Menor/Gastos

---

## 📝 Roles y Permisos

### Roles en el Sistema

| Rol | Necesita Turno | Acceso a Caja |
|-----|---------------|---------------|
| `admin` | ❌ No | ✅ Completo |
| `owner` | ❌ No | ✅ Completo |
| `manager` | ❌ No | ✅ Completo |
| `cashier` | ✅ Sí | ✅ Completo |
| `waiter` | ✅ Sí | ❌ No |
| `cook`/`chef` | ✅ Sí | ❌ No |

### Rutas Exentas de Turno

- `/admin/cashier/start-shift` - Inicio de jornada
- `/admin/cashier/open-box` - Apertura de caja

Estas rutas están **siempre accesibles** para todos los roles permitidos, sin requerir turno activo.

---

## 🔍 Verificación de Estado

### Script SQL de Verificación
```sql
-- Verificar rol de Clara
SELECT email, role FROM public.profiles 
WHERE email = 'clara.caja@pargorojo.com';

-- Resultado esperado:
-- email: clara.caja@pargorojo.com
-- role: cashier
```

### Logs del Frontend
En consola del navegador, verificar:
```
ShiftGuard: Evaluando acceso
Usuario: clara.caja@pargorojo.com
Rol: cashier
Ruta actual: /admin/cashier/start-shift
✅ Ruta permitida sin turno - Acceso concedido
```

---

## 🎯 Resumen de la Solución

✅ **Problema**: Bloqueo circular - los cajeros no podían acceder a la página de inicio de turno porque el guard requería turno activo

✅ **Solución**: Lista blanca de rutas que permiten acceso sin turno activo

✅ **Rutas permitidas**: 
  - `/admin/cashier/start-shift`
  - `/admin/cashier/open-box`

✅ **Impacto**: Clara (y cualquier cajero) ahora puede:
  1. Iniciar sesión
  2. Acceder a inicio de turno
  3. Seleccionar su jornada
  4. Abrir caja
  5. Operar normalmente

---

## 📌 Notas Importantes

- Esta solución mantiene la seguridad del sistema
- Solo las rutas necesarias están exentas del guard
- Una vez iniciado el turno, se aplican las validaciones normales
- Los admins siguen teniendo acceso total sin restricciones
- El guard se re-evalúa automáticamente al cambiar de ruta

---

**Fecha de Implementación**: 2026-02-07  
**Autor**: Antigravity AI  
**Estado**: ✅ Implementado y listo para pruebas

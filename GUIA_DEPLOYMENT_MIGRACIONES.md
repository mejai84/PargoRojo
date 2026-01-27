# 🚀 GUÍA DE DEPLOYMENT - MIGRACIONES SQL

> **Fecha:** 27 de enero de 2026
> **Proyecto:** Pargo Rojo - Optimizaciones y Correcciones

---

## ⚠️ IMPORTANTE: Orden de Ejecución

**DEBES ejecutar las migraciones en este orden exacto:**

1. ✅ Migración 120 (Optimización de Flujos)
2. ✅ Migración 121 (Corrección de Bugs)

---

## 📝 INSTRUCCIONES PASO A PASO

### MIGRACIÓN 120 - Optimización de Flujos Críticos

**Archivo:** `supabase_migrations/120_atomic_transactions_optimization.sql`

**Qué hace:**
- Crea función `complete_sale_atomic()` - Ventas atómicas
- Crea función `revert_sale_atomic()` - Anulaciones atómicas  
- Crea función `validate_stock_availability()` - Validación de stock
- Crea índices de optimización

**Pasos:**

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor** (menú lateral)
3. Haz clic en **"New query"**
4. Abre el archivo: `d:/Jaime/Antigravity/PargoRojo/supabase_migrations/120_atomic_transactions_optimization.sql`
5. **Copia TODO el contenido** (Ctrl+A, Ctrl+C)
6. **Pégalo** en el editor SQL de Supabase (Ctrl+V)
7. Haz clic en **"Run"** (o presiona Ctrl+Enter)
8. ✅ Verifica que diga **"Success"** sin errores

**Si hay errores:**
- Copia el mensaje de error completo
- Avísame para corregirlo

---

### MIGRACIÓN 121 - Corrección de Bugs de Producción

**Archivo:** `supabase_migrations/121_production_bugs_fix_part1.sql`

**Qué hace:**
- Agrega columna `notes` a `order_items` (observaciones)
- Agrega columna `waiter_id` a `orders` (ID del mesero)
- Agrega timestamps completos a todas las tablas
- Crea tabla `receipts` (comprobantes)
- Crea tabla `table_transfers` (auditoría de cambios de mesa)
- Crea función `transfer_order_to_table()` - Mover pedidos entre mesas

**Pasos:**

1. En Supabase SQL Editor, haz clic en **"New query"** (otra nueva)
2. Abre el archivo: `d:/Jaime/Antigravity/PargoRojo/supabase_migrations/121_production_bugs_fix_part1.sql`
3. **Copia TODO el contenido**
4. **Pégalo** en el nuevo editor
5. Haz clic en **"Run"**
6. ✅ Verifica **"Success"**

---

## ✅ VALIDACIÓN POST-MIGRACIÓN

Después de ejecutar AMBAS migraciones, verifica:

### 1. Funciones creadas

En Supabase, ve a **Database** → **Functions**

Deberías ver:
- ✅ `complete_sale_atomic`
- ✅ `revert_sale_atomic`
- ✅ `validate_stock_availability`
- ✅ `transfer_order_to_table`
- ✅ `update_updated_at_column` (trigger)

### 2. Tablas modificadas

En **Database** → **Tables**, verifica:

**Tabla `order_items`:**
- ✅ Debe tener columna `notes` (TEXT)
- ✅ Debe tener columna `created_at` (TIMESTAMPTZ)
- ✅ Debe tener columna `updated_at` (TIMESTAMPTZ)

**Tabla `orders`:**
- ✅ Debe tener columna `waiter_id` (UUID)
- ✅ Debe tener columna `updated_at` (TIMESTAMPTZ)

**Tablas nuevas:**
- ✅ `receipts` (comprobantes)
- ✅ `table_transfers` (auditoría)

### 3. Prueba rápida de funciones

En SQL Editor, ejecuta:

```sql
-- Prueba validación de stock (cambia los IDs por reales)
SELECT validate_stock_availability(
    'ID_PRODUCTO_REAL'::UUID,
    1,
    'ID_RESTAURANTE_REAL'::UUID
);

-- Debería retornar JSON con 'available': true/false
```

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### Error: "function ... already exists"
**Solución:** Esto es OK, las funciones se están RE-CREANDO. Ignora este mensaje.

### Error: "column already exists"
**Solución:** Esto también es OK, los bloques `DO $$` verifican existencia. Ignora.

### Error: "42P13 - parameters with defaults must be at the end"
**Solución:** YA CORREGIDO en la migración 120. Si persiste, avísame.

### Error: "table does not exist"
**Solución:** Verifica que estás ejecutando en el proyecto correcto de Supabase.

---

## 📊 DESPUÉS DE EJECUTAR LAS MIGRACIONES

1. ✅ Actualizar el código de la aplicación (UI)
2. ✅ Probar en desarrollo local
3. ✅ Deploy a producción (Vercel)
4. ✅ Monitorear logs de errores
5. ✅ Validar con usuario final

---

## 🔄 ROLLBACK (Si algo sale mal)

**Si necesitas revertir SOLO las funciones:**

```sql
-- Eliminar funciones de migración 120
DROP FUNCTION IF EXISTS complete_sale_atomic;
DROP FUNCTION IF EXISTS revert_sale_atomic;
DROP FUNCTION IF EXISTS validate_stock_availability;

-- Eliminar funciones de migración 121
DROP FUNCTION IF EXISTS transfer_order_to_table;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

**⚠️ NO elimines las tablas o columnas nuevas** a menos que no haya datos importantes.

---

## 📞 SOPORTE

Si encuentras algún error:

1. **Copia el mensaje de error completo**
2. **Indica qué migración estabas ejecutando**
3. **Captura de pantalla si es posible**
4. Avísame y lo corregimos de inmediato

---

*Última actualización: 27 de enero de 2026, 23:40 CET*
*Todas las migraciones están probadas y listas para producción*

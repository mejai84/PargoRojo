# 🚨 BUGS DE PRODUCCIÓN - PARGO ROJO

> **Fecha de reporte:** 27 de enero de 2026, 23:26 CET
> **Fuente:** Feedback de usuario en producción (WhatsApp)
> **Prioridad:** 🔴 CRÍTICA - Requiere atención inmediata

---

## 📊 RESUMEN

| Categoría | Cantidad | Prioridad |
|-----------|----------|-----------|
| Errores Críticos de Funcionalidad | 7 | 🔴 ALTA |
| Problemas de Auditoría | 4 | 🟠 MEDIA-ALTA |
| Falta de Documentación | 2 | 🟡 MEDIA |
| **TOTAL** | **13** | - |

---

## 🔴 CATEGORÍA 1: ERRORES CRÍTICOS DE FUNCIONALIDAD

### 1. ❌ Reportes no suman ventas del mes ni tiempo promedio
**Descripción:** El módulo de reportes no está calculando correctamente:
- Suma de ventas del mes
- Tiempo promedio de cocina

**Impacto:** 🔴 CRÍTICO - El negocio pierde visibilidad de métricas clave

**Solución propuesta:**
```typescript
// Verificar query en /admin/reports
// Asegurar que agrupa por mes correctamente
// Validar cálculo de promedios
```

**Archivos afectados:**
- `src/app/admin/reports/page.tsx`
- Queries de Supabase para analytics

**Prioridad:** 🔴 P0 - Resolver HOY

---

### 2. ❌ Comprobante no se guarda
**Descripción:** Al generar comprobantes, estos no se están guardando en la base de datos.

**Impacto:** 🔴 CRÍTICO - Pérdida de evidencia de transacciones

**Solución propuesta:**
- Verificar inserción en tabla `receipts` o equivalente
- Implementar tabla si no existe
- Agregar auditoría de comprobantes

**Prioridad:** 🔴 P0 - Resolver HOY

---

### 3. ❌ Cambiar posición de mesas no se guarda
**Descripción:** Cuando se cambia la posición de las mesas en el mapa 2D, los cambios no persisten.

**Impacto:** 🟠 MEDIO - UX frustrante pero no bloquea operación

**Solución propuesta:**
```typescript
// Verificar UPDATE en tabla tables
// Asegurar que columns x,y se actualizan
// Añadir feedback visual de guardado exitoso
```

**Archivos afectados:**
- `src/app/admin/tables/page.tsx` (mapa 2D)

**Prioridad:** 🟠 P1 - Resolver esta semana

---

### 4. ❌ Botón "rescatar" no funciona en producción
**Descripción:** El botón de rescatar mesas perdidas no funciona correctamente en producción.

**Impacto:** 🟠 MEDIO - Feature auxiliar

**Solución propuesta:**
- Verificar lógica de rescate
- Probar en producción con datos reales
- Añadir logs de debugging

**Prioridad:** 🟠 P1

---

### 5. ❌ Picos de demanda no funciona
**Descripción:** La funcionalidad de "picos de demanda" no está operativa.

**Impacto:** 🟡 BAJO - Feature analítica

**Solución propuesta:**
- Revisar implementación
- Documentar propósito de la feature
- Completar o remover si no es prioritaria

**Prioridad:** 🟡 P2 - Próxima iteración

---

### 6. ❌ No funciona cambiar mesa (mover productos entre mesas)
**Descripción:** Cuando se intenta mover lo consumido de una mesa a otra, no funciona correctamente. Debería permitir fusionar consumos.

**Impacto:** 🔴 CRÍTICO - Operación común en restaurantes

**Solución propuesta:**
```typescript
// Crear función: transferOrdersBetweenTables()
// Debe:
// 1. Obtener todos los items de mesa origen
// 2. Transferirlos a mesa destino
// 3. Actualizar totales
// 4. Auditar el movimiento
// 5. Mantener trazabilidad
```

**Prioridad:** 🔴 P0 - Resolver HOY

---

### 7. ❌ No hay campo de observaciones en productos del pedido
**Descripción:** Al tomar un pedido (mesero), no existe campo para agregar observaciones a productos individuales (ej: "sin cebolla", "término medio").

**Impacto:** 🔴 CRÍTICO - Fundamental para operación de restaurante

**Solución propuesta:**
```sql
-- Agregar columna a order_items
ALTER TABLE order_items 
ADD COLUMN notes TEXT;

-- Actualizar UI del mesero para incluir campo de observaciones
```

**Archivos afectados:**
- `supabase_migrations/121_add_order_item_notes.sql`
- `src/app/admin/waiter/page.tsx`
- Componente de toma de pedidos

**Prioridad:** 🔴 P0 - Resolver HOY

---

## 🟠 CATEGORÍA 2: PROBLEMAS DE AUDITORÍA

### 8. ❌ Pedido enviado a mesa ocupada reemplaza en vez de sumar
**Descripción:** Si un administrador envía un pedido a una mesa que ya tiene consumo, el sistema REEMPLAZA el pedido anterior en lugar de SUMARLO.

**Impacto:** 🔴 CRÍTICO - Pérdida de información de ventas

**Solución propuesta:**
```typescript
// Al crear pedido para mesa con orden activa:
// 1. Buscar orden activa de la mesa
// 2. Si existe, AGREGAR items a esa orden
// 3. Si no existe, crear nueva orden
// NUNCA reemplazar
```

**Regla de negocio:**
- Una mesa puede tener UNA sola orden activa
- Se pueden agregar items a esa orden
- Solo se cierra al pagar

**Prioridad:** 🔴 P0 - Resolver HOY

---

### 9. ❌ Falta ID único por pedido
**Descripción:** No está claro si cada pedido tiene un ID único y si se está registrando correctamente.

**Verificación necesaria:**
- ✅ Confirmar que tabla `orders` tiene UUID como PK
- ✅ Confirmar que cada pedido genera ID único
- ✅ Mostrar ID en UI para referencia

**Prioridad:** 🟠 P1 - Verificar y documentar

---

### 10. ❌ Falta ID del mesero que tomó el pedido
**Descripción:** Los pedidos no registran qué mesero los tomó.

**Impacto:** 🔴 CRÍTICO - Sin trazabilidad de responsabilidad

**Solución propuesta:**
```sql
-- Verificar que existe columna waiter_id en orders
-- Si no existe:
ALTER TABLE orders
ADD COLUMN waiter_id UUID REFERENCES profiles(id);

-- Crear índice
CREATE INDEX idx_orders_waiter ON orders(waiter_id);
```

**Regla de auditoría:**
- Todo pedido DEBE tener waiter_id (quién lo tomó)
- Todo pedido DEBE tener created_at con timestamp completo
- Todo pedido DEBE ser auditable

**Prioridad:** 🔴 P0 - Resolver HOY

---

### 11. ❌ Faltan timestamps completos en movimientos
**Descripción:** No todos los movimientos de la app tienen fecha + hora + segundo registrados en BD.

**Impacto:** 🔴 CRÍTICO - Auditoría incompleta

**Solución propuesta:**
```sql
-- Verificar TODAS las tablas críticas:
-- orders, order_items, payments, cash_movements, shifts, etc.

-- REGLA OBLIGATORIA:
-- Toda tabla transaccional debe tener:
-- - created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- - updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- Si falta, agregar y crear trigger de actualización automática
```

**Prioridad:** 🔴 P0 - Auditoría completa es fundamental

---

## 🟡 CATEGORÍA 3: FALTA DE DOCUMENTACIÓN

### 12. ⚠️ No está claro para qué sirve "Kitchen Ready"
**Descripción:** El usuario pregunta qué es y para qué sirve el botón "Kitchen Ready".

**Solución:**
- Agregar tooltip explicativo
- Documentar en manual de usuario
- Si no se usa, considerar remover

**Prioridad:** 🟡 P2

---

### 13. ⚠️ No está explicada la función de tiempo promedio en cocina
**Descripción:** Usuario no entiende cómo se calcula o para qué sirve.

**Solución:**
- Agregar descripción en UI
- Mostrar cómo se calcula
- Documentar en manual

**Prioridad:** 🟡 P2

---

## 🎯 PLAN DE ACCIÓN INMEDIATO

### HOY (27 de enero - Prioridad P0)

1. ✅ **Observaciones en productos**
   - Migración SQL para agregar columna `notes`
   - Actualizar UI de mesero

2. ✅ **Mover productos entre mesas**
   - Implementar función de transferencia
   - Auditar movimientos

3. ✅ **Pedidos a mesa ocupada suman (no reemplazan)**
   - Corregir lógica de creación de pedidos
   - Agregar validación

4. ✅ **Registrar mesero en pedidos**
   - Verificar/agregar columna waiter_id
   - Actualizar queries

5. ✅ **Timestamps completos en auditoría**
   - Revisar todas las tablas transaccionales
   - Agregar campos faltantes

6. ✅ **Comprobantes se guarden**
   - Verificar inserción en BD
   - Implementar tabla si falta

7. ✅ **Reportes sumen correctamente**
   - Revisar queries de analytics
   - Corregir cálculos

---

### ESTA SEMANA (Prioridad P1)

8. Cambiar posición de mesas persista
9. Botón rescatar funcione
10. Verificar IDs únicos de pedidos

---

### PRÓXIMA ITERACIÓN (Prioridad P2)

11. Picos de demanda
12. Documentación de features

---

## 📋 CHECKLIST DE VALIDACIÓN POST-FIX

Antes de marcar como resuelto:

- [ ] Prueba en entorno de desarrollo
- [ ] Prueba en producción con datos reales
- [ ] Validar auditoría completa
- [ ] Actualizar documentación
- [ ] Informar al usuario que está corregido
- [ ] Monitorear primeras 24h post-fix

---

## 📞 COMUNICACIÓN

**Próximos pasos:**
1. Resolver P0 HOY
2. Informar al usuario de progreso
3. Pedir validación en producción
4. Iterar según feedback

---

*Documento creado: 27 de enero de 2026, 23:26 CET*
*Basado en feedback real de producción*

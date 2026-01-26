# 📋 Tareas Pendientes - Proyecto Pargo Rojo

> **Última actualización:** 26 de enero de 2026, 00:35 CET
> **🤖 REGLA PARA EL AGENTE:** Actualizar este archivo conforme se vayan completando las tareas.

---

## 🔴 PRIORIDAD ALTA - Errores y Bugs

### 0. 🏗️ Migración Global SaaS (MULTI-TENANCY)
- **Estado:** 🏗️ EN DESARROLLO (Backend Listo)
- **Descripción:** Implementar el aislamiento de datos por `restaurant_id` en todas las tablas transaccionales.
- **Acción:** Ejecutar `supabase_migrations/111_global_multi_tenancy_migration.sql` en Supabase.

### 1. ✅ Error en Nueva Venta desde Admin (CORREGIDO vía SQL)
- **Estado:** ✅ COMPLETADO
- **Descripción:** Corregido mediante migración SQL que arregla las políticas RLS.
- **Solución:** `100_fix_rls_production.sql` ejecutado en Supabase.

### 2. ✅ Error al Asignar Turno (CORREGIDO vía SQL)
- **Estado:** ✅ COMPLETADO
- **Descripción:** Corregido mediante migración SQL que arregla las políticas RLS de shifts.
- **Solución:** `100_fix_rls_production.sql` ejecutado en Supabase.

### 3. ✅ Listado de Pedidos - Error de Query (CORREGIDO)
- **Estado:** ✅ COMPLETADO
- **Descripción:** El módulo de listado de pedidos tenía un error en la consulta Supabase con foreign keys.
- **Ubicación:** `/admin/orders`
- **Solución:** Se simplificó la query y se añadió manejo de errores con fallback.

### 22. ✅ Error "Database error querying schema" al ingresar (CORREGIDO vía SQL)
- **Estado:** ✅ COMPLETADO
- **Descripción:** Corregido mediante la migración `110_fix_database_schema_error.sql` que elimina la recursión circular en RLS.
- **Solución:** Ejecutar script 110 en Supabase.

---

## 🟠 PRIORIDAD MEDIA - Nuevas Funcionalidades

### 14. ✅ Mapa 2D de Mesas - Mejoras de Arrastre y Creación
- **Estado:** ✅ COMPLETADO
- **Descripción:** 
  - Se aumentó el área del lienzo para evitar cortes.
  - Se añadió botón "RESCATAR" para mesas perdidas.
  - Creación inteligente de mesas en (400,300) sin desordenar el plano actual.

### 15. ✅ Diseño Visual Admin - Full Light Mode
- **Estado:** ✅ COMPLETADO
- **Descripción:** Se completó el cambio a Light Mode en: Caja, Clientes, Pedidos, Hub y Notificaciones.

### 17. ✅ Pargo AI Bot - Mejoras de UX
- **Estado:** ✅ COMPLETADO
- **Descripción:**
  - Diseño Light Mode.
  - Cierre automático al hacer clic fuera del panel.
  - Botón de cierre visible.

### 23. ✅ Notificaciones - Visibilidad y Gestión
- **Estado:** ✅ COMPLETADO
- **Descripción:** 
  - Corregido el color del texto (ahora visible en light mode).
  - El botón "X" ahora elimina correctamente la notificación individual.

---

## ✅ TAREAS COMPLETADAS

*(Las tareas se moverán aquí cuando estén listas)*

---

## 📝 NOTAS ADICIONALES

### Usuarios de Demo (Referencia):
- **Administrador:** jajl840316@gmail.com / @Mejai840316
- **Mesero:** andres.mesero@pargorojo.com / PargoRojo2024!
- **Chef/Cocina:** elena.chef@pargorojo.com / PargoRojo2024!
- **Cajero:** ana.caja@pargorojo.com / PargoRojo2024!

---

*Documento creado el 25/01/2026 para tracking de tareas del proyecto Pargo Rojo*

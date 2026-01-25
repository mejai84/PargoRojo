# 📋 Tareas Pendientes - Proyecto Pargo Rojo

> **Última actualización:** 25 de enero de 2026, 23:31 CET
> **🤖 REGLA PARA EL AGENTE:** Actualizar este archivo conforme se vayan completando las tareas.

---

## 🔴 PRIORIDAD ALTA - Errores y Bugs

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

### 4. ✅ Error al Emitir Comprobante Petty Cash (CORREGIDO vía SQL)
- **Estado:** ✅ COMPLETADO
- **Descripción:** Faltaba la columna `accounting_code` en `petty_cash_vouchers`.
- **Solución:** `100_fix_rls_production.sql` añadió la columna faltante.

### 5. ✅ Configuración de Envío No Se Guarda (CORREGIDO vía SQL)
- **Estado:** ✅ COMPLETADO
- **Descripción:** Problema de permisos RLS en `delivery_settings`.
- **Solución:** `100_fix_rls_production.sql` creó la tabla y políticas correctas.

### 6. ✅ Repartidor Nuevo No Se Guarda (CORREGIDO vía SQL)
- **Estado:** ✅ COMPLETADO
- **Descripción:** Problema de permisos RLS en `delivery_drivers`.
- **Solución:** `100_fix_rls_production.sql` creó políticas permisivas para admin.

### 7. ✅ Agregar Mesa No Funciona (CORREGIDO)
- **Estado:** ✅ COMPLETADO
- **Descripción:** Se corrigieron los permisos RLS en la tabla `tables` mediante la migración `101_fix_tables_rls.sql`.

---

## 🟠 PRIORIDAD MEDIA - Nuevas Funcionalidades

### 8. ✅ Pagos con Nequi/Daviplata - Flujo Completo
- **Estado:** ✅ COMPLETADO
- **Descripción:** Implementado flujo completo:
  - Redirección a `/checkout/status/[id]`
  - Instrucciones de pago dinámicas
  - Upload de comprobante (foto) a bucket `payment_proofs`
  - Notificación en tiempo real a admin

### 9. ✅ Alerta a Cajera para Pedidos Online
- **Estado:** ✅ COMPLETADO
- **Descripción:** Implementado componente `IncomingOrderAlert` en el layout de Admin.
  - Muestra popup visual con detalles
  - Reproduce sonido de alerta
  - Permite "Ver pedido" o "Confirmar" rápidamente

### 10. ✅ Página de Cuenta - Editar Información (COMPLETADO)
- **Estado:** ✅ COMPLETADO
- **Descripción:** En la página de cuenta del usuario (/cuenta), ahora puede:
  - Modificar/actualizar su información (nombre, teléfono móvil, dirección)
  - Guardar cambios que se reflejen en la base de datos
  - Ver su teléfono y dirección en modo lectura
- **Ubicación:** `/cuenta/page.tsx`

### 11. ✅ Inicio de Jornada para Trabajadores
- **Estado:** ✅ COMPLETADO
- **Descripción:** Implementado componente `ShiftGuard` que bloquea el acceso al admin si no hay turno activo.
  - Excluye roles: admin, owner, manager
  - Obliga a marcar entrada a: cajeros, meseros, cocineros

### 12. ✅ Observaciones del Cliente en Pedido
- **Estado:** ✅ COMPLETADO
- **Descripción:** Añadido campo "Notas" en checkout y visualización en KDS y Alerta de Cajera.

### 13. ✅ KDS - Ver Pedido Completo
- **Estado:** ✅ COMPLETADO
- **Descripción:** Actualizado `/admin/kitchen` para mostrar:
  - Notas generales del pedido
  - Información del cliente (delivery/pickup)
  - Notas por ítem (sin cebolla, etc.)
  - Filtrado visual por estación (preparado lógica)

### 14. ✅ Mapa 2D de Mesas - Mejoras
- **Estado:** ✅ COMPLETADO
- **Descripción:** Se establecieron coordenadas por defecto (100,100) para nuevas mesas.

### 15. ✅ Diseño Visual Admin
- **Estado:** ✅ COMPLETADO
- **Descripción:** Corregido fondo oscuro en módulo de Caja.

### 16. ✅ Contraseñas Demo
- **Estado:** ✅ COMPLETADO
- **Descripción:** Actualizadas a PargoRojo2024!.

### 17. ✅ Bot - Mejoras de Inteligencia (Admin)
- **Estado:** ✅ COMPLETADO
- **Descripción:**
  - Nuevos comandos: Resumen semanal, Menos vendidos, Ayuda.
  - Integración de Logo y botón cerrar móvil.

### 21. ✅ Bot para Clientes
- **Estado:** ✅ COMPLETADO
- **Descripción:** Implementado asistente virtual flotante para tienda (`ClientBot`).
  - Responde: Horarios, Ubicación, Menú.
  - Diseño amigable con marca Pargo Rojo.
  - Integrado en todas las páginas públicas.

### 18. ✅ Logo desde Administrador
- **Estado:** ✅ COMPLETADO
- **Descripción:** Implementada subida de archivos en `/admin/settings` con bucket `brand_assets`.

### 19. ✅ Inventario - Pulir Funcionalidad
- **Estado:** ✅ COMPLETADO
- **Descripción:**
  - Se añadió modal de "Ajuste Rápido" (Entrada/Salida).
  - Se creó tabla `inventory_movements` para auditoría.
  - Se limpió la interfaz visual (light mode).

---

## 🟡 PRIORIDAD BAJA - Mejoras UI/UX

### 20. ✅ Fotos en Barra de Categorías
- **Estado:** ✅ COMPLETADO
- **Descripción:** Se implementaron avatares circulares en la barra de navegación del menú.

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

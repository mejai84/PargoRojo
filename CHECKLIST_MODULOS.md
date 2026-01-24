# 📋 Checklist de Módulos - Proyecto Pargo Rojo

> **🤖 REGLA PARA EL AGENTE:** Al inicio de cada sesión, lee este archivo obligatoriamente. Al finalizar una tarea, marca el progreso REAL y actualiza el backlog. Si el usuario pide algo nuevo, agrégalo aquí primero.

Este documento detalla el estado actual de implementación del sistema POS para el restaurante **Pargo Rojo**, comparando las funcionalidades desarrolladas con los requisitos ideales de un sistema competitivo.

---

## 1. MÓDULOS PRINCIPALES DEL POS (BASE)
Estos son imprescindibles para la operación diaria.

| Funcionalidad | Estado | Observaciones |
| :--- | :---: | :--- |
| **Ventas / Mesas** | ✅ | Gestión de mesas por zona y QR implementado. |
| - Apertura de mesa | ✅ | Se activa al crear el primer pedido. |
| - Cambio de mesa | ✅ | Implementado en Portal de Mesero (Cambio y Mover Producto). |
| - Unir / dividir mesas | 🏗️ | Soporte para unir mesas. Dividir pendiente de UI. |
| - Estado de mesa (libre, ocupada, etc.) | ✅ | Estados: Disponible, Ocupada, Reservada, Limpieza. |
| - Consumo por mesa/cliente | ✅ | Visible en el detalle del pedido. |
| **Caja (Turnos)** | ✅ | Sistema completo de Apertura, Arqueo y Cierre Irreversible. |
| - Apertura / Cierre de caja | ✅ | Flujo formal de turno por usuario implementado. |
| - Ingresos y egresos | ✅ | Registro detallado con afectación de saldo en tiempo real. |
| - Arqueo de caja | ✅ | Conciliación ciega de efectivo vs sistema con registro de desfases. |
| **Usuarios y Roles** | ✅ | Sistema robusto basado en perfiles. |
| - Roles (Admin, Cajero, Mesero, Cocina) | ✅ | Roles operativos definidos y funcionales. |
| - Permisos por rol | ✅ | Acceso restringido según el cargo. |
| - Registro de acciones (auditoría) | 🏗️ | Registro básico en base de datos. |
| **Empresa / Configuración** | ✅ | Gestión centralizada de datos fiscales y parámetros. |
| - Datos fiscales / Logo / Moneda | ✅ | Interfaz `/admin/settings` operativa y dinámica (Marca Blanca). |
| - Horarios de atención | ✅ | Lógica de visualización en Landing Page implementada. |
| **Clientes** | ✅ | Módulo de gestión de clientes implementado. |
| - Historial de consumo | ✅ | Seguimiento de pedidos por cliente. |
| **Productos / Menú** | ✅ | CRUD completo con categorías y disponibilidad. |
| - Variantes / Extras / Combos | 🏗️ | Estructura base lista; falta UI para modificadores complejos. |
| **Inventario** | ✅ | Sistema avanzado de control de insumos. |
| - Stock en tiempo real | ✅ | Actualización automática. |
| - Alertas de stock mínimo | ✅ | Indicadores visuales y filtros críticos. |
| - Costeo de platos (Recetas) | ✅ | Desglose de ingredientes por producto. |
| **Impresoras** | ✅ | Soporte base para impresión de tickets. |
| **Tickets / Facturación** | ✅ | Generación de ticket simple para cobro. |
| - Métodos de pago | ✅ | Soporte para Efectivo, Tarjeta, Transferencia y QR. |

---

## 2. MÓDULO KDS – COCINA (CLAVE)
Optimización del flujo de preparación.

| Funcionalidad | Estado | Observaciones |
| :--- | :---: | :--- |
| **Pantalla KDS** | ✅ | Interfaz dedicada en `/admin/kitchen`. |
| - Órdenes en tiempo real | ✅ | Sincronización instantánea con Supabase. |
| - Estados (Pendiente, Listo, etc.) | ✅ | Flujo actual: Pendiente -> Preparando -> Listo. |
| - Gestión avanzada de estados | 🏗️ | Pendiente implementar flujo de 7 estados (Aceptado, Pausa, etc). |
| - Tiempo de preparación | ✅ | Registro de tiempos en base de datos. |

### 🛠️ Especificación de Estados KDS (Recomendado)
Para optimizar el flujo de cocina, se implementará el siguiente ciclo de vida:

1. **Nuevo / Recibido** (Azul): Pedido recién llegado, pendiente de aceptación.
2. **Aceptado** (Cyan): Reconocido por cocina pero no iniciado.
3. **En preparación** (Naranja): Proceso activo, temporizador en marcha.
4. **En pausa / Espera** (Amarillo): Detenido por falta de insumos o coordinación.
5. **Listo** (Verde): Terminado y notificado a sala.
6. **Servido / Entregado** (Gris): Entregado al cliente final.
*Extra:* **Cancelado** (Rojo), **Retrasado** (Alerta), **Rehecho** (Bandera de error).

---

## 3. MÓDULO DE CAJA (FINANZAS Y CONTROL)
Gestión de turnos y flujos de efectivo por usuario.

| Funcionalidad | Estado | Observaciones |
| :--- | :---: | :--- |
| **Gestión de Turnos** | ✅ | Flujo integrado: Apertura -> Operación -> Arqueo -> Cierre. |
| - Apertura de caja | ✅ | Registro de saldo inicial por medio de pago habilitado. |
| - Arqueo de caja | ✅ | Reporte automático de diferencias sistema vs físico. |
| - Cierre de caja | ✅ | Cierre irreversible con resumen final y bloqueo contable. |
| **Movimientos de Efectivo** | ✅ | Soporte total para múltiples medios de pago. |
| - Entradas / Salidas | ✅ | Registro detallado de ingresos y egresos (Petty Cash). |
| - Diferenciación medio pago | ✅ | Soporte para Efectivo, Tarjeta, Transferencia y QR centralizado. |

### 💰 Especificación de Caja Profesional
1. **Estados de Caja:** 🔴 Cerrada (solo historial), 🟢 Abierta (operación), 🟠 En Arqueo (bloqueo para conteo).
2. **Gestión de Movimientos:**
   - Entradas: Propinas, fondo adicional.
   - Salidas: Compras menores, cambios, retiros.
   - **Inmutabilidad:** Movimientos prohibidos de borrar; solo anluaciones con registro de auditoría.
3. **Arquéo (Punto Crítico):** Comparación ciega de saldos por medio de pago con registro de sobrantes/faltantes.

---

## 4. MÓDULOS AVANZADOS (DIFERENCIADORES)
Lo que hace al sistema premium y competitivo.

| Funcionalidad | Estado | Observaciones |
| :--- | :---: | :--- |
| **Delivery y Take Away** | ✅ | Sistema completo con RBAC y configuración dinámica. (Pickup/Delivery, Drivers) |
| **Comandas desde móvil (Meseros)** | ✅ | Módulo `/admin/waiter` optimizado para tablets/móviles. |
| **Análisis y BI (Dashboard)** | ✅ | Gráficos de tendencias, ranking de productos y meseros. |
| **Seguridad** | ✅ | Protección de rutas y base de datos (Supabase Auth/RLS). |
| **Fidelización (Puntos/Cupones)** | ✅ | Sistema de "Puntos Gran Rafa" y gestión de cupones. |
| **Pargo Bot (IA Assistant)** | ✅ | Asistente de consultas inteligente (Ventas, Stock, Productos). |
| **Mapas Interactivos Sala** | ✅ | Visualización 2D Draggable integrada en Admin y Mesero. |

---

---

## 5. ✅ PRÓXIMOS PASOS (BACKLOG)

Para completar al 100% los módulos base e intermedios propuestos:

1. **Módulo de Caja (Fase 1 - Core):** ✅ Tablas creadas. ✅ Interfaz de Apertura terminada. ✅ Pantalla de Operación terminada.
2. **Módulo de Caja (Fase 2 - Cierre):** ✅ Ingresos/Egresos terminados. ✅ Arqueo (Ciego) terminado. ✅ Cierre Irreversible terminado.
3. **Módulo de Caja (Fase 3 - POS Engine):** ✅ Esquema DB robusto (`shifts`, `cash_sessions`) implementado. ✅ Server Actions seguras creadas. ✅ Flujo de inicio obligatorio (Start Shift -> Open Box) implementado. ✅ Cierre coordinado de turno y caja. ✅ Arqueos parciales funcionales.
4. **Configuración de Empresa:** ✅ Interfaz y base de datos terminadas. Datos fiscales y logos dinámicos habilitados.
5. **Mejoras en Ventas:** ✅ Cambio de Mesa y Mover Producto terminados en el Portal de Mesero.
6. **Cocina KDS Premium:** ✅ Realtime activado. ✅ Alertas sonoras y visuales por demoras. ✅ Gestión de agotados desde la cocina.
7. **Tickets PRO (PDF):** ✅ Generación de ticket térmico integrada en el historial de Caja.
8. **Dashboard de Estadísticas:** ✅ Interfaz `/admin/dashboard` terminada con gráficas Recharts.
9. **Loyalty System (Puntos):** ✅ Buscador de clientes y visualización de puntos en Caja.
10. **Pargo Bot Core:** ✅ Motor de análisis en lenguaje natural para métricas clave.
11. **Inventario Avanzado:** ✅ Control de stock automático, alertas de insumos críticos, proveedores, compras y mermas funcional.
12. **Módulo de Reservas y Clientes:** ✅ Gestión de ocupación, historial de visitas y notificaciones WhatsApp.
13. **Visual Floor Manager (Premium):** ✅ Mapa interactivo 2D del restaurante con soporte para múltiples zonas (Interior, Terraza, etc.), Grid Snap y Realtime.
14. **Documentación:** ✅ Manual de Usuario Vivo v1.7 (Pargo OS Enterprise).
15. **IA Analytics (Pargo Bot):** ✅ Asistente de consultas inteligente con predicciones de ventas (tendencias 7 días), análisis de MVP de staff y ticket promedio.
16. **NPS & WhatsApp Feedback Loop:** 🏗️ Encuestas de satisfacción automáticas post-servicio.
17. **KDS Multiestación Inteligente:** 🏗️ Despacho coordinado por tipos de producto (Fríos/Calientes).
18. **Biometría de Seguridad:** 🏗️ Autorización de operaciones críticas mediante PIN/Biometría.
19. **Resiliencia Offline-First:** ✅ Capacidad de toma de pedidos sin internet con sincronización atómica automática al restaurar conexión.
20. **Mapas de Calor de Ventas:** ✅ Visualización geográfica de ingresos sobre el plano de sala para identificar zonas de alta y baja rentabilidad ("Hotspots").
21. **Diseño Cinematic Premium:** ✅ Landing Page y Portal de Meseros con estética de lujo y carga optimizada de recursos.
22. **Gestión de Personal Administrativa:** ✅ Perfiles ampliados con Cédula, Fecha de Ingreso y Auditoría de Roles.
23. **Optimización Multi-dispositivo:** ✅ Panel responsivo validado para PC, Tablet y Smartphones.
24. **Tarjetas Adaptables Dinámicas:** ✅ Refinamiento de UI: Fichas grandes con fotos y Fichas ultra-compactas (modo texto) para eficiencia operativa.
25. **Pagos QR Dinámicos (Backlog):** 🏗️ Generación de códigos Nequi/Bancolombia con monto automático.
26. **WhatsApp Feedback Loop (Backlog):** 🏗️ Encuestas de satisfacción post-servicio automáticas.
27. **IA Smart Stock (Backlog):** 🏗️ Predicciones de inventario basadas en histórico de ventas.

### 🧪 TAREAS DE QA Y VALIDACIÓN (PRIORIDAD ALTA)
- [x] **Prueba de Flujo Completo POS:** Validar redirección Login -> Start Shift -> Open Box -> Dashboard -> Cerrar Caja. (Implementado técnica y visualmente)
- [ ] **Validación RLS:** Verificar que un cajero solo vea su turno/caja y no pueda modificar otros.
- [x] **Integridad Financiera:** Verificar que los movimientos de caja (ingresos/egresos) sumen correctamente en el cierre. (Cálculo implementado en Server Action)
- [x] **Prueba Multiusuario:** Simular dos cajeros intentando abrir la misma caja (debe bloquear). (Validación implementada en `openCashbox`)

---

## 6. 🛠️ ESPECIFICACIÓN TÉCNICA DETALLADA (POS ENGINE)

Esta sección define la arquitectura "Enterprise Grade" requerida para el núcleo transaccional del sistema.

### 6.1 Flujo Obligatorio de Inicio de Jornada
El sistema DEBE forzar este flujo secuencial sin atajos:

1.  **Login:** Usuario/Contraseña -> Validación Rol -> Token.
2.  **Asignación de Turno:** Selección Turno (Mañana/Tarde/Noche) -> `Un usuario = Un turno activo`.
3.  **Estado de Caja:** Verificar `cashbox.status`. Si está cerrada -> Obligar Apertura.
4.  **Apertura de Caja:** Saldo Inicial (Billetes/Monedas) -> Confirmación -> `cashbox_session` creada.
5.  **Operación (Dashboard):** Se habilitan ventas. Header muestra: Usuario, Turno, Estado Caja, Saldo.

### 6.2 Validaciones Técnicas (Backend Hard Rules)
*Las validaciones en frontend son solo visuales. El backend es la autoridad.*

1.  **Caja (Estado Crítico):** Antes de CADA venta, validar:
    *   `cashbox.status = OPEN`
    *   `cashbox.user_id = session.user_id`
    *   `turn.status = OPEN`
    *   **Regla:** Si falla UNA validación -> Venta rechazada (HTTP 403).
2.  **Apertura Atómica:** `UNIQUE constraint` en `(user_id, status='OPEN')` para turnos y cajas.
3.  **Integridad de Precios:** Los precios se copian a `sale_items` al momento de la venta. No se referencian dinámicamente para mantener historial inmutable.
4.  **Auditoría Inmutable:** Tabla `audits` registra `user_id`, `action`, `before_data`, `after_data` para TODA operación de caja o inventario.

### 6.3 Esquema de Base de Datos (Core)

```sql
-- 1. Usuarios y Roles
create table users (id uuid pk, name text, pin_hash text, active boolean);
create table roles (id uuid pk, name text); -- Admin, Cajero, Mesero
create table role_permissions (role_id uuid, permission text); -- 'open_cash', 'sell', 'void_sale'

-- 2. Sesiones y Dispositivos
create table devices (id uuid pk, fingerprint text, name text);
create table shifts (id uuid pk, user_id uuid, status text, started_at timestamptz, ended_at timestamptz);

-- 3. Caja y Movimientos
create table cashboxes (id uuid pk, name text, status text); -- 'Caja Principal'
create table cashbox_sessions (
  id uuid pk, cashbox_id uuid, shift_id uuid, user_id uuid,
  opening_amount numeric, closing_amount numeric, difference numeric,
  status text -- 'OPEN', 'CLOSED', 'ARCHIVED'
);
create table cash_movements (
  id uuid pk, session_id uuid, type text, amount numeric, reason text
); -- type: 'SALE', 'REFUND', 'DEPOSIT', 'WITHDRAWAL'

-- 4. Ventas
create table sales (
  id uuid pk, session_id uuid, total numeric, status text -- 'COMPLETED', 'VOIDED'
);
create table sale_items (sale_id uuid, product_id uuid, price_at_sale numeric, quantity int);
create table payments (sale_id uuid, method text, amount numeric); -- 'CASH', 'CARD', 'QR'

-- 5. Auditoría
create table audits (
  id uuid pk, user_id uuid, action text, entity text, entity_id uuid, payload jsonb
);
```

### 6.4 Casos Límite y Anti-Fraude
1.  **Venta sin caja:** Backend rechaza transacción. Alerta de seguridad.
2.  **Cierre de sesión con caja abierta:** El turno y la caja permanecen abiertos a nombre del usuario. Al volver a entrar, se restaura el estado.
3.  **Offline:**
    *   Permitido: Crear ventas, imprimir tickets (UUID local).
    *   Sincronización: Al volver online, se envían ventas en lote.
    *   Conflictos: El servidor valida integridad (hash).
4.  **Manipulación de Precios:** El historial de cambios de precio de productos queda en `audits`. Las ventas pasadas no cambian.

### 6.5 Endpoints API (Referencia)
*   `POST /auth/login`
*   `POST /shifts/open` | `POST /shifts/close`
*   `POST /cashbox/open` | `POST /cashbox/close`
*   `POST /sales` (Transaccional: crea venta + items + pago + movimiento de caja)
*   `GET /reports/z-cut` (Cierre Z)

---

## 7. 💎 IDEAS PREMIUM "TOP" (HOJA DE RUTA ROBUSTA)

Para elevar Pargo Rojo a un nivel de competencia internacional (Enterprise Grade):

1.  **Visual Floor Manager (Completado):** Diseñador Drag & Drop con soporte para zonas y Mapa de Calor.
2.  **Pargo Bot (Completado):** Asistente IA con predicciones y análisis de staff.
3.  **WhatsApp Feedback Loop (NPS):** Envío automático de encuestas post-servicio para calificar la experiencia.
4.  **KDS Multiestación Inteligente:** Despacho coordinado por tipos de producto (Fríos/Calientes).
5.  **Biometría / PIN de Seguridad:** Autorización de operaciones críticas (anulaciones/descuentos) mediante PIN o reconocimiento facial.
6.  **IA Waste Control (Mermas):** Análisis inteligente de desperdicios para optimizar compras.
7.  **CRM de Preferencias:** Historial detallado por cliente (alergias, gustos, frecuencia).
8. **Pargo Hub (Mobile Admin):** ✅ Dashboard ultra-rápido para el dueño optimizado para smartphones con métricas live.
9.  **Pagos QR Dinámicos:** Generación de códigos Nequi/Bancolombia con monto automático.
10. **KDS Gamification:** Sistema de puntos y rankings para el personal de cocina basado en tiempos de entrega.
11. **Smart Upselling Engine:** Sugerencias automáticas de acompañamientos basadas en el pedido actual.
12. **Multi-Sede Enterprise:** Gestión centralizada de múltiples sucursales desde un solo panel.

---
*Especificación técnica actualizada el: 24 de enero de 2026 (Pargo OS Enterprise)*

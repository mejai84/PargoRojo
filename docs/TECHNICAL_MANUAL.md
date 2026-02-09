# 📘 MANUAL TÉCNICO - SISTEMA PARGO ROJO
**Versión:** 2.1 (Producción)
**Fecha de Generación:** 2026-02-09
**Estado:** Sistema Implementado y Operativo

---
# TABLA DE CONTENIDOS

1. [📱 Menú Digital (QR)](#1-menú-digital-qr)
2. [📦 Inventario y Recetas](#2-inventario-y-recetas)
3. [🔔 Notificaciones Realtime](#3-notificaciones-realtime)
4. [💳 Pasarela de Pagos (Wompi)](#4-pasarela-de-pagos)
5. [👥 Roles y Seguridad](#5-roles-y-seguridad)

---

<a name="1-menú-digital-qr"></a>
# 1. 📱 Menú Digital QR para Mesas

## 🎯 Resumen
Sistema que permite a los clientes escanear un código QR en su mesa, ver el menú filtrado, y realizar pedidos que se asocian automáticamente a dicha mesa.

## 📦 Componentes Clave
- **Base de Datos**: Tabla `tables` con campos de posicionamiento y `qr_code`.
- **Frontend Clientes**: `/menu-qr?table=UUID`. Identifica mesa, muestra menú, permite pedir.
- **Frontend Admin**: `/admin/tables`. Gestión visual de mesas, generación de QRs para imprimir.
- **Librería**: `qr-code-styling` para generación de códigos visuales.

## 🚀 Flujo
1. Admin crea mesa en `/admin/tables`.
2. Sistema genera UUID y URL única.
3. Se imprime QR.
4. Cliente escanea -> Redirige a `/menu-qr`.
5. localStorage guarda `table_id`.
6. Pedido se crea con `order.table_id`.

---

<a name="2-inventario-y-recetas"></a>
# 2. 📦 Gestión de Inventario

## 🎯 Resumen
Control de stock en tiempo real basado en recetas. Cada vez que se vende un "Plato", se descuentan sus ingredientes (ej: Pescado, Arroz, Limón).

## 📊 Estructura de Datos
- **ingredients**: Insumos puros (kg, lt, un).
- **recipes**: Tabla pivote `product_id` <-> `ingredient_id` con cantidad.
- **inventory_movements**: Auditoría de kardex (entradas, salidas, ventas).

## ⚙️ Automatización
- **Trigger**: `deduct_inventory_on_sale`.
- **Evento**: Al cambiar orden a `completed` o `delivered`.
- **Acción**: Lee receta -> Calcula consumo -> Resta de `ingredients` -> Inserta en `movements`.

## 🚨 Alertas
- Semáforo en Dashboard si `current_stock < min_stock`.

---

<a name="3-notificaciones-realtime"></a>
# 3. 🔔 Sistema de Notificaciones

## 🎯 Resumen
Alertas instantáneas para cocina (nuevos pedidos) y clientes (estado de su orden) usando WebSockets.

## 🛠 Tecnología
- **Supabase Realtime**: Escucha cambios en tabla `orders`.
- **Hooks React**: 
  - `useAdminNotifications`: Suena alarma en cocina al llegar INSERT en `orders`.
  - `useCustomerNotifications`: Avisa al cliente al haber UPDATE en su `order_id`.

## 🔊 Sonidos
- `public/sounds/new-order.mp3`: Alerta fuerte para cocina.
- `public/sounds/notification.mp3`: Alerta suave para cliente.

---

<a name="4-pasarela-de-pagos"></a>
# 4. 💳 Pagos Locales (Wompi Colombia)

## 🎯 Resumen
Integración completa con Wompi para recibir pagos por Nequi, Bancolombia, PSE y Tarjetas.

## 🔐 Seguridad
- **Integrity Signature**: SHA-256 de cadena de transacción.
- **Webhooks**: Verificación de firma en `/api/webhooks/wompi`.

## 🔄 Flujo
1. Checkout -> Selecciona "Pago Online".
2. Backend genera `payment_link` con referencias firmadas.
3. Cliente paga en Wompi.
4. Wompi notifica al Webhook.
5. Webhook valida firma y actualiza `orders.status` a `paid`.

---

<a name="5-roles-y-seguridad"></a>
# 5. 👥 Roles, Permisos y Redirección

## 🎯 Resumen
Sistema automático de control de acceso basado en roles (RBAC) con redirección inteligente.

## 👥 Roles Definidos
1. **ADMIN**: Acceso total.
2. **CAJERO**: Acceso a Caja, Pedidos, Clientes.
   - *Redirección*: `/admin/cashier/start-shift`
3. **MESERO**: Acceso a Portal Mesero (toma de pedidos).
   - *Redirección*: `/admin/waiter`
4. **COCINA**: Acceso a KDS (Pantalla de Cocina).
   - *Redirección*: `/admin/kitchen`
5. **MANAGER**: Acceso operativo total, sin config. system.
6. **HOST**: Acceso a Recepción/Reservas.

## ⚙️ Implementación Técnica
- **Control de Menú**: `src/app/admin/layout.tsx` filtra los items del sidebar comparando el rol del usuario con `item.roles`.
- **ShiftGuard**: Componente `src/components/admin/shift-guard.tsx` que envuelve el admin.
  - Detecta si el usuario está en `/admin` raíz.
  - Si tiene un rol operativo (no admin), lo **redirige forzosamente** a su módulo principal.
  - Ejemplo: Un cajero que entra a `/admin` es enviado a apertura de turno automáticamente.

---

**Nota:** Este documento consolida las guías de implementación previas. Para detalles de código histórico o guías paso a paso antiguas, consultar la carpeta `docs/archive`.

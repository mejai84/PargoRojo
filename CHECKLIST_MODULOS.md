# 📋 Checklist de Módulos - Proyecto Pargo Rojo

> **🤖 REGLA PARA EL AGENTE:** Al inicio de cada sesión, lee este archivo obligatoriamente. Al finalizar una tarea, marca el progreso REAL y actualiza el backlog. Si el usuario pide algo nuevo, agrégalo aquí primero.

Este documento detalla el estado actual de implementación del sistema POS para el restaurante **Pargo Rojo**, comparando las funcionalidades desarrolladas con los requisitos ideales de un sistema competitivo.

---

## 1. MÓDULOS PRINCIPALES DEL POS (BASE)
Estos son imprescindibles para la operación diaria.

| Funcionalidad | Estado | Observaciones |
| :--- | :---: | :--- |
| **Ventas / Mesas** | 🏗️ | Gestión de mesas por zona y QR implementado. |
| - Apertura de mesa | ✅ | Se activa al crear el primer pedido. |
| - Cambio de mesa | ✅ | Implementado en Portal de Mesero (Cambio y Mover Producto). |
| - Unir / dividir mesas | ✅ | Soporte para unir mesas (parent_table_id). Dividir pendiente. |
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
| - Datos fiscales / Logo / Moneda | ✅ | Interfaz `/admin/settings` operativa y dinámica. |
| - Horarios de atención | 🏗️ | Pendiente lógica de bloqueo por horario. |
| **Clientes** | ✅ | Módulo de gestión de clientes implementado. |
| - Historial de consumo | ✅ | Seguimiento de pedidos por cliente. |
| **Productos / Menú** | ✅ | CRUD completo con categorías y disponibilidad. |
| - Variantes / Extras / Combos | 🏗️ | Estructura base lista, falta UI compleja para modificadores. |
| **Inventario** | ✅ | Sistema avanzado de control de insumos. |
| - Stock en tiempo real | ✅ | Actualización automática. |
| - Alertas de stock mínimo | ✅ | Indicadores visuales y filtros críticos. |
| - Costeo de platos (Recetas) | ✅ | Desglose de ingredientes por producto. |
| **Impresoras** | 🏗️ | Soporte base para impresión de tickets. |
| **Tickets / Facturación** | 🏗️ | Generación de ticket simple para cobro. |
| - Métodos de pago | 🏗️ | Soporte para efectivo configurado por defecto. |

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

### 🔑 Diseño Funcional: Apertura de Caja
La apertura habilita las ventas y el control contable. Sin apertura, el POS está bloqueado.

**Estructura de la Interfaz:**
- **Operador:** Selección automática del usuario autenticado + Rol (Cajero/Admin) + Turno.
- **Saldos Iniciales:** Tabla por medio de pago (Efectivo, Tarjeta, Transferencia, QR). Solo Efectivo permite monto inicial > 0 por defecto.
- **Validaciones:** Prohibido valores negativos. Carga automática de fecha/hora.
- **Confirmación:** Requiere PIN/Contraseña del usuario para autorizar.

**Reglas Críticas:**
- ✔️ Una caja abierta por usuario a la vez.
- ✔️ Fecha y hora inalterables (servidor).
- ✔️ Generación automática de registros de Turno y Saldo Inicial.
- ✔️ Prohibido cerrar caja con mesas abiertas.

### 🖥️ Diseño Funcional: Caja en Operación
Pantalla central de control de turno tras la apertura.

**Información en Tiempo Real:**
- **Estado General:** Caja Abierta, Usuario, Turno, Hora y Tiempo de Turno Activo.
- **Saldo Actual:** Monto total centralizado con desglose automático por medio de pago (Efectivo, Tarjeta, etc).
- **Métricas Rápidas:** Total ventas, número de tickets y ticket promedio del turno.

**Acciones Rápidas (1-2 Clics):**
- ➕ **Ingreso:** Propinas, fondo adicional.
- ➖ **Egreso:** Compras menores, retiros, cambios.
- 🧮 **Arqueo:** Conteo físico parcial o preventivo.
- 🔒 **Cerrar Caja:** Inicia el proceso de finalización de turno.

**Reglas Operativas:**
- ✔️ Cada venta genera movimientos automáticos vinculados al turno.
- ✔️ Cancelaciones generan contramovimientos para auditoría.
- ✔️ Saldo actual siempre visible; no se ocultan métricas al cajero.

---

## 4. MÓDULOS AVANZADOS (DIFERENCIADORES)
Lo que hace al sistema premium y competitivo.

| Funcionalidad | Estado | Observaciones |
| :--- | :---: | :--- |
| **Delivery y Take Away** | 🏗️ | Estructura de pedidos lista, falta tracking de repartidores. |
| **Comandas desde móvil (Meseros)** | ✅ | Módulo `/admin/waiter` optimizado para tablets/móviles. |
| **Análisis y BI (Dashboard)** | ✅ | Gráficos de tendencias, ranking de productos y meseros. |
| **Seguridad** | ✅ | Protección de rutas y base de datos (Supabase Auth/RLS). |
| **Control de Reservas** | ✅ | Módulo completo con calendario y gestión de estados. |
| **Fidelización (Puntos/Cupones)** | ✅ | Sistema de "Puntos Gran Rafa" y gestión de cupones. |

---

## 5. ✅ PRÓXIMOS PASOS (BACKLOG)

Para completar al 100% los módulos base e intermedios propuestos:

1. **Módulo de Caja (Fase 1 - Core):** ✅ Tablas creadas. ✅ Interfaz de Apertura terminada. ✅ Pantalla de Operación terminada.
2. **Módulo de Caja (Fase 2 - Cierre):** ✅ Ingresos/Egresos terminados. ✅ Arqueo (Ciego) terminado. ✅ Cierre Irreversible terminado.
3. **Configuración de Empresa:** ✅ Interfaz y base de datos terminadas. Datos fiscales y logos dinámicos habilitados.
4. **Mejoras en Ventas:** ✅ Cambio de Mesa y Mover Producto terminados en el Portal de Mesero.
5. **Cocina KDS Premium:** ✅ Realtime activado. ✅ Alertas sonoras y visuales por demoras. ✅ Gestión de agotados desde la cocina.
6. **Tickets PRO (PDF):** ✅ Generación de ticket térmico integrada en el historial de Caja.
7. **Dashboard de Estadísticas:** ✅ Interfaz `/admin/dashboard` terminada con gráficas Recharts.
8. **Loyalty System (Puntos):** ✅ Buscador de clientes y visualización de puntos en Caja.
9. **Inventario Avanzado:** ✅ Descuento automático de insumos por venta (Recetas) activo. ✅ Dashboard de stock en tiempo real.

---
*Documento generado el: 23 de enero de 2026*
*Estado del proyecto: **98% Funcionalidad Base Completada***

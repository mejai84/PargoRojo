# 🏗️ 02. Arquitectura Técnica y Modelo de Datos

## 1. Arquitectura de Sistemas
Tipo: **SaaS Multi-tenant** (Aislamiento de datos por `restaurant_id`).

### Capas:
- **Frontend**: Next.js (React) - Responsivo para tablets y móviles.
- **Backend/API**: Supabase (PostgreSQL + RLS + Server Actions).
- **Seguridad**: Autenticación JWT y Roles granulares (RBAC).
- **Infraestructura**: Dockerizada para escalado horizontal.

## 2. Modelo de Datos (Core)
El modelo está diseñado para que NADA se borre, todo se anule o audite.

### Tablas Principales:
- `restaurants`: Entidad raíz (la "Empresa").
- `branches`: Sucursales vinculadas a un restaurante.
- `profiles`: Usuarios vinculados a restaurantes y roles.
- `shifts`: Turnos de trabajo (Jornadas).
- `cashbox_sessions`: Sesiones de caja vinculadas a turnos.
- `orders`: Ventas realizadas.
- `order_items`: Detalle de productos en cada venta.
- `cash_movements`: Todo flujo de dinero (Sale, Refund, Deposit, Withdrawal).
- `products`: Catálogo de productos por restaurante.
- `audits`: Registro inmutable de acciones críticas.

## 3. Reglas Inquebrantables del Dato:
1. **Multi-tenancy**: Todas las queries deben filtrar por `restaurant_id`.
2. **Integridad de Caja**: Una venta SIEMPRE pertenece a una sesión de caja abierta.
3. **Anulaciones**: No se permite `DELETE` en ventas o pagos; se usa un estado `VOIDED`.
4. **Relación Atómica**: El stock debe actualizarse en la misma transacción que la venta.

---
*Guía técnica para el equipo de desarrollo de Pargo Rojo SaaS.*

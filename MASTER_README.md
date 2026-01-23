# 🐟 Pargo Rojo - Sistema Integral de Restaurante

¡Sistema completo implementado! Aquí encontrarás la guía para todas las funcionalidades.

## 📚 Documentación por Módulo

### 1. 🔔 [Notificaciones y Realtime](NOTIFICACIONES_README.md)
- Sistema de alertas para cocina
- Notificaciones de estado para clientes
- Sonidos y alertas de navegador
- Ver detalle: `IMPLEMENTACION_NOTIFICACIONES.md`

### 2. 💳 [Pagos Locales (Wompi)](PAGOS_README.md)
- Integración con Wompi Colombia
- Soporte para Tarjetas, Nequi, PSE, Bancolombia
- Webhooks y seguridad
- Ver detalle: `IMPLEMENTACION_PAGOS.md`

### 3. 📱 [Menú Digital QR](IMPLEMENTACION_MENU_QR.md)
- Menú móvil para clientes
- Sistema de gestión de mesas
- Generación e impresión de QR codes
- Pedidos desde la mesa

### 4. 📦 [Control de Inventario](IMPLEMENTACION_INVENTARIO.md)
- Gestión de ingredientes
- Recetas y descuento automático
- Alertas de stock bajo
- Historial de movimientos

### 5. 🏷️ Gestión de Cupones
- Creación de códigos de descuento
- Validación en checkout
- Límites de uso y fechas
- **Admin**: `/admin/coupons`

### 6. 📅 Sistema de Reservas
- Formulario de reservas para clientes: `/reservas`
- Dashboard de gestión para admin: `/admin/reservations`
- Estados: Pendiente, Confirmada, Cancelada

### 7. 📊 Reportes y Analytics
- Dashboard con KPIs clave: `/admin/reports`
- Ventas diarias, Top productos
- Ticket promedio y métricas de crecimiento

## 🚀 Pasos para Iniciar (IMPORTANTE)

Para que todo funcione, debes ejecutar estos scripts SQL en Supabase en este orden:

1. `supabase_migrations/create_notifications_system.sql`
2. `supabase_migrations/create_coupons_system.sql`
3. `supabase_migrations/create_inventory_system.sql`
4. `supabase_migrations/create_tables_system.sql`
5. `supabase_migrations/create_analytics_functions.sql`

*(Nota: `create_reservations_table.sql` ya debería estar ejecutado)*

## 📂 Estructura de Carpetas Clave

```
src/
├── app/
│   ├── admin/              # Panel de administración
│   │   ├── coupons/        # Gestión de cupones
│   │   ├── inventory/      # Gestión de inventario
│   │   ├── kitchen/        # KDS (Pantalla de cocina)
│   │   ├── reports/        # Analytics
│   │   ├── reservations/   # Gestión de reservas
│   │   └── tables/         # Gestión de mesas y QR
│   ├── menu-qr/            # Interfaz móvil para clientes (QR)
│   └── reservas/           # Página pública de reservas
├── components/
│   ├── admin/              # Componentes del dashboard
│   └── store/              # Componentes de la tienda
└── lib/
    ├── payments/           # Lógica de Wompi
    └── supabase/           # Configuración de base de datos
```

## 🛠️ Credenciales y Configuración

Asegúrate de configurar `.env.local` con:
- Supabase URL & Key
- Wompi Keys (Test/Prod)

## 📞 Soporte

El sistema está diseñado para ser modular. Si necesitas desactivar algo (ej: reservas), simplemente oculta el enlace en el sidebar.

¡Disfruta tu nuevo sistema! 🚀

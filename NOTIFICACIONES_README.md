# Sistema de Notificaciones Push en Tiempo Real - Pargo Rojo

## 📋 Descripción

Sistema completo de notificaciones push en tiempo real implementado con Supabase Realtime que permite:

### Para la Cocina (Admin):
- ✅ Recibir alertas sonoras y visuales inmediatas cuando entra un nuevo pedido
- ✅ Notificaciones que NO requieren refrescar la página
- ✅ Sonido especial para nuevos pedidos (más fuerte y persistente)
- ✅ Notificaciones del navegador con interacción requerida
- ✅ Contador de notificaciones no leídas en tiempo real

### Para el Cliente:
- ✅ Recibir notificaciones cuando el pedido cambia de estado:
  - "Preparando" → Tu pedido está siendo preparado 👨‍🍳
  - "Listo" → Tu pedido está listo para recoger ✅
  - "Entregado" → ¡Gracias por tu compra! 🎉
  - "Cancelado" → Tu pedido ha sido cancelado ❌
- ✅ Notificaciones visuales en la página de cuenta
- ✅ Notificaciones del navegador
- ✅ Sonido de alerta

## 🚀 Instalación

### Paso 1: Ejecutar la Migración de Base de Datos

1. Ve a tu panel de Supabase: https://supabase.com/dashboard/project/ryxqoapxzvssxqdsyfzw/sql
2. Copia y pega el contenido del archivo `supabase_migrations/create_notifications_system.sql`
3. Haz clic en "Run" para ejecutar la migración

Esto creará:
- ✅ Tabla `notifications` con políticas RLS
- ✅ Triggers automáticos para nuevos pedidos
- ✅ Triggers automáticos para cambios de estado
- ✅ Índices para optimizar el rendimiento

### Paso 2: Habilitar Realtime en Supabase

1. Ve a: https://supabase.com/dashboard/project/ryxqoapxzvssxqdsyfzw/database/publications
2. Asegúrate de que las siguientes tablas estén habilitadas para Realtime:
   - ✅ `orders`
   - ✅ `notifications`

### Paso 3: Agregar Archivos de Sonido

Necesitas agregar dos archivos de sonido en la carpeta `public/sounds/`:

1. **notification.mp3** - Sonido general para notificaciones (volumen 50%)
2. **new-order.mp3** - Sonido especial para nuevos pedidos en cocina (volumen 70%)

Puedes usar sonidos de:
- https://mixkit.co/free-sound-effects/notification/
- https://freesound.org/

O crear tus propios sonidos.

## 📱 Cómo Funciona

### Flujo de Notificaciones para Admin (Cocina)

1. **Cliente hace un pedido** → Se inserta en la tabla `orders`
2. **Trigger automático** → Crea notificación en tabla `notifications` para todos los admins
3. **Supabase Realtime** → Envía evento en tiempo real
4. **Frontend detecta** → Hook `useAdminNotifications` recibe el evento
5. **Acciones simultáneas**:
   - 🔔 Muestra notificación del navegador (requiere interacción)
   - 🔊 Reproduce sonido de alerta fuerte
   - 📊 Actualiza contador de notificaciones
   - 📝 Agrega a la lista de notificaciones

### Flujo de Notificaciones para Cliente

1. **Admin cambia estado del pedido** → Se actualiza en tabla `orders`
2. **Trigger automático** → Crea notificación para el cliente (si está autenticado)
3. **Supabase Realtime** → Envía evento en tiempo real al cliente
4. **Frontend detecta** → Hook `useCustomerNotifications` recibe el evento
5. **Acciones simultáneas**:
   - 🔔 Muestra notificación del navegador
   - 🔊 Reproduce sonido de alerta
   - 📱 Actualiza la sección de notificaciones en /cuenta

## 🎯 Componentes Implementados

### Backend (Supabase)
- `notifications` - Tabla de notificaciones
- `notify_new_order()` - Función trigger para nuevos pedidos
- `notify_order_status_change()` - Función trigger para cambios de estado
- `cleanup_old_notifications()` - Función para limpiar notificaciones antiguas

### Frontend

#### Hooks
- `useAdminNotifications()` - Hook para notificaciones de admin/cocina
- `useCustomerNotifications()` - Hook para notificaciones de clientes
- `requestNotificationPermission()` - Función para solicitar permisos

#### Componentes
- `<NotificationBell />` - Campana de notificaciones en admin panel
- `<CustomerNotifications />` - Panel de notificaciones en página de cuenta

## 🔧 Configuración de Permisos del Navegador

Para que las notificaciones funcionen correctamente, los usuarios deben:

1. **Permitir notificaciones** cuando el navegador lo solicite
2. Si ya las bloquearon, pueden habilitarlas en:
   - Chrome: Configuración → Privacidad y seguridad → Configuración de sitios → Notificaciones
   - Firefox: Preferencias → Privacidad y seguridad → Permisos → Notificaciones
   - Safari: Preferencias → Sitios web → Notificaciones

## 📊 Tipos de Notificaciones

```typescript
type NotificationType = 
  | 'new_order'           // Nuevo pedido (solo admin)
  | 'order_status_change' // Cambio de estado (cliente)
  | 'low_stock'          // Stock bajo (admin) - futuro
  | 'new_reservation'    // Nueva reserva (admin) - futuro
  | 'new_customer'       // Nuevo cliente (admin) - futuro
```

## 🎨 Características Visuales

### Notificaciones de Admin
- 🔴 Badge rojo con contador de no leídas
- 🔔 Animación de pulso en el ícono
- 📋 Dropdown con lista de notificaciones
- ✅ Marcar como leída / Marcar todas
- 🗑️ Eliminar notificaciones
- 🔗 Click para ir a la página relevante

### Notificaciones de Cliente
- 🎨 Colores según el estado del pedido:
  - Amarillo: Preparando
  - Verde: Listo
  - Azul: Entregado
  - Rojo: Cancelado
- 📅 Fecha y hora de la notificación
- ✅ Marcar como leída
- 📱 Diseño responsive

## 🔒 Seguridad

- ✅ Row Level Security (RLS) habilitado
- ✅ Los usuarios solo ven sus propias notificaciones
- ✅ Solo triggers del sistema pueden crear notificaciones
- ✅ Los usuarios solo pueden actualizar el estado "read"

## 🧪 Cómo Probar

### Probar Notificaciones de Admin:

1. Abre el panel de admin en una ventana
2. Abre la tienda en otra ventana (modo incógnito o diferente navegador)
3. Haz un pedido desde la tienda
4. Verás/escucharás la notificación en el panel de admin inmediatamente

### Probar Notificaciones de Cliente:

1. Inicia sesión como cliente
2. Haz un pedido
3. Ve a tu cuenta (/cuenta)
4. Desde el panel de admin, cambia el estado del pedido
5. Verás/escucharás la notificación en la página de cuenta

## 📈 Próximas Mejoras

- [ ] Notificaciones de stock bajo
- [ ] Notificaciones de nuevas reservas
- [ ] Notificaciones por email (integración con Resend)
- [ ] Notificaciones por WhatsApp
- [ ] Historial completo de notificaciones
- [ ] Configuración de preferencias de notificaciones
- [ ] Notificaciones agrupadas

## 🐛 Troubleshooting

### Las notificaciones no aparecen:
1. Verifica que Realtime esté habilitado en Supabase
2. Revisa la consola del navegador por errores
3. Verifica que los triggers estén creados correctamente
4. Asegúrate de que el usuario tenga permisos de notificación

### El sonido no se reproduce:
1. Verifica que los archivos MP3 existan en `/public/sounds/`
2. Algunos navegadores bloquean autoplay de audio
3. El usuario debe interactuar con la página primero

### Las notificaciones del navegador no funcionan:
1. Verifica los permisos del navegador
2. Asegúrate de que el sitio esté en HTTPS (en producción)
3. Algunos navegadores requieren interacción del usuario primero

## 📝 Notas Importantes

- Las notificaciones se limpian automáticamente después de 30 días
- Las notificaciones del navegador requieren HTTPS en producción
- El sonido de nuevos pedidos es más fuerte (70%) y requiere interacción para cerrar
- Las notificaciones se almacenan en la base de datos para persistencia
- Los clientes invitados (sin cuenta) no reciben notificaciones de cambio de estado

---

**Estado**: ✅ Implementado y listo para usar
**Última actualización**: 2026-01-21

# 🚩 PARGO ROJO OS - Sistema de Operación Gastronómica Industrial

Ecosistema completo de control transaccional, gestión de inventarios y fidelización para la cadena de restaurantes Pargo Rojo.

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Módulos Principales](#-módulos-principales)
- [Base de Datos](#-base-de-datos)
- [Deployment](#-deployment)

---

## ✨ Características

### Para Clientes:
- 🛒 Catálogo completo de productos
- 🛍️ Carrito de compras con localStorage
- 💳 Checkout con información de contacto
- 📱 Diseño completamente responsive
- 🎨 UI moderna con animaciones

### Para Administradores:
- 📊 **Dashboard** con métricas en tiempo real
- 🛒 **Gestión de Pedidos** completa
- 👨‍🍳 **KDS (Kitchen Display System)** para cocina
- 🍔 **Gestión de Productos** (CRUD completo)
- 👥 **Gestión de Clientes** con historial
- 👨‍💼 **Gestión de Empleados** y roles
- 📈 **Reportes** con exportación CSV/PDF
- ⚙️ **Configuración** del negocio
- 🔔 **Notificaciones** en tiempo real
- 🌐 **Integración Instagram** (UI preparada)

---

## 🛠️ Stack Tecnológico

### Frontend:
- **Next.js 16.1.3** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/ui** (componentes)
- **Lucide Icons**

### Backend:
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Row Level Security (RLS)**

### Deployment:
- **Vercel** (recomendado)
- **Supabase Cloud**

---

## 📦 Instalación

### Prerrequisitos:
- Node.js 18.x o superior
- npm o yarn
- Cuenta de Supabase

### Pasos:

1. **Clonar el repositorio:**
```bash
git clone https://github.com/mejai84/pargorojo.git
cd pargorojo
```

2. **Instalar dependencias:**
```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno:**
Crear archivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Ejecutar migraciones de base de datos:**
- Ir a Supabase Dashboard > SQL Editor
- Ejecutar los scripts en `/supabase_migrations/`

5. **Ejecutar en desarrollo:**
```bash
npm run dev
# o
yarn dev
```

6. **Abrir en navegador:**
```
http://localhost:3000
```

---

## ⚙️ Configuración

### Supabase Setup:

1. **Crear proyecto** en [Supabase](https://supabase.com)

2. **Ejecutar migraciones:**
   - `create_products_table.sql`
   - `create_orders_table.sql`
   - `create_profiles_table.sql`
   - `create_settings_table.sql` ⭐ NUEVO

3. **Configurar autenticación:**
   - Habilitar Email Auth
   - Configurar políticas RLS

4. **Crear usuario admin:**
```sql
-- Registrar usuario en el panel de auth
-- Luego actualizar su rol:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'tu_email@ejemplo.com';
```

### Acceso al Panel Admin:

1. Ir a `/login`
2. Iniciar sesión con usuario admin
3. Acceder a `/admin`

**Usuario demo:**
- Email: `mejai84@ejemplo.com`
- Password: `@Mejai840316*`

---

## 📁 Estructura del Proyecto

```
pargorojo/
├── src/
│   ├── app/                    # App Router (Next.js 14+)
│   │   ├── admin/             # Panel de administración
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── orders/        # Gestión de pedidos
│   │   │   ├── kitchen/       # KDS (cocina)
│   │   │   ├── products/      # Gestión de productos
│   │   │   ├── customers/     # Gestión de clientes
│   │   │   ├── employees/     # Gestión de empleados
│   │   │   ├── reports/       # Reportes ⭐ NUEVO
│   │   │   └── settings/      # Configuración ⭐ MEJORADO
│   │   ├── checkout/          # Proceso de compra
│   │   ├── login/             # Autenticación
│   │   ├── menu/              # Catálogo público
│   │   └── page.tsx           # Home
│   ├── components/
│   │   ├── admin/             # Componentes del admin
│   │   ├── store/             # Componentes de la tienda
│   │   └── ui/                # Componentes reutilizables
│   ├── lib/
│   │   ├── supabase/          # Cliente y utilidades
│   │   │   ├── client.ts
│   │   │   ├── settings.ts    ⭐ NUEVO
│   │   │   └── notifications.ts ⭐ NUEVO
│   │   └── data.ts            # Datos estáticos
│   └── styles/
├── public/
│   ├── images/
│   └── sounds/                ⭐ NUEVO
├── supabase_migrations/       ⭐ NUEVO
└── package.json
```

---

## 🎯 Módulos Principales

### 1. Dashboard (`/admin`)
- Métricas en tiempo real
- Gráficos de ingresos semanales
- Top productos del día
- Comparación vs día anterior
- Tarjetas interactivas

### 2. Gestión de Pedidos (`/admin/orders`)
- Vista completa de pedidos
- Filtrado por estado
- Creación manual de pedidos
- Actualización de estados
- Vista detallada

### 3. KDS - Sistema de Cocina (`/admin/kitchen`)
- Vista optimizada para cocina
- Pedidos en tiempo real
- Actualización rápida de estados
- Notificaciones sonoras

### 4. Gestión de Productos (`/admin/products`)
- CRUD completo
- Upload de imágenes
- Categorización
- Productos archivados

### 5. Reportes (`/admin/reports`) ⭐ NUEVO
- Análisis por período
- Top productos
- Ingresos diarios
- Exportación CSV/PDF

### 6. Configuración (`/admin/settings`) ⭐ MEJORADO
- Información del negocio
- Horarios de atención
- Configuración de delivery
- Estado abierto/cerrado
- Integración Instagram (UI)

### 7. Notificaciones ⭐ NUEVO
- Tiempo real con Supabase
- Push notifications
- Sonido de alerta
- Contador de no leídas

---

## 🗄️ Base de Datos

### Tablas Principales:

#### `products`
```sql
- id (UUID, PK)
- name (TEXT)
- description (TEXT)
- price (NUMERIC)
- category (TEXT)
- image_url (TEXT)
- available (BOOLEAN)
- created_at (TIMESTAMP)
```

#### `orders`
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- guest_info (JSONB)
- items (JSONB[])
- total (NUMERIC)
- status (TEXT)
- created_at (TIMESTAMP)
```

#### `profiles`
```sql
- id (UUID, PK → auth.users)
- email (TEXT)
- full_name (TEXT)
- phone (TEXT)
- role (TEXT) -- admin, staff, customer
```

#### `settings` ⭐ NUEVO
```sql
- id (UUID, PK)
- key (TEXT, UNIQUE)
- value (JSONB)
- updated_at (TIMESTAMP)
```

### Políticas RLS:

- **Products**: Lectura pública, escritura solo admin
- **Orders**: Usuarios ven sus pedidos, admin ve todos
- **Profiles**: Usuarios ven su perfil, admin ve todos
- **Settings**: Lectura pública, escritura solo admin

---

## 🚀 Deployment

### Vercel (Recomendado):

1. **Conectar repositorio** en Vercel
2. **Configurar variables de entorno:**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
3. **Deploy automático** en cada push a main

### Supabase:

1. Proyecto ya configurado
2. Ejecutar migraciones si es necesario
3. Verificar políticas RLS

---

## 📱 URLs Principales

- **Home:** `/`
- **Menú:** `/menu`
- **Checkout:** `/checkout`
- **Login:** `/login`
- **Admin Dashboard:** `/admin`
- **Reportes:** `/admin/reports`

---

## 🔐 Roles y Permisos

### Admin:
- Acceso total al panel
- Gestión de productos
- Gestión de pedidos
- Configuración del sistema
- Gestión de empleados
- Reportes

### Staff:
- Gestión de pedidos
- Acceso a cocina (KDS)
- Sin acceso a configuración
- Sin acceso a productos

### Customer:
- Ver y hacer pedidos
- Ver historial propio

---

## 📝 TODO / Próximas Mejoras

- [ ] Gráficos avanzados con Chart.js
- [ ] Integración real con Instagram API
- [ ] Sistema de inventario
- [ ] Notificaciones por email
- [ ] Programa de fidelización
- [ ] Multi-idioma (i18n)
- [ ] PWA (Progressive Web App)
- [ ] Pagos online (Stripe/PayPal)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el repositorio
2. Crear una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

## 📄 Licencia

Este proyecto es privado y pertenece a Pargo Rojo Restaurante.

---

## 👨‍💻 Autor

**Jaime** - [mejai84](https://github.com/mejai84)

---

## 📞 Contacto

- **Web:** [Pargo Rojo OS](https://pargo-rojo.vercel.app)
- **Email:** info@pargorojo.com
- **Ubicación:** Colombia

---

## 🎉 Estado del Proyecto

✅ **COMPLETADO Y FUNCIONAL**

- [x] Frontend de tienda
- [x] Panel de administración completo
- [x] Sistema de pedidos
- [x] Gestión de productos
- [x] Gestión de usuarios
- [x] Reportes y analytics
- [x] Notificaciones en tiempo real
- [x] Configuración persistente
- [x] Exportación de datos

**Versión:** 2.0  
**Última actualización:** 2026-01-20  
**Estado:** ✅ Producción Ready

---

*Desarrollado para el ecosistema Pargo Rojo*

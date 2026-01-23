# 📘 Manual de Usuario - Plataforma Pargo Rojo

Este documento describe las funcionalidades del sistema de gestión para el restaurante **Pargo Rojo**. El sistema está dividido en dos grandes áreas: la **Web Pública** (para clientes) y el **Panel Administrativo** (para empleados).

---

## 🍽️ 1. Para el Cliente (Web Pública)

Accesible desde cualquier dispositivo móvil o computador.

### **Menú Digital Interactivo**
- **Navegación Visual:** Explora las categorías (Pescados, Carnes, Arroces, etc.) con imágenes de alta calidad.
- **Buscador:** Encuentra platos específicos escribiendo su nombre o ingredientes.
- **Detalle de Plato:** Al hacer clic en una categoría, se ven todos los platos disponibles.

### **Reservas en Línea**
- Los clientes pueden solicitar una reserva indicando fecha, hora y número de personas.
- Reciben confirmación visual si la reserva es exitosa.

### **Zona de Clientes**
- **Registro:** Nuevos usuarios pueden crear cuenta fácilmente.
- **Historial:** (Próximamente) Ver sus pedidos anteriores y estado.

---

## 👨‍🍳 2. Panel Administrativo (Operaciones)

Accesible para el personal autorizado (Administradores, Meseros, Cocineros, Cajeros).

### **📱 Portal de Meseros (`/admin/waiter`)**
Es la herramienta principal para la operación en salón.
- **Mapa de Mesas:** Vista en tiempo real de mesas Libres (Blanco) y Ocupadas (Naranja).
- **Toma de Pedidos:**
  - Interfaz táctil con fotos de los platos.
  - Buscador rápido de productos.
  - **Observaciones:** Permite añadir notas a cada plato (ej: "Sin cebolla", "Término medio").
- **Gestión de Cuentas:**
  - Ver el consumo total de una mesa en tiempo real.
  - **Solicitar Cuenta:** Botón para notificar a caja que la mesa desea pagar.

### **🍳 Pantalla de Cocina - KDS (`/admin/kitchen`)**
Reemplaza las chits de papel.
- **Cola de Pedidos:** Los pedidos llegan automáticamente ordenados por hora de llegada.
- **Estados:**
  - **Pendiente:** Nuevo pedido recibido.
  - **Preparando:** El cocinero marca que inició la elaboración.
  - **Listo:** Notifica al mesero que puede recoger el plato.
- **Filtros:** Se puede filtrar por estación (Cocina Caliente, Fría, Parrilla, Bebidas).

### **💰 Caja y Facturación (`/admin/pos`)**
Modulo para el Cajero.
- **Cobro de Pedidos:** Ve las mesas que han pedido la cuenta.
- **Métodos de Pago:** Registra pagos en Efectivo, Tarjeta o Transferencia.
- **Liberación de Mesa:** Una vez pagado, la mesa cambia automáticamente a "Libre" en el sistema.

### **💸 Caja Menor (`/admin/petty-cash`)**
Gestión de gastos operativos diarios.
- **Registro de Gastos:** Compras de insumos, pagos de transporte, adelantos, etc.
- **Firma Digital:** El beneficiario debe firmar en la pantalla (tablet/celular) para guardar el comprobante.
- **Historial e Impresión:** Consulta de todos los movimientos y reimpresión de recibos.

### **👥 Gestión de Personal (`/admin/employees`)**
- **Directorio:** Lista de todos los empleados.
- **Roles:** Asignación de permisos (Mesero, Cocinero, Admin, etc.).

### **⚙️ Configuración y Menú**
- **Gestión de Productos:** Crear, editar precios, subir fotos y activar/desactivar platos agotados.
- **Mesas:** Configurar el número y nombre de las mesas del restaurante.

---

## 🚀 Flujo de Trabajo Típico

1. **Llegada:** El cliente llega, el **Mesero** asigna una mesa en el sistema (la marca como ocupada al iniciar pedido).
2. **Pedido:** El Mesero toma la orden en la tablet/celular y envía a cocina.
3. **Preparación:** En **Cocina** aparece el pedido. El Chef lo marca "En preparación" y luego "Listo".
4. **Entrega:** El Mesero recibe la alerta (estado Listo) y lleva la comida.
5. **Cierre:** El cliente pide la cuenta. El Mesero presiona "Solicitar Cuenta".
6. **Pago:** El **Cajero** ve la solicitud, recibe el dinero y finaliza la orden. La mesa queda libre.

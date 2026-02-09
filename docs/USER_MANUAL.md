> **Versión:** 2.0 - Jamali OS Enterprise Edition | **Documento:** Fuente Única de Verdad | **Actualizado:** 8 Feb 2026 (23:15)

---

## 1. INTRODUCCIÓN GENERAL DEL SISTEMA
Jamali OS es una plataforma POS modular en modelo SaaS diseñada para la gestión integral de establecimientos de alimentos, bebidas y retail. El sistema centraliza la operación financiera, administrativa y de producción, garantizando una trazabilidad total desde el ingreso de un pedido hasta el arqueo final de caja.

### 🎯 Objetivos de la Plataforma
- **Optimización Operativa:** Reducción de tiempos de comunicación entre salón y cocina.
- **Control Financiero Estricto:** Seguimiento en tiempo real de flujos de efectivo y gastos operativos.
- **Inteligencia de Negocios:** Generación automática de métricas para la toma de decisiones estratégicas.

---

## 2. CONCEPTOS BÁSICOS Y FLUJO OPERATIVO
El sistema opera bajo un flujo circular que garantiza que cada transacción afecte correctamente al inventario y a la caja.

### Ciclo Diario de Operación
1.  **Apertura de Jornada:** Inicio de turno (Shift) y apertura de sesión de caja física con saldo base.
2.  **Gestión de Ventas:** Recepción de pedidos vía Menú QR, Portal de Meseros o Venta Directa en Caja.
3.  **Producción KDS:** Procesamiento de comandas en tiempo real por estaciones.
4.  **Control Adjudicado:** Registro de egresos y movimientos de caja menor durante el turno.
5.  **Cierre y Auditoría:** Arqueo de efectivo físico contra sistema y generación de reportes de cierre.

---

## 3. ROLES DE USUARIO (RBAC)
El sistema utiliza un Control de Acceso Basado en Roles (RBAC) para proteger la integridad de los datos:

| Rol | Atribuciones Principales | Responsabilidad |
| :--- | :--- | :--- |
| **Administrador** | Acceso total a configuraciones, nómina y reportes financieros. | Auditoría y Estrategia. |
| **Cajero** | Gestión de turnos, facturación, arqueos y movimientos de caja. | Responsabilidad de Valores. |
| **Mesero** | Gestión de mesas, toma de comandas y solicitudes de cuenta. | Atención al Cliente. |
| **Cocina** | Gestión de producción, control de disponibilidad de productos. | Eficiencia de Producción. |
| **Repartidor** | Seguimiento de envíos, actualización de estados de delivery. | Cumplimiento de Entregas. |

---

## 4. DESCRIPCIÓN DETALLADA DE MÓDULOS

### 🏰 4.1. Command Center & Jamali Bot (IA)
El centro neurálgico del sistema permite monitorear la salud del establecimiento bajo la arquitectura Jamali OS Enterprise.
- **Jamali Bot (Asistente IA):** Motor de inteligencia artificial que responde consultas en lenguaje natural sobre ventas, stock y productos top directamente en el dashboard.
- **KPIs en Tiempo Real:** Visualización instantánea de ventas brutas, flujo de caja y ocupación activa del local.
- **Navegación Estructurada:** Sidebar inteligente agrupado por departamentos.

### 🗺️ 4.2. Visual Floor Manager (Mapas 2D)
Gestión visual del salón mediante planos interactivos.
- **Diseño Drag & Drop:** Permite a la administración organizar el mobiliario, definir formas de mesa (circulares, cuadradas) y rotarlas según el plano real.
- **Operación Táctica:** Los meseros ven el plano en tiempo real, permitiendo identificar mesas ocupadas (rojo) y libres al instante.
- **Geometría Dinámica:** Soporte para mesas de diferentes tamaños y orientaciones.

### 💰 4.3. Módulo de Ventas y Motor de Caja (POS Engine)
El corazón financiero del sistema. Permite un control estricto del efectivo.
- **Sesiones de Caja:** Cada cajero es responsable de su sesión. No se pueden procesar ventas sin una caja abierta.
- **Movimientos:** Registro de depósitos (entradas) o retiros (salidas) con justificación obligatoria.
- **Arqueo Parcial:** Permite verificar la existencia de efectivo en cualquier momento del turno sin cerrarlo.

### 🍳 4.2. Cocina - Sistema KDS (Kitchen Display System)
Monitor táctil que reemplaza las comandas de papel.
- **Flujo Kanban:** Visualización en 3 columnas: **RECIBIDAS**, **PREPARANDO** y **LISTAS**.
- **Cronómetro Automático:** Indica el tiempo de espera por pedido. Alertas visuales Cambian a naranja (>10 min) o rojo (>20 min).
- **Estaciones:** Filtrado inteligente para que cada área (Parrilla, Bebidas, Entradas) vea solo lo que le corresponde.

### 💸 4.3. Caja Menor (Petty Cash)
Control de gastos operativos menores.
- **Comprobantes Digitales:** Generación de recibos con numeración consecutiva.
- **Firma Biométrica:** Captura de firma digital del beneficiario directamente en el dispositivo.
- **Traducción Automática:** Conversión de valores numéricos a letras para validez contable.

### 📊 4.4. Reportes y Analítica
Inteligencia en tiempo real para gerencia.
- **KPIs Principales:** Utilidad neta (Ventas - Gastos de Caja Menor), Ticket promedio y Tiempo de preparación.
- **Vendedores Top:** Ranking de eficiencia del personal de servicio.
- **Ranking de Productos:** Identificación de los artículos con mayor rotación y margen.

### 🥘 4.5. Inventario Avanzado (Supply Chain)
Sistema de control de materias primas y costeo.
- **Libro de Recetas:** Fichas técnicas que vinculan productos de venta con ingredientes. Cada venta descuenta automáticamente la porción configurada.
- **Entradas Formales:** Módulo para registrar compras a proveedores, actualizando el stock y el costo unitario del insumo.
- **Gestión de Mermas:** Registro de pérdidas por caducidad o daños, permitiendo auditar el impacto económico de los desperdicios.
- **Directorio de Proveedores:** Base de datos de aliados estratégicos por categoría (Pescados, Fruber, etc.).

---

## 5. PROCEDIMIENTOS DIARIOS PASO A PASO

### 🟢 5.1. Al Iniciar el Día (Cajero)
1.  Inicie sesión y diríjase a **Control de Caja**.
2.  Presione **ABRIR CAJA**.
3.  Ingrese el efectivo inicial (Monto de Apertura).
4.  Verifique que el estado cambie a **SESIÓN ACTIVA**.

### 🍽️ 5.2. Durante la Venta (Mesero / Cocina)
1.  **Toma:** El mesero asigna productos a la mesa y envía a cocina.
2.  **Producción:** Cocina recibe el pedido. Presiona **MARCHAR** para cambiar a naranja (Preparando).
3.  **Finalización:** Cocina presiona **LISTO**. El pedido pasa a verde y el mesero recibe el aviso.
4.  **Entrega:** Una vez servido, se presiona **ENTREGAR** para liberar espacio en el monitor.

### 🔴 5.3. Al Finalizar el Día (Cajero / Admin)
1.  Asegúrese de que todos los pedidos pendientes estén facturados o cerrados.
2.  Diríjase a **Cerrar Caja**.
3.  Realice el conteo físico del dinero.
4.  Ingrese el valor en **Efectivo Contado**.
5.  El sistema guardará la **Diferencia** automáticamente para auditoría.

---

## 6. CASOS COMUNES Y SOLUCIONES

- **"El producto se agotó en la mitad del turno":** En el monitor KDS o en el Menú de Admin, presione el botón de "Estado" junto al producto para marcarlo como **AGOTADO**. Desaparecerá inmediatamente del menú de pedidos.
- **"Se ingresó mal un gasto en Caja Menor":** Los comprobantes de caja menor son inmutables por seguridad. Se debe realizar un **Depósito de Caja** en el módulo POS para reversar el monto y crear un nuevo comprobante correcto, dejando nota en la auditoría.

---

## 7. BUENAS PRÁCTICAS OPERATIVAS
- **Sincronización:** Refresque el monitor KDS al menos una vez por hora (aunque es automático, asegura la conexión con Supabase).
- **Justificación:** Nunca registre un retiro de caja con el campo "Descripción" vacío. Esto facilita la auditoría mensual.
- **Seguridad:** No comparta contraseñas. Cada acción queda grabada con el nombre del usuario en los logs de auditoría.

---
> **Aviso de Actualización:** Cada vez que el equipo de desarrollo implemente una nueva funcionalidad (Ej. Inventario Avanzado o Reservas), este manual se actualizará en las secciones correspondientes.


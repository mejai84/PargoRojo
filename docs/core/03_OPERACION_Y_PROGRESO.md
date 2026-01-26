# 🛡️ 03. Operación, Seguridad y Roadmap

## 1. Seguridad y Control Antifraude
- **Roles Estrictos**: Admin (Total), Supervisor (Autoriza), Cajero (Vende).
- **Auditoría Obligatoria**: Logs de apertura/cierre, anulaciones y cambios de precio.
- **Validación Backend**: El frontend NO decide el precio ni el stock; las Server Actions validan todo.
- **Alertas Automáticas**: Notificaciones por cierres descuadrados o anulaciones sospechosas.

## 2. Flujos Críticos de Operación
- **Inicio**: Login -> Selección Sucursal -> Apertura de Caja (Saldo Inicial).
- **Venta**: Selección -> Pago -> Registro Movimiento -> Impresión Ticket.
- **Cierre**: Conteo de efectivo -> Comparación con Sistema -> Registro de Desfase -> Cierre Irreversible.

## 3. Roadmap de Desarrollo (Fases)
### Fase 1: Base Sólida (Core)
- Multi-tenancy, Auth, RLS, CRUD Base.
### Fase 2: Operación MVP
- Flujo de Caja completo, Ventas, Stock Realtime.
### Fase 3: Control y Confianza
- Reportes avanzados, Auditoría visible, Exportación PDF/CSV.
### Fase 4: Experiencia (UX)
- Pulido de interfaz para alta velocidad en tablets.
### Fase 5: Escalado SaaS
- Planes de pago, Onboarding automatizado, Infraestructura elástica.

---
*Plan maestro de ejecución y seguridad.*

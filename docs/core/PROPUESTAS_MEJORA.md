# 📋 Propuestas de Mejora y Tareas Pendientes

## 🛡️ Seguridad y Aislamiento (Multi-tenancy)
- [ ] **Auditoría de RLS (Row Level Security)**: Crear script de verificación de políticas en todas las tablas.
- [ ] **JWT Custom Claims**: Inyectar `restaurant_id` en el token de Supabase para filtrado nativo en DB.
- [ ] **Protección de RPCs**: Restringir funciones como `query_sql` solo a roles Administrativos/Service Role.

## ⚡ Funcionamiento y Escalabilidad
- [ ] **Gestión de Media con Supabase Storage**: Migrar imágenes externas a almacenamiento propio organizado por sede.
- [ ] **Caché de Configuración (Redis/ISR)**: Optimizar carga de menús públicos mediante caché de borde para respuesta <100ms.
- [ ] **Offline-First (PWA)**: Implementar Service Workers para que el POS de meseros funcione sin internet estable.

## 🔄 Optimización de Flujos
- [ ] **Onboarding Self-Service**: Flujo automatizado para que nuevos restaurantes creen su cuenta y subdominio solos.
- [ ] **Facturación Electrónica (Colombia)**: Integración con proveedores locales (Siigo/Alegra).
- [ ] **Módulo de Franquicias**: Tablero consolidado para dueños de múltiples sedes.

## 🤖 Inteligencia Artificial (BI)
- [ ] **Smart Stock Prediction**: Algoritmo de predicción de compras basado en históricos de ventas.
- [ ] **Análisis de Rentabilidad por Plato**: Cruce automático de escandallos vs precio de venta real.

---
*Documento vivo de visión técnica - 9 de febrero de 2026*

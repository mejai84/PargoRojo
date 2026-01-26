# 📜 Reglas del Proyecto (SaaS Enterprise)

Este documento define las reglas de conducta y desarrollo para el agente de IA y el equipo. Estas reglas deben seguirse estrictamente para garantizar un producto de calidad de software.

## 1. Consulta de Documentación
- **REGLA DE ORO**: Antes de escribir una sola línea de código, el agente debe consultar `docs/core/BIBLIA_POS_SAAS.md`.
- No se deben tomar decisiones técnicas "ad-hoc" que contradigan la visión SaaS Multi-tenant.

## 2. Desarrollo Paso a Paso
- El desarrollo no se mide por días, sino por la culminación exitosa de los **Sprints** definidos en `docs/core/BIBLIA_POS_SAAS.md`.
- No se puede saltar a funcionalidades cosméticas si el "Core" (Caja, Seguridad, Aislamiento de datos) no está validado al 100%.

## 3. Integridad de Datos (SaaS Rule)
- Cualquier nueva tabla o consulta **DEBE** incluir el filtro por `restaurant_id`.
- El aislamiento de datos (Multi-tenancy) es la prioridad #1.
- No se permiten eliminaciones físicas (`DELETE`) en datos transaccionales (Ventas, Pagos, Movimientos).

## 4. Comunicación y Resumen
- Cada avance debe ser registrado en `CHECKLIST_MODULOS.md`.
- Si se detecta una desviación del plan maestro, se debe informar al usuario inmediatamente antes de proceder.

## 5. Auditoría
- Toda acción crítica (Cierre de caja, anulación, cambio de precio) debe disparar un registro en la tabla de `audits`.

---
*Estas reglas son el pilar de la transformación digital de Pargo Rojo.*

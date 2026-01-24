---
description: Sincronización y actualización del Manual de Usuario Vivo tras cambios en funcionalidades.
---

# Workflow: Actualización del Manual de Usuario

Este flujo de trabajo debe ejecutarse obligatoriamente cada vez que se complete la implementación, modificación o eliminación de una funcionalidad del sistema.

## Pasos del Proceso:

1. **Identificar el Cambio:**
   - ¿Es una funcionalidad NUEVA?
   - ¿Es una MODIFICACIÓN de algo existente?
   - ¿Es una ELIMINACIÓN?

2. **Leer el Manual Actual:**
   - Abrir `d:\Jaime\Antigravity\PargoRojo\MANUAL_USUARIO.md`.

3. **Aplicar la Actualización:**
   - **NUEVA:** Insertar en la sección correspondiente (ej: Módulos) con descripción paso a paso y rol asociado.
   - **MODIFICACIÓN:** Localizar el bloque de texto existente y actualizarlo. Evitar duplicados.
   - **ELIMINACIÓN:** Buscar todas las referencias (títulos, pasos, ejemplos) y retirarlas.

4. **Verificar Coherencia:**
   - Revisar que los enlaces internos (si los hay) y el flujo lógico sigan siendo correctos.
   - Asegurar que el tono siga siendo "Redactor Técnico Senior Enterprise".

5. **Actualizar Metadatos:**
   - Actualizar la fecha de "Última Actualización" en el encabezado del manual.

// turbo
6. **Confirmación:**
   - Informar al usuario que el manual ha sido sincronizado con el estado actual del código.

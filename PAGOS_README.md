# Sistema de Pagos Locales - Colombia

## Pasarelas Implementadas

### 1. Wompi (Principal)
- Tarjetas de crédito y débito
- Nequi
- PSE
- Bancolombia QR

### 2. Integraciones Directas
- Nequi Button
- Daviplata
- PSE

## Configuración

### Variables de Entorno (.env.local)

```env
# Wompi Configuration
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_xxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxx
NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET=xxxxx

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Obtener Credenciales

#### Wompi
1. Regístrate en: https://comercios.wompi.co/
2. Ve a Configuración → API Keys
3. Copia:
   - Public Key (para frontend)
   - Private Key (para backend)
   - Integrity Secret (para validar webhooks)

## Flujo de Pago

```
Cliente → Selecciona método → Wompi Checkout → Paga → Webhook → Confirma Pedido
```

## Métodos de Pago Disponibles

1. **Tarjetas** (Visa, Mastercard, Amex)
2. **Nequi** (QR o Push)
3. **PSE** (Débito desde cuenta bancaria)
4. **Bancolombia** (Botón o QR)
5. **Efectivo** (Efecty, Baloto, etc.)

## Comisiones Aproximadas

- Tarjetas: 2.99% + $900 COP
- Nequi: 1.99% + $900 COP
- PSE: 1.99% + $900 COP
- Efectivo: 3.49% + $900 COP

## Seguridad

- ✅ Tokenización de tarjetas
- ✅ 3D Secure
- ✅ Validación de webhooks con firma
- ✅ Transacciones encriptadas
- ✅ PCI DSS Compliant

## Testing

### Tarjetas de Prueba (Wompi)

**Visa Aprobada:**
- Número: 4242 4242 4242 4242
- CVV: 123
- Fecha: Cualquier fecha futura

**Mastercard Aprobada:**
- Número: 5555 5555 5555 4444
- CVV: 123
- Fecha: Cualquier fecha futura

**Rechazada:**
- Número: 4111 1111 1111 1111

### Nequi Test
- Usar número de prueba: 3001234567
- Código: 1234

### PSE Test
- Banco: Banco de Pruebas
- Usuario: test
- Contraseña: test

## Webhooks

Wompi enviará notificaciones a:
```
POST /api/webhooks/wompi
```

Eventos:
- `transaction.updated` - Transacción actualizada
- `transaction.approved` - Pago aprobado
- `transaction.declined` - Pago rechazado

## Próximos Pasos

1. Registrarse en Wompi
2. Obtener credenciales
3. Configurar variables de entorno
4. Probar con tarjetas de prueba
5. Configurar webhook en producción

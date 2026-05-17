# Nequi Wallet Ops

Wallet app con Next.js, Supabase, Wompi Online Payments y Wompi Payouts para automatizar:

- Depositos por Nequi via `POST /v1/transactions`
- Retiros a Nequi via `POST https://api.payouts.wompi.co/v1/payouts`
- Confirmaciones asincronas via webhook firmado
- Saldos con ledger en Postgres y RLS de solo lectura para el usuario final

## Flujo

1. El usuario se autentica con Supabase Auth.
2. En `/deposit` autoriza terminos de Wompi y solicita el cobro Nequi.
3. Wompi envia el push a Nequi y luego notifica `transaction.updated`.
4. El webhook marca la transaccion y el trigger acredita saldo si termina en `approved`.
5. En `/withdraw` el usuario crea un payout a Nequi.
6. El retiro queda reservado mientras Payouts procesa el lote.
7. El webhook de Payouts actualiza el estado final y el trigger debita saldo al aprobarse.

## Variables

En `.env.local` o en tu plataforma de despliegue:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_INTEGRITY_SECRET=
WOMPI_EVENTS_SECRET=
WOMPI_PAYOUTS_API_KEY=
WOMPI_PAYOUTS_USER_PRINCIPAL_ID=
WOMPI_PAYOUTS_EVENTS_SECRET=
WOMPI_PAYOUTS_SOURCE_ACCOUNT_ID=
```

En Supabase Edge Functions debes registrar tambien:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_INTEGRITY_SECRET=
WOMPI_EVENTS_SECRET=
WOMPI_PAYOUTS_API_KEY=
WOMPI_PAYOUTS_USER_PRINCIPAL_ID=
WOMPI_PAYOUTS_EVENTS_SECRET=
WOMPI_PAYOUTS_SOURCE_ACCOUNT_ID=
```

## Base de datos

Ejecuta estas migraciones:

- `supabase/migrations/001_create_tables.sql`
- `supabase/migrations/002_wallet_wompi.sql`

La segunda agrega:

- `wallets`
- `transactions`
- trigger de wallet por usuario nuevo
- trigger contable para acreditar/debitar saldo
- RLS para que el usuario solo lea su wallet y sus movimientos

## Edge Functions

Se dejaron listas estas functions:

- `create-deposit`
- `create-withdrawal`
- `wompi-webhook`

## Desarrollo

```bash
npm install
npm run dev
```

## Notas operativas

- Los depositos usan Nequi directo y requieren aceptacion explicita de contratos Wompi.
- Los retiros usan Payouts y por documentacion actual necesitan nombre, documento y celular.
- `bankId` de Nequi se envio como `1507`, de acuerdo con la tabla de bancos publicada por Wompi.
- Para evitar doble retiro, el sistema descuenta retiros `pending` o `processing` del saldo disponible antes de crear uno nuevo.

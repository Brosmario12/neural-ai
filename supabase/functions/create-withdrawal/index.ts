import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createSupabaseAdmin,
  getAuthenticatedUser,
  getOrCreateWallet,
  isDemoMode,
  normalizePayoutStatus,
  wompiPayoutsFetch,
} from '../_shared/wompi.ts'

type PayoutAccount = {
  id: string
  status?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createSupabaseAdmin()
    const user = await getAuthenticatedUser(supabase, req.headers.get('Authorization'))
    const body = await req.json()

    const amountCents = Number(body.amount_cents)
    const nequiPhone = String(body.nequi_phone ?? '').replace(/[^\d]/g, '').slice(-10)
    const ownerName = String(body.owner_name ?? '').trim()
    const legalIdType = String(body.legal_id_type ?? 'CC').trim()
    const legalId = String(body.legal_id ?? '').trim()

    if (!Number.isInteger(amountCents) || amountCents < 10000) {
      throw new Error('El monto minimo es 100 COP.')
    }

    if (nequiPhone.length !== 10) {
      throw new Error('El celular Nequi debe tener 10 digitos.')
    }

    if (!ownerName || !legalId) {
      throw new Error('Nombre y documento son obligatorios para payouts.')
    }

    const wallet = await getOrCreateWallet(supabase, user.id)

    const { data: pendingWithdrawals } = await supabase
      .from('transactions')
      .select('amount_cents')
      .eq('wallet_id', wallet.id)
      .eq('type', 'withdrawal')
      .in('status', ['pending', 'processing'])

    const reserved = (pendingWithdrawals ?? []).reduce(
      (sum, tx) => sum + Number(tx.amount_cents ?? 0),
      0,
    )
    const available = Number(wallet.balance_cents) - reserved

    if (available < amountCents) {
      throw new Error('Saldo insuficiente disponible para retiro.')
    }

    await supabase
      .from('wallets')
      .update({
        nequi_phone: nequiPhone,
        owner_name: ownerName,
        legal_id_type: legalIdType,
        legal_id: legalId,
      })
      .eq('id', wallet.id)

    const accountsResponse = await wompiPayoutsFetch('/accounts')
    const accountsPayload = await accountsResponse.json()
    const configuredSourceAccountId = Deno.env.get('WOMPI_PAYOUTS_SOURCE_ACCOUNT_ID')
    const accounts = (accountsPayload.data ?? []) as PayoutAccount[]
    const sourceAccount =
      accounts.find((account) => account.id === configuredSourceAccountId) ??
      accounts.find((account) => account.status === 'ACTIVE')

    if (!sourceAccount?.id) {
      throw new Error('No hay cuenta de origen activa en Wompi Payouts.')
    }

    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'withdrawal',
        status: 'processing',
        amount_cents: amountCents,
        reference: crypto.randomUUID(),
        metadata: {
          requested_for_phone: nequiPhone,
        },
      })
      .select('*')
      .single()

    if (txError || !tx) {
      throw new Error('No se pudo crear la transaccion local.')
    }

    if (isDemoMode()) {
      await supabase
        .from('transactions')
        .update({
          payout_id: `demo_payout_${tx.id}`,
          wompi_id: `demo_transfer_${tx.id}`,
          status: 'approved',
          metadata: {
            mode: 'demo',
            provider: 'WOMPI_PAYOUTS_SIMULATED',
            approved_at: new Date().toISOString(),
            destination_phone: nequiPhone,
          },
        })
        .eq('id', tx.id)

      return new Response(
        JSON.stringify({
          success: true,
          tx_id: tx.id,
          payout_id: `demo_payout_${tx.id}`,
          message: 'Retiro simulado aprobado. El saldo se desconto automaticamente en modo demo.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const payoutResponse = await wompiPayoutsFetch('/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'idempotency-key': tx.id,
      },
      body: JSON.stringify({
        reference: `wallet-${tx.id}`,
        accountId: sourceAccount.id,
        paymentType: 'OTHER',
        transactions: [
          {
            legalIdType: legalIdType,
            legalId,
            bankId: '1507',
            accountType: 'AHORROS',
            accountNumber: nequiPhone,
            name: ownerName,
            email: user.email,
            amount: amountCents,
            reference: tx.id,
          },
        ],
      }),
    })

    const payoutPayload = await payoutResponse.json()

    if (!payoutResponse.ok) {
      await supabase
        .from('transactions')
        .update({
          status: 'error',
          metadata: {
            payouts_error: payoutPayload,
          },
        })
        .eq('id', tx.id)

      throw new Error(payoutPayload.message ?? 'Wompi Payouts rechazo el retiro.')
    }

    const payoutId = payoutPayload.data?.id ?? payoutPayload.id ?? null
    const payoutStatus = payoutPayload.data?.status ?? payoutPayload.status

    await supabase
      .from('transactions')
      .update({
        payout_id: payoutId,
        status: normalizePayoutStatus(payoutStatus),
        metadata: payoutPayload,
      })
      .eq('id', tx.id)

    return new Response(
      JSON.stringify({
        success: true,
        tx_id: tx.id,
        payout_id: payoutId,
        message: 'Retiro enviado a Wompi Payouts. Esperando confirmacion del webhook.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unexpected error.',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

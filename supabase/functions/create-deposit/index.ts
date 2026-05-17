import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createSupabaseAdmin,
  generateIntegritySignature,
  getAuthenticatedUser,
  getOrCreateWallet,
  isDemoMode,
  normalizeMoneyStatus,
  wompiMoneyFetch,
} from '../_shared/wompi.ts'

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
    const acceptanceToken = String(body.acceptance_token ?? '')
    const acceptPersonalAuth = String(body.accept_personal_auth ?? '')
    const acceptedTerms = body.accepted_terms === true
    const acceptedPersonalData = body.accepted_personal_data === true

    if (!Number.isInteger(amountCents) || amountCents < 10000) {
      throw new Error('El monto minimo es 100 COP.')
    }

    if (nequiPhone.length !== 10) {
      throw new Error('El celular Nequi debe tener 10 digitos.')
    }

    if (!acceptedTerms || !acceptedPersonalData) {
      throw new Error('Debes aceptar los terminos y el tratamiento de datos.')
    }

    if (!acceptanceToken || !acceptPersonalAuth) {
      throw new Error('Faltan tokens de aceptacion de Wompi.')
    }

    const wallet = await getOrCreateWallet(supabase, user.id)

    await supabase.from('wallets').update({ nequi_phone: nequiPhone }).eq('id', wallet.id)

    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'deposit',
        status: 'pending',
        amount_cents: amountCents,
        metadata: {
          channel: 'NEQUI',
          accepted_terms_at: new Date().toISOString(),
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
          wompi_id: `demo_tx_${tx.id}`,
          reference: tx.id,
          status: 'approved',
          metadata: {
            mode: 'demo',
            provider: 'WOMPI_SIMULATED',
            approved_at: new Date().toISOString(),
          },
        })
        .eq('id', tx.id)

      return new Response(
        JSON.stringify({
          tx_id: tx.id,
          wompi_id: `demo_tx_${tx.id}`,
          status: 'APPROVED',
          message: 'Deposito simulado aprobado. El saldo se acredito automaticamente en modo demo.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const signature = generateIntegritySignature(tx.id, amountCents, 'COP')

    const wompiResponse = await wompiMoneyFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        acceptance_token: acceptanceToken,
        accept_personal_auth: acceptPersonalAuth,
        amount_in_cents: amountCents,
        currency: 'COP',
        customer_email: user.email,
        reference: tx.id,
        signature,
        payment_method: {
          type: 'NEQUI',
          phone_number: nequiPhone,
        },
      }),
    })

    const wompiPayload = await wompiResponse.json()

    if (!wompiResponse.ok || !wompiPayload.data?.id) {
      await supabase
        .from('transactions')
        .update({
          status: 'error',
          metadata: {
            wompi_error: wompiPayload,
          },
        })
        .eq('id', tx.id)

      throw new Error(wompiPayload.error?.reason ?? 'Wompi rechazo la solicitud de deposito.')
    }

    await supabase
      .from('transactions')
      .update({
        wompi_id: wompiPayload.data.id,
        reference: tx.id,
        status: normalizeMoneyStatus(wompiPayload.data.status),
        metadata: wompiPayload.data,
      })
      .eq('id', tx.id)

    return new Response(
      JSON.stringify({
        tx_id: tx.id,
        wompi_id: wompiPayload.data.id,
        status: wompiPayload.data.status,
        message: 'Solicitud creada. Abre Nequi y autoriza el cobro para completar el deposito.',
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

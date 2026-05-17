import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createSupabaseAdmin,
  normalizeMoneyStatus,
  normalizePayoutStatus,
  verifyEventSignature,
  wompiPayoutsFetch,
} from '../_shared/wompi.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const checksumHeader = req.headers.get('X-Event-Checksum')
    const supabase = createSupabaseAdmin()
    const eventName = String(payload.event ?? '')

    if (eventName === 'transaction.updated' && payload.data?.transaction?.reference) {
      const valid = verifyEventSignature(
        payload,
        Deno.env.get('WOMPI_EVENTS_SECRET'),
        checksumHeader,
      )

      if (!valid) {
        return new Response('invalid signature', {
          status: 401,
          headers: corsHeaders,
        })
      }

      const wompiTx = payload.data.transaction

      await supabase
        .from('transactions')
        .update({
          status: normalizeMoneyStatus(wompiTx.status),
          wompi_id: wompiTx.id,
          reference: wompiTx.reference,
          metadata: wompiTx,
        })
        .eq('id', wompiTx.reference)

      return new Response('ok', { headers: corsHeaders })
    }

    if (eventName === 'payout.updated' || eventName === 'transaction.updated') {
      const valid = verifyEventSignature(
        payload,
        Deno.env.get('WOMPI_PAYOUTS_EVENTS_SECRET'),
        checksumHeader,
      )

      if (!valid) {
        return new Response('invalid signature', {
          status: 401,
          headers: corsHeaders,
        })
      }

      if (eventName === 'payout.updated') {
        const payout = payload.data?.payout
        if (payout?.reference?.startsWith?.('wallet-')) {
          const localId = payout.reference.replace('wallet-', '')

          await supabase
            .from('transactions')
            .update({
              payout_id: payout.id,
              status: normalizePayoutStatus(payout.status),
              metadata: payout,
            })
            .eq('id', localId)
        }
      }

      if (eventName === 'transaction.updated') {
        const payoutTx = payload.data?.transaction
        const payoutId = payoutTx?.payoutId
        const transactionId = payoutTx?.id

        if (payoutId && transactionId) {
          const detailsResponse = await wompiPayoutsFetch(
            `/payouts/${payoutId}/transactions/${transactionId}`,
          )
          const detailsPayload = await detailsResponse.json()
          const details = detailsPayload.data ?? payoutTx
          const reference = details.reference

          if (reference) {
            await supabase
              .from('transactions')
              .update({
                payout_id: payoutId,
                wompi_id: transactionId,
                status: normalizePayoutStatus(details.status ?? payoutTx.status),
                metadata: details,
              })
              .eq('id', reference)
          }
        }
      }

      return new Response('ok', { headers: corsHeaders })
    }

    return new Response('ignored', { headers: corsHeaders })
  } catch {
    return new Response('error', {
      status: 400,
      headers: corsHeaders,
    })
  }
})

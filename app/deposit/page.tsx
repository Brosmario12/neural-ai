'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { normalizeCopInput, normalizePhone } from '@/lib/wallet'

interface MerchantTerms {
  acceptanceToken: string
  acceptancePermalink: string
  personalDataToken: string
  personalDataPermalink: string
}

export default function DepositPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedData, setAcceptedData] = useState(false)
  const [merchantTerms, setMerchantTerms] = useState<MerchantTerms | null>(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const amountCents = useMemo(() => normalizeCopInput(amount), [amount])

  useEffect(() => {
    const boot = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth')
        return
      }

      const [walletRes, termsRes] = await Promise.all([
        supabase.from('wallets').select('nequi_phone').single(),
        fetch('/api/wompi/merchant', { cache: 'no-store' }),
      ])

      if (walletRes.data?.nequi_phone) {
        setPhone(walletRes.data.nequi_phone)
      }

      if (termsRes.ok) {
        const payload = (await termsRes.json()) as MerchantTerms
        setMerchantTerms(payload)
      }
    }

    void boot()
  }, [router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!merchantTerms) {
      setError('No se pudieron cargar los terminos de Wompi.')
      return
    }

    setLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth')
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-deposit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount_cents: amountCents,
            nequi_phone: normalizePhone(phone),
            acceptance_token: merchantTerms.acceptanceToken,
            accept_personal_auth: merchantTerms.personalDataToken,
            accepted_terms: acceptedTerms,
            accepted_personal_data: acceptedData,
          }),
        },
      )

      const payload = (await response.json()) as { error?: string; message?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? 'No se pudo crear el deposito.')
      }

      setNotice(
        payload.message ??
          'Solicitud enviada. Revisa tu app de Nequi y aprueba el cobro para completar el deposito.',
      )
      setAmount('')
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'No se pudo crear el deposito.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </button>

        <section className="rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Deposito</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Recargar con Nequi</h1>
          <p className="mt-3 text-sm text-slate-400">
            Creamos la transaccion en Wompi y Nequi te enviara el push para autorizar el cobro.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6"
        >
          <div>
            <label className="mb-2 block text-sm text-slate-300">Monto en COP</label>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="numeric"
              placeholder="50000"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              required
            />
            <p className="mt-2 text-xs text-slate-500">
              Wompi trabaja en centavos; enviaremos {amountCents} centavos si confirmas.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Celular Nequi</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="numeric"
              placeholder="3001234567"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              required
            />
          </div>

          <label className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 h-4 w-4"
              required
            />
            <span className="text-sm text-slate-300">
              Acepto los{' '}
              <a
                href={merchantTerms?.acceptancePermalink ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 underline"
              >
                terminos de Wompi
              </a>
              .
            </span>
          </label>

          <label className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <input
              type="checkbox"
              checked={acceptedData}
              onChange={(event) => setAcceptedData(event.target.checked)}
              className="mt-1 h-4 w-4"
              required
            />
            <span className="text-sm text-slate-300">
              Autorizo el{' '}
              <a
                href={merchantTerms?.personalDataPermalink ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 underline"
              >
                tratamiento de datos personales
              </a>
              .
            </span>
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-700 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="rounded-2xl border border-emerald-700 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
              {notice}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Solicitar cobro Nequi
          </button>
        </form>
      </div>
    </main>
  )
}

'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { normalizeCopInput, normalizePhone } from '@/lib/wallet'

export default function WithdrawPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [legalIdType, setLegalIdType] = useState('CC')
  const [legalId, setLegalId] = useState('')
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

      const { data: wallet } = await supabase
        .from('wallets')
        .select('nequi_phone, owner_name, legal_id_type, legal_id')
        .single()

      if (!wallet) {
        return
      }

      setPhone(wallet.nequi_phone ?? '')
      setOwnerName(wallet.owner_name ?? '')
      setLegalIdType(wallet.legal_id_type ?? 'CC')
      setLegalId(wallet.legal_id ?? '')
    }

    void boot()
  }, [router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth')
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-withdrawal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount_cents: amountCents,
            nequi_phone: normalizePhone(phone),
            owner_name: ownerName.trim(),
            legal_id_type: legalIdType,
            legal_id: legalId.trim(),
          }),
        },
      )

      const payload = (await response.json()) as { error?: string; message?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? 'No se pudo crear el retiro.')
      }

      setNotice(
        payload.message ??
          'Retiro enviado a Wompi Payouts. Quedara en proceso hasta que el webhook confirme el resultado.',
      )
      setAmount('')
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'No se pudo crear el retiro.',
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

        <section className="rounded-3xl border border-emerald-500/20 bg-slate-900/80 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Retiro</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Enviar a Nequi</h1>
          <p className="mt-3 text-sm text-slate-400">
            Usamos Wompi Payouts. Los retiros pendientes se reservan para evitar doble gasto.
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
              placeholder="20000"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              required
            />
            <p className="mt-2 text-xs text-slate-500">
              Enviaremos {amountCents} centavos al payout si el saldo disponible alcanza.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Celular Nequi</label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="numeric"
                placeholder="3001234567"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Tipo de documento</label>
              <select
                value={legalIdType}
                onChange={(event) => setLegalIdType(event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="NIT">NIT</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Titular</label>
              <input
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                placeholder="Nombre completo"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Numero de documento</label>
              <input
                value={legalId}
                onChange={(event) => setLegalId(event.target.value)}
                inputMode="numeric"
                placeholder="1234567890"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                required
              />
            </div>
          </div>

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
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear retiro
          </button>
        </form>
      </div>
    </main>
  )
}

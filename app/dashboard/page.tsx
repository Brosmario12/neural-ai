'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  LogOut,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  formatCop,
  getAvailableBalance,
  getStatusTone,
  mapTxTypeLabel,
  type WalletRecord,
  type WalletTransaction,
} from '@/lib/wallet'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [wallet, setWallet] = useState<WalletRecord | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])

  const pendingWithdrawals = useMemo(
    () =>
      transactions
        .filter(
          (tx) =>
            tx.type === 'withdrawal' &&
            (tx.status === 'pending' || tx.status === 'processing'),
        )
        .reduce((sum, tx) => sum + tx.amount_cents, 0),
    [transactions],
  )

  const availableBalance = wallet
    ? getAvailableBalance(wallet.balance_cents, pendingWithdrawals)
    : 0

  const loadData = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/auth')
      return
    }

    setEmail(session.user.email ?? '')

    const [{ data: walletData }, { data: txData }] = await Promise.all([
      supabase.from('wallets').select('*').single(),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
    ])

    setWallet(walletData ?? null)
    setTransactions((txData as WalletTransaction[] | null) ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => {
    void loadData()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/auth')
      }
    })

    const txChannel = supabase
      .channel('wallet-transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => void loadData(),
      )
      .subscribe()

    const walletChannel = supabase
      .channel('wallet-record')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets' },
        () => void loadData(),
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      void supabase.removeChannel(txChannel)
      void supabase.removeChannel(walletChannel)
    }
  }, [loadData, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Cargando wallet...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Wallet Ops</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">{email}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void loadData()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
            <button
              onClick={() => router.push('/deposit')}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Depositar
            </button>
            <button
              onClick={() => router.push('/withdraw')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <ArrowUpRight className="h-4 w-4" />
              Retirar
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:border-rose-400 hover:text-rose-200"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-cyan-500/20 bg-slate-900/75 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-500/15 p-3">
                <Wallet className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Saldo liquidado</p>
                <p className="text-2xl font-semibold text-white">
                  {formatCop(wallet?.balance_cents ?? 0)}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-amber-500/20 bg-slate-900/75 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/15 p-3">
                <Clock3 className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Retiros reservados</p>
                <p className="text-2xl font-semibold text-white">
                  {formatCop(pendingWithdrawals)}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-emerald-500/20 bg-slate-900/75 p-6">
            <p className="text-sm text-slate-400">Disponible para retirar</p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatCop(availableBalance)}</p>
            <p className="mt-3 text-xs text-slate-500">
              Descuenta retiros pendientes o en proceso para evitar sobregiros.
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Movimientos</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Tus depositos y retiros se reflejan aqui cuando Wompi confirme el estado.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {transactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
                  Aun no hay movimientos en esta wallet.
                </div>
              ) : (
                transactions.map((tx) => {
                  const tone = getStatusTone(tx.status)

                  return (
                    <div
                      key={tx.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium text-white">{mapTxTypeLabel(tx.type)}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                        {tx.reference ? (
                          <p className="mt-1 text-xs text-slate-500">Ref: {tx.reference}</p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="text-lg font-semibold text-white">
                          {formatCop(tx.amount_cents)}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">Perfil de pago</h2>
            <div className="mt-5 space-y-4 text-sm">
              <div className="rounded-2xl bg-slate-950/70 p-4">
                <p className="text-slate-400">Celular Nequi</p>
                <p className="mt-1 text-white">{wallet?.nequi_phone || 'Sin registrar'}</p>
              </div>
              <div className="rounded-2xl bg-slate-950/70 p-4">
                <p className="text-slate-400">Titular</p>
                <p className="mt-1 text-white">{wallet?.owner_name || 'Sin registrar'}</p>
              </div>
              <div className="rounded-2xl bg-slate-950/70 p-4">
                <p className="text-slate-400">Documento</p>
                <p className="mt-1 text-white">
                  {wallet?.legal_id_type && wallet?.legal_id
                    ? `${wallet.legal_id_type} ${wallet.legal_id}`
                    : 'Sin registrar'}
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}

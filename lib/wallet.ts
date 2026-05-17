export type WalletTransactionStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'declined'
  | 'error'
  | 'cancelled'

export interface WalletRecord {
  id: string
  user_id: string
  balance_cents: number
  nequi_phone: string | null
  owner_name: string | null
  legal_id_type: string | null
  legal_id: string | null
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  type: 'deposit' | 'withdrawal' | 'payment'
  status: WalletTransactionStatus
  amount_cents: number
  reference: string | null
  wompi_id: string | null
  payout_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export function formatCop(cents: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function normalizeCopInput(value: string) {
  const digits = value.replace(/[^\d]/g, '')
  return digits ? Number(digits) * 100 : 0
}

export function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, '').slice(-10)
}

export function mapTxTypeLabel(type: WalletTransaction['type']) {
  if (type === 'deposit') return 'Deposito'
  if (type === 'withdrawal') return 'Retiro'
  return 'Pago'
}

export function getAvailableBalance(balanceCents: number, pendingWithdrawalCents: number) {
  return Math.max(balanceCents - pendingWithdrawalCents, 0)
}

export function getStatusTone(status: WalletTransactionStatus) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/20'
    case 'processing':
      return 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/20'
    case 'declined':
    case 'cancelled':
    case 'error':
      return 'bg-rose-500/15 text-rose-200 border border-rose-500/20'
    default:
      return 'bg-amber-500/15 text-amber-200 border border-amber-500/20'
  }
}

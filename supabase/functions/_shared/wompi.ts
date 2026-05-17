import { createHash } from 'https://deno.land/std@0.224.0/crypto/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function createSupabaseAdmin() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server credentials.')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export function getBearerToken(authorization: string | null) {
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Missing bearer token.')
  }

  return authorization.replace('Bearer ', '').trim()
}

export function sha256Hex(value: string) {
  return createHash('sha256').update(value).toString()
}

export function generateIntegritySignature(reference: string, amountInCents: number, currency: string) {
  const integritySecret = Deno.env.get('WOMPI_INTEGRITY_SECRET')

  if (!integritySecret) {
    throw new Error('Missing WOMPI_INTEGRITY_SECRET.')
  }

  return sha256Hex(`${reference}${amountInCents}${currency}${integritySecret}`)
}

export function normalizeMoneyStatus(status: string | undefined) {
  switch (status) {
    case 'APPROVED':
      return 'approved'
    case 'DECLINED':
      return 'declined'
    case 'VOIDED':
      return 'cancelled'
    case 'ERROR':
      return 'error'
    case 'PENDING':
      return 'pending'
    default:
      return 'processing'
  }
}

export function normalizePayoutStatus(status: string | undefined) {
  switch (status) {
    case 'APPROVED':
      return 'approved'
    case 'FAILED':
    case 'REJECTED':
      return 'error'
    case 'CANCELLED':
    case 'NOT_APPROVED':
      return 'cancelled'
    case 'PENDING':
    case 'PROCESSING':
      return 'processing'
    default:
      return 'pending'
  }
}

export function readNestedValue(source: Record<string, unknown>, path: string) {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key]
    }

    return ''
  }, source)
}

export function verifyEventSignature(
  payload: Record<string, unknown>,
  secret: string | undefined,
  checksumHeader: string | null,
) {
  if (!secret) {
    return false
  }

  const signature = payload.signature as Record<string, unknown> | undefined
  const properties = Array.isArray(signature?.properties)
    ? (signature?.properties as string[])
    : []
  const timestamp = String(payload.timestamp ?? '')
  const base = properties.map((property) => String(readNestedValue(payload.data as Record<string, unknown>, property))).join('')
  const checksum = sha256Hex(`${base}${timestamp}${secret}`)
  const expected = checksumHeader ?? String(signature?.checksum ?? '')

  return checksum === expected
}

export async function getAuthenticatedUser(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  authorization: string | null,
) {
  const jwt = getBearerToken(authorization)
  const { data, error } = await supabase.auth.getUser(jwt)

  if (error || !data.user) {
    throw new Error('Unauthorized.')
  }

  return data.user
}

export async function getOrCreateWallet(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
) {
  const { data: existing } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    return existing
  }

  const { data: created, error } = await supabase
    .from('wallets')
    .insert({ user_id: userId })
    .select('*')
    .single()

  if (error || !created) {
    throw new Error('Unable to create wallet.')
  }

  return created
}

export async function wompiMoneyFetch(path: string, init: RequestInit = {}) {
  const privateKey = Deno.env.get('WOMPI_PRIVATE_KEY')

  if (!privateKey) {
    throw new Error('Missing WOMPI_PRIVATE_KEY.')
  }

  return fetch(`https://production.wompi.co/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${privateKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
}

export async function wompiPayoutsFetch(path: string, init: RequestInit = {}) {
  const apiKey = Deno.env.get('WOMPI_PAYOUTS_API_KEY')
  const userPrincipalId = Deno.env.get('WOMPI_PAYOUTS_USER_PRINCIPAL_ID')

  if (!apiKey || !userPrincipalId) {
    throw new Error('Missing Wompi payouts credentials.')
  }

  return fetch(`https://api.payouts.wompi.co/v1${path}`, {
    ...init,
    headers: {
      'x-api-key': apiKey,
      'user-principal-id': userPrincipalId,
      ...(init.headers ?? {}),
    },
  })
}

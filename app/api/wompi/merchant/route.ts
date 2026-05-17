import { NextResponse } from 'next/server'

export async function GET() {
  const publicKey = process.env.WOMPI_PUBLIC_KEY

  if (!publicKey) {
    return NextResponse.json(
      { error: 'Missing WOMPI_PUBLIC_KEY in the application environment.' },
      { status: 500 },
    )
  }

  const response = await fetch(`https://production.wompi.co/v1/merchants/${publicKey}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Unable to load Wompi merchant data.' },
      { status: response.status },
    )
  }

  const payload = await response.json()
  const merchant = payload.data

  return NextResponse.json({
    acceptanceToken: merchant.presigned_acceptance.acceptance_token,
    acceptancePermalink: merchant.presigned_acceptance.permalink,
    personalDataToken: merchant.presigned_personal_data_auth.acceptance_token,
    personalDataPermalink: merchant.presigned_personal_data_auth.permalink,
  })
}

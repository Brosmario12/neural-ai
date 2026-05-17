import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nequi Wallet Ops',
  description: 'Wallet, deposits with Wompi/Nequi and automated payouts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950">
        {children}
      </body>
    </html>
  )
}

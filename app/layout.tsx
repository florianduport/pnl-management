import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PnL Management',
  description: 'PnL Management by Programisto',
  generator: 'Programisto',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

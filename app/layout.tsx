import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Skiptide',
  description: 'A quiet, personal newspaper for the writers you choose.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

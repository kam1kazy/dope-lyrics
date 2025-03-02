// COMPONENTS
import LocalProvider from '@/components/LocalProvider'

// STYLES
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
import type { Metadata } from 'next'
import '../../styles/style.css'

// META
export const metadata: Metadata = {
  title: 'DOPE LYRICS',
  description: 'App to Telegram lyrics bot',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='ru'>
      <body className={inter.className}>
        <LocalProvider>{children}</LocalProvider>
      </body>
    </html>
  )
}

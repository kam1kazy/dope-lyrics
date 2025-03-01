import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../../styles/style.css'
import LocalProviderWrapper from '@/components/LocalProviderWrapper'
const inter = Inter({ subsets: ['latin'] })

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
        <LocalProviderWrapper>{children}</LocalProviderWrapper>
      </body>
    </html>
  )
}

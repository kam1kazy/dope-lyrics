import '@/shared/styles/globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  title: 'DOPE LYRICS',
  description: 'App to Telegram lyrics bot',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}

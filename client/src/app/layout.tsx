import '@/shared/styles/globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import type { ReactNode } from 'react';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
});

export const dynamic = 'force-dynamic';

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
      <body className={`${inter.variable} antialiased`}>
        {process.env.NODE_ENV === 'production' ? (
          <Script
            src="https://telegram.org/js/telegram-web-app.js"
            strategy="afterInteractive"
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}

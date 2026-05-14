import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Roboto_Flex } from 'next/font/google';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Roboto_Flex({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz', 'wdth', 'GRAD', 'XTRA', 'YOPQ'],
});

export const metadata: Metadata = {
  title: 'Memories | Generation CH65',
  description: 'A cinematic professional memories feed for Generation CH65.',
  icons: {
    icon: '/assets/favicon.svg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geist.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}

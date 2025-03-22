import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import ClientWrapper from '@/components/layout/ClientWrapper';
import NextIntlProvider from '@/components/NextIntlProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Baby Name App',
  description: 'Find the perfect baby name with meaning and Chinese metaphysics analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlProvider>
          <Navigation />
          <main className="container mx-auto py-8 px-4">
            <ClientWrapper>
              {children}
            </ClientWrapper>
          </main>
        </NextIntlProvider>
      </body>
    </html>
  );
}
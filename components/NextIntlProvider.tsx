'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function NextIntlProvider({ children }: Props) {
  const [messages, setMessages] = useState<Record<string, unknown>>({});
  const [locale, setLocale] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user's preferred language or use default
    const savedLocale = localStorage.getItem('locale') || navigator.language.split('-')[0];
    // Make sure it's one of our supported locales
    const supportedLocale = ['en', 'zh', 'es'].includes(savedLocale) ? savedLocale : 'en';
    
    setLocale(supportedLocale);
    
    // Load messages for the locale
    import(`../messages/${supportedLocale}.json`)
      .then((module) => {
        setMessages(module.default);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load messages:', error);
        // Fallback to English
        import('../messages/en.json').then((module) => {
          setMessages(module.default);
          setIsLoading(false);
        });
      });
  }, []);

  // Show a minimal loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
} 
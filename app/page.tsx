'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations('HomePage');

  useEffect(() => {
    // Redirect directly to search page without locale prefix
    router.push('/search');
  }, [router]);

  // Return a simple loading state while redirecting
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <p className="text-gray-600 mb-8">{t('subtitle')}</p>
      <div className="animate-pulse">{t('redirecting')}</div>
    </div>
  );
} 
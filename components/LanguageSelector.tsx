'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

export default function LanguageSelector() {
  const t = useTranslations('LanguageSelector');
  const [selectedLocale, setSelectedLocale] = useState<string>('en');

  useEffect(() => {
    // Get the current locale from localStorage or fallback to browser language
    const currentLocale = localStorage.getItem('locale') || navigator.language.split('-')[0];
    // Make sure it's one of our supported locales
    const supportedLocale = ['en', 'zh', 'es'].includes(currentLocale) ? currentLocale : 'en';
    setSelectedLocale(supportedLocale);
  }, []);

  const handleLanguageChange = (locale: string) => {
    localStorage.setItem('locale', locale);
    setSelectedLocale(locale);
    // Force reload to apply the new language
    window.location.reload();
  };

  return (
    <div className="relative inline-block text-left">
      <select
        value={selectedLocale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="block appearance-none bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-label={t('language')}
      >
        <option value="en">{t('english')}</option>
        <option value="zh">{t('chinese')}</option>
        <option value="es">{t('spanish')}</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
          <title>Dropdown Arrow</title>
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
} 
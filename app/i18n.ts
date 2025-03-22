import {createTranslator} from 'next-intl';

export async function getTranslations(locale: string, namespace = '*') {
  return (await import(`../messages/${locale}.json`)).default;
} 
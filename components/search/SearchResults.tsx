import { useTranslations } from 'next-intl';
import type { NameMatchAnalysis } from '@/types/name-analysis';
import NameCard from '@/components/name-details/NameCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Heart } from 'lucide-react';

interface SearchResultsProps {
  matchingNames: NameMatchAnalysis[];
  isLoading: boolean;
  searchMessage: string | null;
  error: string;
  favorites?: string[];
  onToggleFavorite?: (name: string) => void;
  onViewDetails?: (name: string) => void;
}

export default function SearchResults({
  matchingNames,
  isLoading,
  searchMessage,
  error,
  favorites = [],
  onToggleFavorite = () => {},
  onViewDetails = () => {}
}: SearchResultsProps) {
  const t = useTranslations('SearchPage');
  const commonT = useTranslations('Common');

  // 添加更详细的调试日志
  console.log('SearchResults component received:', {
    matchingNamesCount: matchingNames?.length || 0,
    isLoading,
    hasError: !!error,
    matchingNamesIsArray: Array.isArray(matchingNames)
  });

  // 确保 matchingNames 是一个数组，并且过滤掉所有 null 或 undefined 值
  const validNames = Array.isArray(matchingNames)
    ? matchingNames.filter(name => name !== null && name !== undefined)
    : [];

  console.log('Valid names count:', validNames.length);

  if (validNames.length > 0) {
    console.log('First matching name:', JSON.stringify(validNames[0], null, 2));
    console.log('First result available fields:', Object.keys(validNames[0]));
    console.log('First result analysis fields:', Object.keys(validNames[0]).filter(key => {
      const k = key as keyof NameMatchAnalysis;
      return validNames[0][k] &&
        typeof validNames[0][k] === 'object' &&
        'matches' in (validNames[0][k] as object);
    }));
  }

  // 在render部分添加日志
  console.log('🔄 SearchResults rendering with favorites:', favorites);
  console.log('🔄 SearchResults has onToggleFavorite?', !!onToggleFavorite);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">{t('searchResults')}</h2>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>{t('searchingMessage')}</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && validNames.length === 0 && (
        <p className="text-center p-8 border rounded-lg bg-muted">
          {t('noResults')}
        </p>
      )}

      {!isLoading && validNames.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {validNames.map((name, index) => {
            console.log(`Rendering name at index ${index}:`, name ? name.name : 'undefined');
            const isFavorited = favorites.includes(name.name);
            console.log(`🔄 NameCard ${name.name} isFavorite:`, isFavorited);

            console.log('🔍 Rendering NameCard for', name.name);
            console.log('🔍 isFavorited value:', isFavorited);
            console.log('🔍 favorites array:', favorites);
            console.log('🔍 onToggleFavorite defined?', !!onToggleFavorite);

            return name && typeof name === 'object' ? (
              <div key={`name-${name.name}-${index}`} className="relative">
                {isFavorited && (
                  <div className="absolute top-2 right-2 z-10">
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                  </div>
                )}
                <NameCard
                  nameData={name}
                  isFavorite={isFavorited}
                  onToggleFavorite={(name) => {
                    console.log('🔍 onToggleFavorite called from SearchResults for:', name);
                    onToggleFavorite(name);
                  }}
                  onViewDetails={onViewDetails}
                />
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
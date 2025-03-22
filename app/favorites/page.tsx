'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Heart, ArrowLeft, Trash2 } from 'lucide-react';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import NameCard from '@/components/name-details/NameCard';
import { NameMatchAnalysis } from '@/types/name-analysis';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FavoriteNameItem } from '@/types';

export default function FavoritesPage() {
  const router = useRouter();
  const t = useTranslations('FavoritesPage');
  const commonT = useTranslations('Common');
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteDetails, setFavoriteDetails] = useState<NameMatchAnalysis[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<FavoriteNameItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 获取收藏的详细信息
    const savedItems = getFromLocalStorage<FavoriteNameItem[]>('favoriteNameDetails', []);
    setFavoriteItems(savedItems);

    // 从简单列表中获取名称（保持向后兼容）
    const savedNames = getFromLocalStorage<string[]>('favoriteNames', []);
    setFavorites(savedNames);

    const fetchNameDetails = async () => {
      if (savedNames.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        // 将 favoriteItems 传递给 API
        const response = await fetch('/api/name-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            names: savedNames,
            items: savedItems,
          }),
        });

        if (!response.ok) {
          throw new Error(t('failedToFetchFavorites'));
        }

        const data = await response.json();
        setFavoriteDetails(data.details || []);
      } catch (err) {
        console.error('Error fetching favorite details:', err);
        setError(t('errorFetchingFavorites'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNameDetails();
  }, [t]);

  const removeFavorite = (id: string, name?: string) => {
    if (!name && !id) return;

    try {
      let updatedFavorites = [...favorites];

      // 如果提供了名称，则从名称列表中删除
      if (name) {
        updatedFavorites = updatedFavorites.filter(
          (favName) => favName !== name
        );
        setFavorites(updatedFavorites);
        saveToLocalStorage('favoriteNames', updatedFavorites);
      }

      // 始终从详细项目中删除（使用ID）
      const updatedItems = favoriteItems.filter((item) => 
        // 如果提供了ID，则使用ID过滤
        (id && item.id !== id) || 
        // 如果只提供了名称，则使用名称过滤
        (name && !id && item.name !== name)
      );
      setFavoriteItems(updatedItems);
      saveToLocalStorage('favoriteNameDetails', updatedItems);

      // 从详细结果中删除
      const updatedDetails = favoriteDetails.filter(
        (detail) => (name ? detail.name !== name : true)
      );
      setFavoriteDetails(updatedDetails);

      // 可选：显示确认通知
      // alert(`${name || id} has been removed from your favorites.`);
    } catch (err) {
      console.error('Error removing favorite:', err);
      setError(t('errorRemovingFavorite'));
    }
  };

  const viewNameDetails = (name: string) => {
    router.push(`/name/${encodeURIComponent(name)}`);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Heart className="h-8 w-8 mr-2 fill-red-500 text-red-500" />
          {t('myFavorites')}
        </h1>
        <Button
          variant="outline"
          className="flex items-center"
          onClick={() => router.push('/search')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToSearch')}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>{commonT('loading')}</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && favorites.length === 0 && (
        <div className="text-center p-12 border rounded-lg bg-muted">
          <p className="text-xl font-medium mb-4">{t('noFavoritesYet')}</p>
          <p className="mb-6">{t('exploreAndAddFavorites')}</p>
          <Button onClick={() => router.push('/search')}>
            {t('startExploring')}
          </Button>
        </div>
      )}

      {!isLoading && favorites.length > 0 && (
        <>
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              className="flex items-center text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => {
                if (window.confirm(t('confirmRemoveAllFavorites'))) {
                  setFavorites([]);
                  setFavoriteItems([]);
                  setFavoriteDetails([]);
                  saveToLocalStorage('favoriteNames', []);
                  saveToLocalStorage('favoriteNameDetails', []);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('removeAllFavorites')}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteDetails.map((nameData) => (
              <div key={nameData.name} className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <button
                    type="button"
                    className="p-1 rounded-full bg-white shadow-sm hover:bg-red-50"
                    onClick={() => {
                      // 查找具有此名称的项目的ID
                      const itemWithName = favoriteItems.find(item => item.name === nameData.name);
                      const itemId = itemWithName?.id || '';
                      removeFavorite(itemId, nameData.name);
                    }}
                    aria-label={t('removeFavorite')}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
                <NameCard
                  nameData={nameData}
                  isFavorite={true}
                  onToggleFavorite={() => {
                    // 查找具有此名称的项目的ID
                    const itemWithName = favoriteItems.find(item => item.name === nameData.name);
                    const itemId = itemWithName?.id || '';
                    removeFavorite(itemId, nameData.name);
                  }}
                  onViewDetails={viewNameDetails}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
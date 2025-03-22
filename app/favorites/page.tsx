'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
            favoriteItems: savedItems // 传递包含完整搜索条件的收藏项
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch name details: ${response.statusText}`);
        }

        const data = await response.json();
        setFavoriteDetails(data.details || []);
      } catch (err) {
        console.error('Error fetching favorite details:', err);
        setError(`Failed to load favorite details: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNameDetails();
  }, []);

  const removeFavorite = (id: string, name?: string) => {
    if (!id && !name) return;

    if (id) {
      // 使用ID移除特定收藏项
      console.log('🔍 Removing favorite by ID:', id);
      const newFavoriteItems = favoriteItems.filter(item => item.id !== id);
      setFavoriteItems(newFavoriteItems);
      saveToLocalStorage('favoriteNameDetails', newFavoriteItems);

      // 从详细数据中移除对应的项
      const itemToRemove = favoriteItems.find(item => item.id === id);
      if (itemToRemove) {
        setFavoriteDetails(prev => prev.filter(detail =>
          !(detail.name === itemToRemove.name &&
            favoriteItems.findIndex(i =>
              i.name === detail.name && i.id !== id
            ) === -1)
        ));
      }

      // 更新简单名字列表（去重）
      const uniqueNames = Array.from(new Set(newFavoriteItems.map(item => item.name)));
      setFavorites(uniqueNames);
      saveToLocalStorage('favoriteNames', uniqueNames);
    } else if (name) {
      // 向后兼容：使用名字移除所有匹配项
      console.log('🔍 Removing all favorites with name:', name);
      const newFavoriteItems = favoriteItems.filter(item => item.name !== name);
      setFavoriteItems(newFavoriteItems);
      saveToLocalStorage('favoriteNameDetails', newFavoriteItems);

      // 从详细数据中移除
      setFavoriteDetails(prev => prev.filter(detail => detail.name !== name));

      // 更新简单名字列表
      const newFavorites = favorites.filter(n => n !== name);
      setFavorites(newFavorites);
      saveToLocalStorage('favoriteNames', newFavorites);
    }
  };

  const viewNameDetails = (name: string) => {
    router.push(`/name/${encodeURIComponent(name)}`);
  };

  return (
    <div className="container max-w-5xl mx-auto pt-8 pb-16 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Favorite Names</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/search')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading your favorites...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-8">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No Favorite Names Yet</h2>
          <p className="text-muted-foreground mb-6">
            Save names you like from the search results to see them here.
          </p>
          <Button onClick={() => router.push('/search')}>
            Search for Names
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-6 text-muted-foreground">
            You have {favorites.length} favorite {favorites.length === 1 ? 'name' : 'names'}.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteDetails.map((detail, index) => {
              // 查找对应的收藏项并记录日志
              const matchingItem = favoriteItems.find(i => i.name === detail.name);
              console.log(`🔍 Found item for ${detail.name}:`, matchingItem);

              const item = matchingItem || {
                id: `${detail.name}-${Date.now()}`,
                name: detail.name,
                gender: 'Male',
                meaningTheme: '',
                chineseMetaphysics: '',
                timestamp: Date.now()
              };

              console.log(`🔍 Using item for ${detail.name}:`, item);

              // 查找所有匹配这个名字的收藏项
              const allItemsForName = favoriteItems.filter(i => i.name === detail.name);
              console.log(`🔍 All items for ${detail.name}:`, allItemsForName);

              return (
                <div key={item.id || `${detail.name}-${index}`} className="relative">
                  {/* 在渲染前记录完整的搜索条件信息 */}
                  {(() => {
                    console.log(`🔍 渲染 ${detail.name} 的搜索条件:`, {
                      id: item.id,
                      gender: item.gender,
                      meaningTheme: item.meaningTheme || '未指定',
                      chineseMetaphysics: item.chineseMetaphysics || '未指定',
                      searchCriteriaObject: {
                        gender: item.gender as 'Male' | 'Female',
                        meaningTheme: item.meaningTheme || '未指定',
                        chineseMetaphysics: item.chineseMetaphysics || '未指定'
                      }
                    });
                    return null;
                  })()}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                    onClick={() => removeFavorite(item.id, detail.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <NameCard
                    nameData={detail}
                    isFavorite={true}
                    onToggleFavorite={() => removeFavorite(item.id, detail.name)}
                    onViewDetails={viewNameDetails}
                    searchCriteria={{
                      gender: item.gender as 'Male' | 'Female',
                      meaningTheme: item.meaningTheme || '未指定', // 确保为空时显示占位符
                      chineseMetaphysics: item.chineseMetaphysics || '未指定'
                    }}
                  />

                  {/* 如果有多个收藏项，显示其他搜索条件 */}
                  {allItemsForName.length > 1 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs">
                      <p className="font-medium text-gray-700">也以这些条件收藏:</p>
                      {allItemsForName.filter(i => i.id !== item.id).map((otherItem) => (
                        <div key={otherItem.id} className="mt-1 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-gray-600">性别: {otherItem.gender || '未指定'}</span>
                            <span className="text-gray-600">主题: {otherItem.meaningTheme || '未指定'}</span>
                            <span className="text-gray-600">玄学: {otherItem.chineseMetaphysics || '未指定'}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-red-500 hover:text-red-700"
                            onClick={() => removeFavorite(otherItem.id)}
                          >
                            移除
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔍 当前localStorage中的favoriteNameDetails:',
                  getFromLocalStorage<FavoriteNameItem[]>('favoriteNameDetails', []));
                console.log('🔍 当前localStorage中的favoriteNames:',
                  getFromLocalStorage<string[]>('favoriteNames', []));
                console.log('🔍 当前组件状态 favoriteItems:', favoriteItems);
                console.log('🔍 当前组件状态 favoriteDetails:', favoriteDetails);
              }}
            >
              调试收藏数据
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
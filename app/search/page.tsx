'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import SearchForm, { SearchCriteria } from '@/components/search/SearchForm';
import NameCard from '@/components/name-details/NameCard';
import { NameMatchAnalysis } from '@/types/name-analysis';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { BabyName } from '@/lib/data-fetching/ssa-data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getFromLocalStorage, saveToLocalStorage, generateFavoriteId } from '@/lib/utils';
import { useId } from 'react';
import SearchResults from '@/components/search/SearchResults';
import { FavoriteNameItem } from '@/types/favorite-name-item';
import dynamic from 'next/dynamic';
import { useClientOnlyEffect } from '@/lib/hooks/useClientEffect';

// 扩展 SearchCriteria 接口
interface ExtendedSearchCriteria extends SearchCriteria {
  // nameSource?: 'ssa' | 'popCulture';
  startYear?: number;  // Will be handled with default value in usage
  endYear?: number;    // Will be handled with default value in usage
}

export default function SearchPage() {
  const router = useRouter();
  const t = useTranslations('SearchPage');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<NameMatchAnalysis[]>([]);
  const [streamingResults, setStreamingResults] = useState<NameMatchAnalysis[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [processedNames, setProcessedNames] = useState<string[]>([]);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [matchesFound, setMatchesFound] = useState(0);
  const [currentCriteria, setCurrentCriteria] = useState<ExtendedSearchCriteria | null>(null);
  const [targetNameCount, setTargetNameCount] = useState(0);
  const [searchDuration, setSearchDuration] = useState(0);
  const [id, setId] = useState('');
  const [matchingNames, setMatchingNames] = useState<NameMatchAnalysis[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [nameSource, setNameSource] = useState<'ssa' | 'popCulture'>('ssa');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(true);

  const stableId = useId();

  useEffect(() => {
    setId(stableId);
  }, [stableId]);

  // Add cleanup function for the EventSource
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Load favorites after mount
  useClientOnlyEffect(() => {
    const savedFavorites = getFromLocalStorage<string[]>('favoriteNames', []);
    setFavorites(savedFavorites);
  }, []);

  const handleSearch = async (criteria: ExtendedSearchCriteria) => {
    setError('');
    setSearchMessage('');
    setIsLoading(true);
    setMatchingNames([]);
    setStreamingResults([]);
    setProcessedNames([]);
    setCurrentCriteria(criteria);
    setSearchPerformed(true);
    setTotalProcessed(0);
    setMatchesFound(0);

    try {
      // 验证目标匹配数量
      const targetMatches = Math.min(Math.max(1, criteria.targetMatches || 10), 50);
      console.log(`[${new Date().toISOString()}] Search criteria:`, { ...criteria, targetMatches });

      // 根据名字来源选择不同的获取方式
      let names: string[] = [];

      if (criteria.nameSource === 'popCulture') {
        // 从流行文化 API 获取名字
        console.log(`[${new Date().toISOString()}] Fetching names from pop culture API`);
        const response = await fetch(`/api/pop-culture-names?gender=${criteria.gender}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch pop culture names: ${response.statusText}`);
        }

        const data = await response.json();
        names = data.names;
        console.log(`[${new Date().toISOString()}] Retrieved ${names.length} pop culture names`);

        // 分析流行文化名字
        if (names.length > 0) {
          const analysisResponse = await fetch('/api/name-analysis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              names: names,
              gender: criteria.gender,
              meaningTheme: criteria.meaningTheme || '',
              chineseMetaphysics: criteria.chineseMetaphysics || '',
              targetMatches: targetMatches,
              usePrefiltering: criteria.usePrefiltering,
              prefilterBatchSize: 100
            }),
          });

          if (!analysisResponse.ok) {
            throw new Error(`Failed to analyze names: ${JSON.stringify(analysisResponse, null, 2)}`);
          }

          const analysisData = await analysisResponse.json();

          if (analysisData.analyses && Array.isArray(analysisData.analyses)) {
            // 确保使用与 SSA 数据相同的状态更新方式，并过滤掉所有 null 或 undefined 值
            const popCultureAnalyses = analysisData.analyses.filter((analysis: any) =>
              analysis !== null &&
              analysis !== undefined &&
              typeof analysis === 'object' &&
              'name' in analysis
            );

            console.log(`[${new Date().toISOString()}] Filtered pop culture analyses:`,
              popCultureAnalyses.length,
              'out of',
              analysisData.analyses.length
            );

            // 检查是否有有效的分析结果
            if (popCultureAnalyses.length > 0) {
              console.log(`[${new Date().toISOString()}] First valid analysis:`, JSON.stringify(popCultureAnalyses[0], null, 2));

              // 更新状态变量，与 SSA 数据处理方式保持一致
              setMatchingNames(popCultureAnalyses);
              setTotalProcessed(names.length);
              setMatchesFound(popCultureAnalyses.length);

              // 设置搜索消息
              if (popCultureAnalyses.length < targetMatches) {
                setSearchMessage(`Found ${popCultureAnalyses.length} matching names from pop culture references.`);
              } else {
                setSearchMessage(`Found ${popCultureAnalyses.length} matching names from pop culture references.`);
              }
            } else {
              console.error(`[${new Date().toISOString()}] No valid pop culture analyses found`);
              setError('No valid matching names found in pop culture references.');
              setMatchingNames([]);
            }
          } else {
            console.error(`[${new Date().toISOString()}] Invalid analyses data:`, analysisData);
            setError('No matching names found in pop culture references.');
            setMatchingNames([]);
          }
        } else {
          setError('No pop culture names retrieved.');
          setMatchingNames([]);
        }

        // 添加这一行，确保在处理完 Pop Culture 名字后退出
        setIsLoading(false);
        setSearchPerformed(true); // 确保显示搜索结果
        return;
      } else {
        // 使用 SSA 数据获取逻辑
        console.log(`[${new Date().toISOString()}] Searching for SSA names with target matches: ${targetMatches}`);

        // 尝试使用 /api/baby-names 端点
        const response = await fetch('/api/baby-names', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gender: criteria.gender,
            count: Math.max(1000, targetMatches * 10),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch names: ${response.statusText}`);
        }

        const data = await response.json();
        const names = data.names || [];
        const totalAvailable = data.total || names.length;

        console.log(`[${new Date().toISOString()}] Fetched ${names.length} names for analysis (total available: ${totalAvailable})`);

        // 如果没有获取到名字，显示错误
        if (names.length === 0) {
          setError('No names available to search. Please try different criteria.');
          setIsLoading(false);
          return;
        }

        // 提取名字字符串用于分析
        const namesToAnalyze = names.map((nameObj: BabyName) => nameObj.name)

        console.log(`[${new Date().toISOString()}] Analyzing ${namesToAnalyze.length} names`);

        // 调用名字分析API
        const analysisResponse = await fetch('/api/name-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            names: namesToAnalyze,
            gender: criteria.gender,
            meaningTheme: criteria.meaningTheme || '',
            chineseMetaphysics: criteria.chineseMetaphysics || '',
            targetMatches: targetMatches,
            usePrefiltering: criteria.usePrefiltering,
            prefilterBatchSize: 100
          }),
        });

        if (!analysisResponse.ok) {
          throw new Error(`Failed to analyze names: ${JSON.stringify(analysisResponse, null, 2)}`);
        }

        const analysisData = await analysisResponse.json();
        const batchMatchingAnalyses = analysisData.analyses || [];
        const totalAnalyzed = analysisData.totalAnalyzed || namesToAnalyze.length;

        console.log(`[${new Date().toISOString()}] Analysis complete. Found ${batchMatchingAnalyses.length} matching names out of ${totalAnalyzed} analyzed`);
        // 合并匹配结果
        const updatedMatchingNames = [...batchMatchingAnalyses];

        // 更新UI显示当前找到的匹配
        setMatchingNames(updatedMatchingNames);
        setTotalProcessed(processedNames.length);
        setMatchesFound(matchingNames.length);

        // 更新搜索消息
        if (matchingNames.length < targetMatches) {
          setSearchMessage(`Found ${matchingNames.length} matching names so far. Searching for more...`);
        }

        // 检查是否已经处理了所有可用的名字
        if (processedNames.length >= totalAvailable && 1880 <= 2023) {
          console.log(`[${new Date().toISOString()}] Processed all available names (${processedNames.length}/${totalAvailable}) from 1880 to 2023`);
        }

        // 搜索完成
        setIsLoading(false);
        setProcessedNames(Array.from(processedNames));

        // 设置最终搜索消息
        if (matchingNames.length < targetMatches) {
          if (matchingNames.length === 0) {
            setSearchMessage(`No matching names found after searching ${processedNames.length} names from 1880 to 2023. Try different search criteria.`);
          } else {
            setSearchMessage(`Found ${matchingNames.length} matching names out of ${targetMatches} requested after searching ${processedNames.length} names. Try different search criteria for more results.`);
          }
        } else {
          setSearchMessage(`Found ${matchingNames.length} matching names after searching ${processedNames.length} names.`);
        }
      }

      // 设置最终搜索结果
      setResults(matchingNames);

    } catch (error) {
      console.error('Search error:', error);
      setError(`Search failed: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = (name: string) => {
    // 详细记录当前搜索条件
    console.log('🔍 Toggling favorite for name:', name);
    console.log('🔍 Current search criteria:', {
      gender: currentCriteria?.gender,
      meaningTheme: currentCriteria?.meaningTheme,
      chineseMetaphysics: currentCriteria?.chineseMetaphysics
    });

    // 获取当前收藏项
    const savedItems = getFromLocalStorage<FavoriteNameItem[]>('favoriteNameDetails', []);
    console.log('🔍 Current favorite items:', savedItems);

    // 收藏项逻辑 - 为了完整跟踪流程，保持现有逻辑但添加详细日志
    setFavorites(prev => {
      const wasFavorited = prev.includes(name);
      console.log('🔍 Name was previously favorited:', wasFavorited);

      // 创建当前搜索条件的ID
      const favoriteId = generateFavoriteId(
        name,
        currentCriteria?.gender || 'Male',
        currentCriteria?.meaningTheme || '',
        currentCriteria?.chineseMetaphysics || ''
      );
      console.log('🔍 Generated favorite ID:', favoriteId);

      // 检查是否存在匹配的收藏项
      const existingItem = savedItems.find(item => item.id === favoriteId);
      console.log('🔍 Existing item with same ID:', existingItem);

      // 更新详细收藏列表
      let newFavoriteItems: FavoriteNameItem[];

      if (existingItem) {
        // 如果已存在相同搜索条件的收藏项，则移除
        console.log('🔍 Removing existing item with same search criteria');
        newFavoriteItems = savedItems.filter(item => item.id !== favoriteId);
      } else if (wasFavorited) {
        // 如果名字已收藏但搜索条件不同，则添加新条件
        console.log('🔍 Adding new search criteria for already favorited name');
        const newItem: FavoriteNameItem = {
          id: favoriteId,
          name,
          gender: currentCriteria?.gender || 'Male',
          meaningTheme: currentCriteria?.meaningTheme || '',
          chineseMetaphysics: currentCriteria?.chineseMetaphysics || '',
          timestamp: Date.now()
        };
        newFavoriteItems = [...savedItems, newItem];
        console.log('🔍 Added new item:', newItem);
      } else {
        // 全新收藏
        console.log('🔍 Adding completely new favorite');
        const newItem: FavoriteNameItem = {
          id: favoriteId,
          name,
          gender: currentCriteria?.gender || 'Male',
          meaningTheme: currentCriteria?.meaningTheme || '',
          chineseMetaphysics: currentCriteria?.chineseMetaphysics || '',
          timestamp: Date.now()
        };
        newFavoriteItems = [...savedItems, newItem];
        console.log('🔍 Added new item:', newItem);
      }

      // 保存详细收藏数据
      console.log('🔍 Saving updated favorite items:', newFavoriteItems);
      saveToLocalStorage('favoriteNameDetails', newFavoriteItems);

      // 更新简单名字列表（移除重复项）
      const uniqueNames = Array.from(new Set(newFavoriteItems.map(item => item.name)));
      console.log('🔍 Saving unique names list:', uniqueNames);
      saveToLocalStorage('favoriteNames', uniqueNames);

      return uniqueNames;
    });
  };

  const viewNameDetails = (name: string) => {
    router.push(`/name/${encodeURIComponent(name)}`);
  };

  // Add a timeout to prevent infinite searching
  const searchTimeout = setTimeout(() => {
    if (isStreaming) {
      console.log(`[${new Date().toISOString()}] Search timeout reached`);
      setError('Search took too long. Please try again with fewer names.');
      setIsStreaming(false);
      setIsLoading(false);
      eventSourceRef.current?.close();
    }
  }, 120000); // Increase from 60000 (1 minute) to 120000 (2 minutes)

  // Clear the timeout when component unmounts or search completes
  useEffect(() => {
    return () => {
      clearTimeout(searchTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Add this useEffect to detect if the search is taking too long
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isStreaming) {
      // Set a timer to check if we're still streaming after 30 seconds
      timer = setTimeout(() => {
        if (isStreaming && streamingResults.length > 0) {
          console.log(`[${new Date().toISOString()}] Search seems stuck, forcing completion with ${streamingResults.length} results`);
          setIsStreaming(false);
          setIsLoading(false);
          setResults(streamingResults);

          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
        }
      }, 30000); // 30 seconds
    }

    return () => {
      clearTimeout(timer);
    };
  }, [isStreaming, streamingResults]);

  // Add this useEffect to continue processing names if needed
  useEffect(() => {
    // If we're not streaming anymore but haven't processed enough names
    if (!isStreaming && !isLoading && searchPerformed &&
        totalProcessed < targetNameCount &&
        !error && currentCriteria) {

      console.log(`[${new Date().toISOString()}] Need to process more names. Current: ${totalProcessed}, Target: ${targetNameCount}`);

      // Restart the search with remaining count
      const remainingCount = targetNameCount - totalProcessed;
      if (remainingCount > 0) {
        // Fetch more names directly
        const fetchMoreNames = async () => {
          try {
            setIsLoading(true);

            // Try with a wider year range if we're using a narrow range
            const currentStartYear = currentCriteria.startYear || 2013;
            const currentEndYear = currentCriteria.endYear || 2023;

            // If we have a narrow year range and not enough names, expand it
            const expandedStartYear = currentEndYear - currentStartYear < 5 ?
              Math.max(1880, currentStartYear - 5) : currentStartYear;

            console.log(`[${new Date().toISOString()}] Fetching more names with expanded year range: ${expandedStartYear}-${currentEndYear}`);

            const response = await fetch(`/api/baby-names?gender=${currentCriteria.gender}&limit=${remainingCount * 2}&startYear=${expandedStartYear}&endYear=${currentEndYear}`);

            if (response.ok) {
              const data = await response.json();
              const moreNames = data.babyNames || [];

              if (moreNames.length > 0) {
                // Process these additional names
                const namesToAnalyze = moreNames
                  .map((name: BabyName) => name.name)
                  .filter((name: string) => !processedNames.includes(name))
                  .slice(0, remainingCount);

                if (namesToAnalyze.length > 0) {
                  setProcessedNames(prev => [...prev, ...namesToAnalyze]);

                  const analysisResponse = await fetch('/api/name-analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      names: namesToAnalyze,
                      gender: currentCriteria.gender,
                      meaningTheme: currentCriteria.meaningTheme,
                      chineseMetaphysics: currentCriteria.chineseMetaphysics
                    }),
                  });

                  if (analysisResponse.ok) {
                    const analysisData = await analysisResponse.json();
                    const matchingNames = (analysisData.analyses || [])
                      .filter((analysis: NameMatchAnalysis) => analysis.overallMatch);

                    setTotalProcessed(prev => prev + namesToAnalyze.length);
                    setMatchesFound(prev => prev + matchingNames.length);

                    setResults(prev => {
                      const newResults = [...prev];
                      matchingNames.forEach((name: NameMatchAnalysis) => {
                        if (!newResults.some(n => n.name === name.name)) {
                          newResults.push(name);
                        }
                      });
                      return newResults;
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error fetching additional names:', error);
          } finally {
            setIsLoading(false);
          }
        };

        fetchMoreNames();
      }
    }
  }, [isStreaming, isLoading, searchPerformed, totalProcessed, targetNameCount, error, currentCriteria, processedNames]);

  // In the useEffect that processes the streaming results
  useEffect(() => {
    // When setting the final results, also update the matchesFound count
    if (!isStreaming && searchPerformed && !isLoading) {
      // Make sure matchesFound matches the actual number of results
      setMatchesFound(results.length);
    }
  }, [isStreaming, searchPerformed, isLoading, results.length]);

  // Add this useEffect to track search duration
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isStreaming) {
      const startTime = Date.now();
      timer = setInterval(() => {
        setSearchDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setSearchDuration(0);
    }

    return () => {
      clearInterval(timer);
    };
  }, [isStreaming]);

  const clearCache = () => {
    // Import the cache clearing function
    import('@/lib/cache/name-analysis-cache').then(cache => {
      cache.clearNameAnalysisCache();
      alert('Cache cleared successfully! Please refresh and search again.');
    });
  };

  // Add this function to handle loading more results
  const handleLoadMore = async () => {
    if (!currentCriteria || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      console.log(`[${new Date().toISOString()}] Loading more names...`);
      
      // Get current names to avoid duplicates
      const existingNames = matchingNames.map(item => item.name);
      console.log(`[${new Date().toISOString()}] Existing names: ${existingNames.length}`);
      
      // Determine which endpoint to use based on the name source
      if (currentCriteria.nameSource === 'popCulture') {
        // Load more pop culture names
        const response = await fetch(`/api/pop-culture-names?gender=${currentCriteria.gender}&skip=${matchingNames.length}&limit=10&exclude=${encodeURIComponent(JSON.stringify(existingNames))}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch more pop culture names: ${response.statusText}`);
        }
        
        const data = await response.json();
        const newNames = data.names || [];
        
        if (newNames.length === 0) {
          // Always keep the button visible
          // setHasMoreResults(false);
          return;
        }
        
        console.log(`[${new Date().toISOString()}] Got ${newNames.length} new pop culture names`);
        
        const analysisResponse = await fetch('/api/name-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            names: newNames,
            gender: currentCriteria.gender,
            meaningTheme: currentCriteria.meaningTheme || '',
            chineseMetaphysics: currentCriteria.chineseMetaphysics || '',
            targetMatches: 3,
            usePrefiltering: currentCriteria.usePrefiltering
          }),
        });
        
        if (!analysisResponse.ok) {
          throw new Error(`Failed to analyze more names: ${JSON.stringify(analysisResponse, null, 2)}`);
        }
        
        const analysisData = await analysisResponse.json();
        const newAnalyses = (analysisData.analyses || []).filter((analysis: NameMatchAnalysis | null | undefined) => 
          analysis !== null && 
          analysis !== undefined && 
          typeof analysis === 'object' && 
          'name' in analysis
        );
        
        if (newAnalyses.length === 0) {
          // Always keep the button visible
          // setHasMoreResults(false);
          return;
        }
        
        // Add new analyses to existing ones
        setMatchingNames(prev => [...prev, ...newAnalyses]);
        
        return;
      }
      
      // Load more SSA names
      const response = await fetch('/api/baby-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gender: currentCriteria.gender,
          count: 50, // Fetch more names to have better chances of finding unique ones
          offset: totalProcessed, // Skip already processed names
          exclude: existingNames // Pass existing names to avoid duplicates
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch more names: ${response.statusText}`);
      }
      
      const data = await response.json();
      const newNames = data.names || [];
      
      if (newNames.length === 0) {
        // Always keep the button visible
        // setHasMoreResults(false);
        return;
      }
      
      console.log(`[${new Date().toISOString()}] Got ${newNames.length} new SSA names`);
      
      // Extract name strings
      const namesToAnalyze = newNames.map((nameObj: BabyName) => nameObj.name);
      
      const analysisResponse = await fetch('/api/name-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          names: namesToAnalyze,
          gender: currentCriteria.gender,
          meaningTheme: currentCriteria.meaningTheme || '',
          chineseMetaphysics: currentCriteria.chineseMetaphysics || '',
          targetMatches: 3,
          usePrefiltering: currentCriteria.usePrefiltering
        }),
      });
      
      if (!analysisResponse.ok) {
        throw new Error(`Failed to analyze more names: ${JSON.stringify(analysisResponse, null, 2)}`);
      }
      
      const analysisData = await analysisResponse.json();
      const newAnalyses = analysisData.analyses || [];
      
      if (newAnalyses.length === 0) {
        // Always keep the button visible
        // setHasMoreResults(false);
        return;
      }
      
      // Update processed counts
      setTotalProcessed(prev => prev + namesToAnalyze.length);
      setMatchesFound(prev => prev + newAnalyses.length);
      
      // Add new analyses to existing ones, avoiding duplicates
      setMatchingNames(prev => {
        const prevNames = prev.map(item => item.name);
        const uniqueNewAnalyses = newAnalyses.filter(
          (item: NameMatchAnalysis) => !prevNames.includes(item.name)
        );
        
        console.log(`[${new Date().toISOString()}] Found ${uniqueNewAnalyses.length} unique new names out of ${newAnalyses.length}`);
        
        if (uniqueNewAnalyses.length === 0) {
          // Always keep the button visible
          // setHasMoreResults(false);
        }
        
        return [...prev, ...uniqueNewAnalyses];
      });
    } catch (error) {
      console.error('Error loading more names:', error);
      setError(`Failed to load more names: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">{t('findYourPerfectBabyName')}</h1>

      <SearchForm onSearch={handleSearch} isLoading={isLoading} />

      {isStreaming && (
        <div className="mt-8 p-6 border rounded-lg bg-slate-50">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <h2 className="text-xl font-semibold">{t('searchingForNames')}</h2>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('namesProcessedLabel')}</span>
              <span className="font-medium">{totalProcessed}</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${Math.min((totalProcessed / targetNameCount) * 100, 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-sm">
              <span>{t('matchesFoundLabel')}</span>
              <span className="font-medium">{matchesFound}</span>
            </div>

            {streamingResults.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">{t('matchesSoFar')}:</h3>
                <div className="flex flex-wrap gap-2">
                  {streamingResults.slice(0, 10).map(result => (
                    <span key={result.name} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {result.name}
                    </span>
                  ))}
                  {streamingResults.length > 10 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                      +{streamingResults.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {t('eachNameAnalyzed')}
            </p>

            <div className="mt-3 text-center text-sm text-gray-500">
              {t('searchInProgress')} {searchDuration} seconds
              {searchDuration > 45 && (
                <p className="text-amber-600 mt-1">
                  {t('searchLongerMessage')}
                </p>
              )}
            </div>

            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                  }
                  setIsStreaming(false);
                  setIsLoading(false);

                  // If we have some results, show them
                  if (streamingResults.length > 0) {
                    setResults(streamingResults);
                  } else {
                    setError('Search cancelled. No results found yet.');
                  }
                }}
              >
                {t('cancelSearch')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded my-6">
          {error}
        </div>
      )}

      {isStreaming && streamingResults.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">{t('preliminaryResults')}({streamingResults.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {streamingResults.map((result) => (
              <NameCard
                key={result.name}
                nameData={result}
                isFavorite={favorites.includes(result.name)}
                onToggleFavorite={toggleFavorite}
                onViewDetails={viewNameDetails}
              />
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 flex justify-end">
          <Button
            variant="outline"
            onClick={() => router.push('/favorites')}
            className="mb-4"
          >
            {t('viewAllFavorites')}
          </Button>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p>{t('namesInfoMessage')}</p>
      </div>

      {searchPerformed && (
        <SearchResults
          matchingNames={matchingNames}
          isLoading={isLoading}
          searchMessage={searchMessage}
          error={error || ''}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onViewDetails={viewNameDetails}
          onLoadMore={handleLoadMore}
          isLoadingMore={isLoadingMore}
          hasMoreResults={hasMoreResults}
        />
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={clearCache}
        className="ml-2"
      >
        {t('clearCache')}
      </Button>
    </div>
  );
}
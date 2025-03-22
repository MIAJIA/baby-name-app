'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getCacheStats } from '@/lib/cache/name-analysis-cache';
import { useTranslations } from 'next-intl';

export default function CacheStats() {
  const t = useTranslations('SearchPage');
  const [stats, setStats] = useState({ totalEntries: 0, totalSize: '0 KB' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 获取缓存统计信息
    const fetchStats = async () => {
      const response = await fetch('/api/admin/cache-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    };

    fetchStats();
  }, []);

  const handleClearCache = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/clear-cache', { method: 'POST' });
      // 更新统计信息
      setStats({ totalEntries: 0, totalSize: '0 KB' });
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache Statistics</CardTitle>
        <CardDescription>Information about name analysis cache</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Total Entries</p>
            <p className="text-2xl font-bold">{stats.totalEntries}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Total Size</p>
            <p className="text-2xl font-bold">{stats.totalSize}</p>
          </div>
        </div>
        <Button
          variant="destructive"
          disabled={loading || stats.totalEntries === 0}
          onClick={handleClearCache}
          className="w-full"
        >
          {loading ? t('clearing') : t('clearCache')}
        </Button>
      </CardContent>
    </Card>
  );
}
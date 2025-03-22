'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCacheStats } from '@/lib/cache/name-analysis-cache';

export default function CacheStats() {
  const [stats, setStats] = useState({ totalEntries: 0, avgAge: 0 });
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
      setStats({ totalEntries: 0, avgAge: 0 });
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Name Analysis Cache</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Cached Entries</p>
            <p className="text-2xl font-bold">{stats.totalEntries}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average Age (days)</p>
            <p className="text-2xl font-bold">{stats.avgAge.toFixed(1)}</p>
          </div>
        </div>

        <Button
          variant="destructive"
          disabled={loading || stats.totalEntries === 0}
          onClick={handleClearCache}
          className="w-full"
        >
          {loading ? 'Clearing...' : 'Clear Cache'}
        </Button>
      </CardContent>
    </Card>
  );
}
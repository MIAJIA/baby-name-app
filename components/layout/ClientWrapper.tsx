"use client";
import { useEffect } from 'react';
import { clearFavorites } from '@/lib/utils';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 临时启用以清除所有收藏数据
    clearFavorites();
    console.log('已清除所有收藏数据，请重新添加收藏');
  }, []);

  return <>{children}</>;
}
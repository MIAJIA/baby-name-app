import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 生成随机 ID
 */
export function generateId(length = 8) {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Safely get an item from localStorage (only on client)
 */
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== 'undefined') {
      const serializedValue = localStorage.getItem(key);
      console.log('💾 Reading from localStorage:', key, serializedValue);
      if (serializedValue === null) {
        return defaultValue;
      }
      return JSON.parse(serializedValue);
    }
  } catch (error) {
    console.error('💾 Error reading from localStorage:', error);
  }
  return defaultValue;
}

/**
 * Safely set an item in localStorage (only on client)
 */
export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    console.log('💾 Saving to localStorage:', key, value);
    if (typeof window !== 'undefined') {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      console.log('💾 Saved successfully');
    }
  } catch (error) {
    console.error('💾 Error saving to localStorage:', error);
  }
}

// 更新收藏项目接口，直接添加id字段
export interface FavoriteNameItem {
  id: string; // 添加必需的id字段
  name: string;
  gender: 'Male' | 'Female';
  meaningTheme: string;
  chineseMetaphysics: string;
  timestamp: number;
}

/**
 * 根据名字和搜索条件生成唯一ID
 */
export function generateFavoriteId(name: string, gender: string, meaningTheme: string, chineseMetaphysics: string): string {
  // 清理和标准化字符串
  const cleanMeaningTheme = (meaningTheme || '').trim().toLowerCase();
  const cleanMetaphysics = (chineseMetaphysics || '').trim().toLowerCase();
  const cleanGender = (gender || 'Male').trim();

  // 生成唯一ID
  return `${name}_${cleanGender}_${cleanMeaningTheme}_${cleanMetaphysics}`;
}

// 删除迁移代码
export function clearFavorites(): void {
  try {
    if (typeof window !== 'undefined') {
      // 清除所有收藏数据
      localStorage.removeItem('favoriteNameDetails');
      localStorage.removeItem('favoriteNames');
      console.log('💾 Cleared all favorite data');
    }
  } catch (error) {
    console.error('💾 Error clearing favorites:', error);
  }
}
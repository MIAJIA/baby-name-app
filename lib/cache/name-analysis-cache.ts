import { NameMatchAnalysis } from '@/types/name-analysis';

// Cache key for localStorage
const CACHE_KEY = 'nameAnalysisCache';

// Cache type definitions
interface CacheEntry {
  analysis: NameMatchAnalysis;
  timestamp: number;
}

interface AnalysisCache {
  [key: string]: CacheEntry;
}

// Cache data
let cache: AnalysisCache = {};

// Cache expiry time (30 days in milliseconds)
const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000;

// Session statistics
let sessionCacheHits = 0;
let sessionCacheMisses = 0;

// Initialize cache from localStorage (client-side only)
function initCache() {
  try {
    // Check if window exists (client-side)
    if (typeof window !== 'undefined') {
      const savedCache = localStorage.getItem(CACHE_KEY);
      if (savedCache) {
        cache = JSON.parse(savedCache);
        console.log(`[Cache] Loaded ${Object.keys(cache).length} entries from localStorage`);
      }
    }
  } catch (error) {
    console.error('[Cache] Error initializing cache:', error);
    cache = {};
  }
}

// Save cache to localStorage (client-side only)
function saveCache() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.error('[Cache] Error saving cache:', error);
  }
}

// Generate cache key
function getCacheKey(name: string, gender: 'Male' | 'Female', meaningTheme: string, chineseMetaphysics: string): string {
  return `${name}_${gender}_${meaningTheme}_${chineseMetaphysics}`.toLowerCase();
}

// Get cached analysis result
export function getCachedAnalysis(
  name: string,
  gender: 'Male' | 'Female',
  meaningTheme: string,
  chineseMetaphysics: string
): NameMatchAnalysis | null {
  const key = getCacheKey(name, gender, meaningTheme, chineseMetaphysics);

  // Check cache
  if (cache[key]) {
    const entry = cache[key];
    const now = Date.now();

    // Check if expired
    if (now - entry.timestamp < CACHE_EXPIRY) {
      sessionCacheHits++;
      console.log(`[Cache] Hit for name: "${name}" (Total hits: ${sessionCacheHits})`);
      return entry.analysis;
    } else {
      console.log(`[Cache] Expired entry for name: "${name}"`);
      // Delete expired entry
      delete cache[key];
      // Save cache
      setTimeout(saveCache, 0);
      sessionCacheMisses++;
    }
  } else {
    sessionCacheMisses++;
  }

  return null;
}

// Store analysis result in cache
export function setCachedAnalysis(
  name: string,
  gender: 'Male' | 'Female',
  meaningTheme: string,
  chineseMetaphysics: string,
  analysis: NameMatchAnalysis
): void {
  const key = getCacheKey(name, gender, meaningTheme, chineseMetaphysics);

  // Store result
  cache[key] = {
    analysis,
    timestamp: Date.now()
  };

  // Save cache
  setTimeout(saveCache, 0);
  console.log(`[Cache] Stored analysis for name: ${name}`);
}

// Clean expired cache entries
export function cleanExpiredCache(): void {
  const now = Date.now();
  let removedCount = 0;

  Object.keys(cache).forEach(key => {
    if (now - cache[key].timestamp > CACHE_EXPIRY) {
      delete cache[key];
      removedCount++;
    }
  });

  if (removedCount > 0) {
    console.log(`[Cache] Cleaned ${removedCount} expired entries`);
    saveCache();
  }
}

// Get session cache statistics
export function getSessionCacheStats() {
  const totalRequests = sessionCacheHits + sessionCacheMisses;
  const hitRate = totalRequests > 0 ? (sessionCacheHits / totalRequests * 100).toFixed(2) : '0';

  return {
    hits: sessionCacheHits,
    misses: sessionCacheMisses,
    total: totalRequests,
    hitRate: `${hitRate}%`
  };
}

// Reset session statistics
export function resetSessionCacheStats() {
  sessionCacheHits = 0;
  sessionCacheMisses = 0;
}

// Extended cache statistics
export function getCacheStats() {
  const sessionStats = getSessionCacheStats();

  return {
    totalEntries: Object.keys(cache).length,
    avgAge: Object.values(cache).reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) /
            Math.max(1, Object.keys(cache).length) / (1000 * 60 * 60 * 24),  // Average age in days
    sessionHits: sessionStats.hits,
    sessionMisses: sessionStats.misses,
    sessionHitRate: sessionStats.hitRate
  };
}

// Clear name analysis cache
export function clearNameAnalysisCache(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
      cache = {};
      console.log('Name analysis cache cleared successfully');
    }
  } catch (error) {
    console.error('Error clearing name analysis cache:', error);
  }
}

// Initialize cache
initCache();

// Clean expired entries periodically (once per hour)
if (typeof window !== 'undefined' && typeof setInterval !== 'undefined') {
  setInterval(cleanExpiredCache, 60 * 60 * 1000);
}
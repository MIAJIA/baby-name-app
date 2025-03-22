// NOTE: DO NOT IMPORT OR USE THIS FILE DIRECTLY IN CLIENT COMPONENTS
// This file uses Node.js modules that won't work in the browser.
// Instead, use the /api/name-popularity API endpoint.

import axios from 'axios';

interface BabyNameRecord {
  name: string;
  gender: string;
  count: string;
}

export interface BabyName {
  name: string;
  gender: 'Male' | 'Female';
  count: number;
  rank: number;
  year: number;
}

export interface TrendDataPoint {
  year: number;
  name: string;
  gender: 'Male' | 'Female';
  rank: number | null;
  count: number;
}

/**
 * Gets popularity trend for a specific name over time
 * THIS FUNCTION SHOULD ONLY BE USED SERVER-SIDE
 * For client components, use the /api/name-popularity endpoint instead
 */
export async function getNamePopularityTrend(
  name: string,
  gender: 'Male' | 'Female',
  startYear: number = 1990,
  endYear: number | null = null
): Promise<TrendDataPoint[]> {
  throw new Error(
    'This function uses Node.js modules and should not be called from client components. ' +
    'Use the /api/name-popularity endpoint instead.'
  );
}

/**
 * Gets popular baby names from local data files
 * THIS FUNCTION SHOULD ONLY BE USED SERVER-SIDE
 * For client components, create an appropriate API endpoint
 */
export async function getPopularBabyNamesFromFiles(
  year: number | null = null,
  limit: number = 1000
): Promise<BabyName[]> {
  throw new Error(
    'This function uses Node.js modules and should not be called from client components. ' +
    'Create an appropriate API endpoint instead.'
  );
}
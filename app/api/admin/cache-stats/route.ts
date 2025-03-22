import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/cache/name-analysis-cache';

export async function GET() {
  return NextResponse.json(getCacheStats());
}
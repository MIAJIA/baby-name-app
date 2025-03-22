import { NextResponse } from 'next/server';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

export async function POST() {
  try {
    const cacheFile = path.join(process.cwd(), '.cache', 'name-analysis-cache.json');

    if (existsSync(cacheFile)) {
      unlinkSync(cacheFile);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
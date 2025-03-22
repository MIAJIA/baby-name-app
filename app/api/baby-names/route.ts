import { NextRequest, NextResponse } from 'next/server';
import { getPopularBabyNamesFromYearRange } from '@/lib/data-fetching/ssa-data';

console.log('Baby names API route loaded');

export async function GET(request: NextRequest) {
  console.log(`[${new Date().toISOString()}] Received GET request to /api/baby-names`);
  console.log(`[${new Date().toISOString()}] Request URL:`, request.url);

  const { searchParams } = new URL(request.url);

  // 记录所有查询参数
  const allParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    allParams[key] = value;
  });
  console.log(`[${new Date().toISOString()}] All query parameters:`, allParams);

  const gender = searchParams.get('gender') as 'Male' | 'Female' | null;
  const limitParam = searchParams.get('limit');
  const startYearParam = searchParams.get('startYear');
  const endYearParam = searchParams.get('endYear');
  const offsetParam = searchParams.get('offset');

  // 记录解析后的参数
  console.log(`[${new Date().toISOString()}] Parsed parameters:`, {
    gender,
    limitParam,
    startYearParam,
    endYearParam,
    offsetParam
  });

  const limit = limitParam ? parseInt(limitParam, 10) : 100;
  const startYear = startYearParam ? parseInt(startYearParam, 10) : 2013;
  const endYear = endYearParam ? parseInt(endYearParam, 10) : 2023;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  // Validate parameters
  if (!gender || (gender !== 'Male' && gender !== 'Female')) {
    return NextResponse.json({ error: 'Invalid gender parameter' }, { status: 400 });
  }

  console.log(`[${new Date().toISOString()}] Fetching baby names for ${gender}, year range: ${startYear}-${endYear}, limit: ${limit}, offset: ${offset}`);

  try {
    // 获取指定年份范围内的流行婴儿名字
    // 注意：这里我们请求更多的名字，以确保有足够的名字可以分页
    const allNames = await getPopularBabyNamesFromYearRange(startYear, endYear, 5000, gender);

    // 应用偏移量并限制返回数量
    const paginatedNames = allNames.slice(offset, offset + limit);

    console.log(`[${new Date().toISOString()}] Returning ${paginatedNames.length} names (total available: ${allNames.length})`);

    return NextResponse.json({
      names: paginatedNames,
      totalAvailable: allNames.length,
      offset: offset,
      limit: limit,
      yearRange: {
        start: startYear,
        end: endYear
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching baby names:`, error);
    return NextResponse.json({ error: 'Failed to fetch baby names' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request JSON
    const body = await request.json().catch(() => ({}));

    // Validate required parameters
    const { gender, count } = body;

    if (!gender || !['Male', 'Female'].includes(gender)) {
      return NextResponse.json(
        { error: "Invalid gender parameter. Must be 'Male' or 'Female'." },
        { status: 400 }
      );
    }

    // Use a safe default if count is not provided or invalid
    const safeCount = typeof count === 'number' && count > 0 ? count : 1000;

    // Get baby names with proper error handling
    const names = await getPopularBabyNamesFromYearRange(2013, 2023, safeCount, gender);

    // Return the names
    return NextResponse.json({
      names: names,
      totalAvailable: names.length,
      offset: 0,
      limit: safeCount,
      yearRange: {
        start: 2013,
        end: 2023
      }
    });
  } catch (error) {
    console.error('Error in baby-names API route:', error);

    // Provide a detailed error response
    return NextResponse.json(
      {
        error: 'Failed to retrieve baby names',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
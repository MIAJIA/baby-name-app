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
  const excludeParam = searchParams.get('exclude');

  // 记录解析后的参数
  console.log(`[${new Date().toISOString()}] Parsed parameters:`, {
    gender,
    limitParam,
    startYearParam,
    endYearParam,
    offsetParam,
    excludeParam
  });

  const limit = limitParam ? parseInt(limitParam, 10) : 100;
  const startYear = startYearParam ? parseInt(startYearParam, 10) : 2013;
  const endYear = endYearParam ? parseInt(endYearParam, 10) : 2023;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
  
  // Parse exclude names if provided
  let excludeNames: string[] = [];
  if (excludeParam) {
    try {
      excludeNames = JSON.parse(excludeParam);
      console.log(`[${new Date().toISOString()}] Excluding ${excludeNames.length} names`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to parse exclude parameter:`, error);
    }
  }

  // Validate parameters
  if (!gender || (gender !== 'Male' && gender !== 'Female')) {
    return NextResponse.json({ error: 'Invalid gender parameter' }, { status: 400 });
  }

  console.log(`[${new Date().toISOString()}] Fetching baby names for ${gender}, year range: ${startYear}-${endYear}, limit: ${limit}, offset: ${offset}, excluding: ${excludeNames.length} names`);

  try {
    // 获取指定年份范围内的流行婴儿名字
    // 注意：这里我们请求更多的名字，以确保有足够的名字可以分页
    const allNames = await getPopularBabyNamesFromYearRange(startYear, endYear, 5000, gender);

    // Filter out excluded names if any
    const filteredNames = excludeNames.length > 0 
      ? allNames.filter(nameObj => !excludeNames.includes(nameObj.name))
      : allNames;

    // 应用偏移量并限制返回数量
    const paginatedNames = filteredNames.slice(offset, offset + limit);

    console.log(`[${new Date().toISOString()}] Returning ${paginatedNames.length} names (total available: ${filteredNames.length}, excluded: ${allNames.length - filteredNames.length})`);

    return NextResponse.json({
      names: paginatedNames,
      totalAvailable: filteredNames.length,
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
    const { gender, count, offset = 0, exclude = [] } = body;

    if (!gender || !['Male', 'Female'].includes(gender)) {
      return NextResponse.json(
        { error: "Invalid gender parameter. Must be 'Male' or 'Female'." },
        { status: 400 }
      );
    }

    console.log(`[${new Date().toISOString()}] POST request with: gender=${gender}, count=${count}, offset=${offset}, exclude=${exclude.length} names`);

    // Use a safe default if count is not provided or invalid
    const safeCount = typeof count === 'number' && count > 0 ? count : 1000;

    // Get baby names with proper error handling
    const allNames = await getPopularBabyNamesFromYearRange(2013, 2023, safeCount * 2, gender);
    
    // Filter out excluded names if any
    const filteredNames = exclude && exclude.length > 0 
      ? allNames.filter(nameObj => !exclude.includes(nameObj.name))
      : allNames;
    
    // Apply offset and limit
    const paginatedNames = filteredNames.slice(offset, offset + safeCount);
    
    console.log(`[${new Date().toISOString()}] Returning ${paginatedNames.length} names out of ${filteredNames.length} filtered names (excluded ${allNames.length - filteredNames.length})`);

    // Return the names
    return NextResponse.json({
      names: paginatedNames,
      totalAvailable: filteredNames.length,
      offset: offset,
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
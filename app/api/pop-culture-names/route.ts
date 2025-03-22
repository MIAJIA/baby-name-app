import { NextRequest, NextResponse } from 'next/server';
import { getPopCultureNames } from '@/lib/openai/popCultureNames';

export async function GET(request: NextRequest) {
  try {
    // Extract parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const gender = searchParams.get('gender') as 'Male' | 'Female';
    const skipParam = searchParams.get('skip');
    const limitParam = searchParams.get('limit');
    const excludeParam = searchParams.get('exclude');

    // Parse pagination parameters with defaults
    const skip = skipParam ? Number.parseInt(skipParam, 10) : 0;
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;
    
    // Parse exclude names if provided
    let excludeNames: string[] = [];
    if (excludeParam) {
      try {
        excludeNames = JSON.parse(decodeURIComponent(excludeParam));
        console.log(`[${new Date().toISOString()}] Excluding ${excludeNames.length} names`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to parse exclude parameter:`, error);
      }
    }

    if (!gender || (gender !== 'Male' && gender !== 'Female')) {
      return NextResponse.json(
        { error: 'Invalid gender parameter. Must be "Male" or "Female".' },
        { status: 400 }
      );
    }

    console.log(`[${new Date().toISOString()}] Fetching pop culture names for gender: ${gender}, skip: ${skip}, limit: ${limit}, excluding: ${excludeNames.length} names`);

    // Get all names first
    const allNames = await getPopCultureNames(gender);
    
    // Filter out excluded names if any
    const filteredNames = excludeNames.length > 0 
      ? allNames.filter(name => !excludeNames.includes(name))
      : allNames;
    
    // Apply pagination
    const paginatedNames = filteredNames.slice(skip, skip + limit);

    console.log(`[${new Date().toISOString()}] Retrieved ${paginatedNames.length} pop culture names (total after filtering: ${filteredNames.length}, excluded: ${allNames.length - filteredNames.length})`);

    return NextResponse.json({
      success: true,
      names: paginatedNames,
      count: paginatedNames.length,
      total: filteredNames.length,
      hasMore: skip + limit < filteredNames.length
    });
  } catch (error) {
    console.error('Error fetching pop culture names:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getPopCultureNames } from '@/lib/openai/popCultureNames';

export async function GET(request: NextRequest) {
  try {
    // 从 URL 参数中获取性别
    const searchParams = request.nextUrl.searchParams;
    const gender = searchParams.get('gender') as 'Male' | 'Female';

    if (!gender || (gender !== 'Male' && gender !== 'Female')) {
      return NextResponse.json(
        { error: 'Invalid gender parameter. Must be "Male" or "Female".' },
        { status: 400 }
      );
    }

    console.log(`[${new Date().toISOString()}] Fetching pop culture names for gender: ${gender}`);

    // 调用 getPopCultureNames 函数获取流行文化名字
    const names = await getPopCultureNames(gender);

    console.log(`[${new Date().toISOString()}] Retrieved ${names.length} pop culture names`);

    return NextResponse.json({
      success: true,
      names,
      count: names.length
    });
  } catch (error) {
    console.error('Error fetching pop culture names:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
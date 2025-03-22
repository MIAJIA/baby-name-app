import { NextRequest, NextResponse } from 'next/server';
import { getPopCultureNames } from '@/lib/openai/popCultureNames';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gender } = body;

    if (!gender || (gender !== 'Male' && gender !== 'Female')) {
      return NextResponse.json(
        { error: 'Valid gender (Male or Female) is required' },
        { status: 400 }
      );
    }

    const names = await getPopCultureNames(gender);

    return NextResponse.json({
      success: true,
      names,
      count: names.length,
      message: 'Pop culture names fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching pop culture names:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      message: 'Failed to fetch pop culture names'
    }, { status: 500 });
  }
}
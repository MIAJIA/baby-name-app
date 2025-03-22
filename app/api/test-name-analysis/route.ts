import { NextRequest, NextResponse } from 'next/server';
import { analyzeNameMatch } from '@/lib/name-analysis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'Emma';
    const gender = (searchParams.get('gender') as 'Male' | 'Female') || 'Female';
    const meaningTheme = searchParams.get('meaningTheme') || 'Strength and wisdom';
    const chineseMetaphysics = searchParams.get('chineseMetaphysics') || 'Water element dominant';

    console.log(`Testing name analysis for: ${name}`);

    const analysis = await analyzeNameMatch(
      name,
      gender,
      meaningTheme,
      chineseMetaphysics
    );

    return NextResponse.json({
      success: true,
      analysis,
      message: 'OpenAI API call successful!'
    });
  } catch (error) {
    console.error('Error testing name analysis:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      message: 'Failed to call OpenAI API'
    }, { status: 500 });
  }
}
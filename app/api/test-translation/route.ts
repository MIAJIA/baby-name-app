import { NextRequest, NextResponse } from 'next/server';
import { analyzeNameMatch } from '@/lib/name-analysis/index';

export async function GET(request: NextRequest) {
  try {
    const name = "Rowan";
    const gender = "Male";
    const meaningTheme = "tree";
    const chineseMetaphysics = "bazi";

    console.log(`Testing translation for name: ${name}`);

    const result = await analyzeNameMatch(name, gender, meaningTheme, chineseMetaphysics);

    console.log('Test result:', JSON.stringify(result, null, 2));
    console.log('Chinese translations:', JSON.stringify(result.chineseTranslations, null, 2));

    return NextResponse.json({
      success: true,
      result,
      hasTranslations: result.chineseTranslations && result.chineseTranslations.length > 0
    });
  } catch (error) {
    console.error('Error in test-translation:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { analyzeNameMatch } from '@/lib/name-analysis';
import { FavoriteNameItem } from '@/types/favorite-name-item';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { names, favoriteItems } = body;

    if (!names || !Array.isArray(names) || names.length === 0) {
      return NextResponse.json(
        { error: 'Invalid names array provided' },
        { status: 400 }
      );
    }

    console.log(`[${new Date().toISOString()}] Fetching details for ${names.length} favorite names`);

    // 处理 favoriteItems 数组，如果提供了的话
    const itemsMap = new Map<string, FavoriteNameItem>();
    if (favoriteItems && Array.isArray(favoriteItems)) {
      console.log(`[${new Date().toISOString()}] 收到的收藏项数量:`, favoriteItems.length);

      // 记录所有收藏项的详细信息
      console.log(`[${new Date().toISOString()}] 收藏项完整列表:`);
      favoriteItems.forEach((item, index) => {
        if (item) {
          console.log(`[${new Date().toISOString()}] 项目 ${index+1}:`, JSON.stringify(item));
        } else {
          console.log(`[${new Date().toISOString()}] 项目 ${index+1}: 无效项目`);
        }
      });

      favoriteItems.forEach(item => {
        if (item && item.name) {
          itemsMap.set(item.name, item);
          console.log(`[${new Date().toISOString()}] 设置收藏项: ${item.name}, ID: ${item.id}, 性别: ${item.gender}, 主题: "${item.meaningTheme || '无'}", 玄学: "${item.chineseMetaphysics || '无'}"`);
        }
      });
    }

    // 使用用户保存的搜索条件进行分析
    const details = await Promise.all(
      names.map(async (name) => {
        try {
          // 使用保存的搜索条件，如果有的话
          const item = itemsMap.get(name);

          if (item) {
            console.log(`[${new Date().toISOString()}] 找到 "${name}" 的收藏项: ID=${item.id}, 性别=${item.gender}, 主题="${item.meaningTheme}", 玄学="${item.chineseMetaphysics}"`);
          } else {
            console.log(`[${new Date().toISOString()}] 未找到 "${name}" 的收藏项，将使用默认值`);
          }

          const gender = item?.gender || 'Male';
          const meaningTheme = item?.meaningTheme || '';
          const chineseMetaphysics = item?.chineseMetaphysics || '';

          console.log(`[${new Date().toISOString()}] 分析 "${name}" 使用的条件: gender="${gender}", theme="${meaningTheme}", metaphysics="${chineseMetaphysics}"`);

          return await analyzeNameMatch(
            name,
            gender as 'Male' | 'Female',
            meaningTheme,
            chineseMetaphysics
          );
        } catch (error) {
          console.error(`Error analyzing name ${name}:`, error);
          // 返回基本对象而不是抛出错误
          return {
            name,
            overallMatch: false,
            summary: `Error retrieving details for ${name}`,
            chineseTranslations: [{ translation: name, explanation: 'Details unavailable' }],
            characterAnalysis: { matches: false, explanation: 'Details unavailable' },
            baziAnalysis: { matches: false, explanation: 'Details unavailable' },
            qiMenDunJiaAnalysis: { matches: false, explanation: 'Details unavailable' },
            fengShuiAnalysis: { matches: false, explanation: 'Details unavailable' },
            nameAnalysis: { matches: false, explanation: 'Details unavailable' },
            origin: "Unknown (error occurred)",
            meaning: "Unknown (error occurred)",
            culturalPsychologicalAnalysis: {
              matches: false,
              explanation: 'Details unavailable',
              historicalReferences: [],
              psychologicalImpact: "Unknown due to error"
            },
            literaryArtisticAnalysis: {
              matches: false,
              explanation: 'Details unavailable',
              literaryReferences: [],
              artisticConnections: []
            },
            linguisticAnalysis: {
              matches: false,
              explanation: 'Details unavailable',
              phonetics: "",
              pronunciationVariations: []
            },
            fiveElementAnalysis: {
              matches: false,
              explanation: 'Details unavailable',
              associatedElement: "Unknown"
            },
            numerologyAnalysis: {
              matches: false,
              explanation: 'Details unavailable',
              lifePathNumber: 0,
              personalityNumber: 0
            },
            astrologyAnalysis: {
              matches: false,
              explanation: 'Details unavailable',
              associatedZodiac: "Unknown",
              planetaryInfluence: "Unknown"
            },
            meaningMatchScore: 0,
            meaningMatchReason: 'Details unavailable',
            chineseMetaphysicsScore: 0,
            chineseMetaphysicsReason: 'Details unavailable'
          };
        }
      })
    );

    return NextResponse.json({
      details,
      count: details.length
    });
  } catch (error) {
    console.error('Error in name-details API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch name details', message: (error as Error).message },
      { status: 500 }
    );
  }
}
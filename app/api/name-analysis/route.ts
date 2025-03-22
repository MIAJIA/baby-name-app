import { NextRequest, NextResponse } from 'next/server';
import { analyzeNameMatch, prefilterNamesByMeaning } from '@/lib/name-analysis';
import { NameMatchAnalysis } from '@/types/name-analysis';
import { getCachedAnalysis, setCachedAnalysis } from '@/lib/cache/name-analysis-cache';

export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();
  console.log(`[${new Date().toISOString()}] Name analysis API request received`);

  try {
    const body = await request.json();
    const {
      name,
      names,
      gender,
      meaningTheme,
      chineseMetaphysics,
      targetMatches: rawTargetMatches = 10,
      usePrefiltering = true,
      prefilterBatchSize = 100,
      chineseTranslation
    } = body;

    // Validate and limit target match count
    const targetMatches = Math.min(Math.max(1, Number(rawTargetMatches) || 10), 50);

    // Log request parameters
    console.log(`[${new Date().toISOString()}] Request parameters:`, {
      singleName: name || 'not provided',
      batchSize: names?.length || 0,
      gender,
      meaningTheme: meaningTheme || 'not provided',
      chineseMetaphysics: chineseMetaphysics || 'not provided',
      chineseTranslation: chineseTranslation || 'not provided',
      targetMatches,
      rawTargetMatches,
      usePrefiltering
    });

    // If there's a single name, analyze it
    if (name) {
      console.log(`[${new Date().toISOString()}] Analyzing single name: ${name}`);
      // Check cache first
      const cachedResult = getCachedAnalysis(name, gender, meaningTheme, chineseMetaphysics);

      if (cachedResult) {
        console.log(`[${new Date().toISOString()}] Cache hit for name: ${name}`);

        // If user provided a Chinese translation, override the cached one
        if (chineseTranslation && cachedResult) {
          console.log(`[${new Date().toISOString()}] User provided Chinese translation: ${chineseTranslation}`);
          return NextResponse.json({
            analysis: {
              ...cachedResult,
              chineseTranslations: [
                {
                  translation: chineseTranslation,
                  explanation: `User-provided Chinese translation for "${name}".`
                },
                ...(cachedResult.chineseTranslations.length > 0 ? [cachedResult.chineseTranslations[0]] : [])
              ].filter((t, i, arr) => i === 0 || t.translation !== arr[0].translation) // Ensure no duplicates
            }
          });
        }

        return NextResponse.json({ analysis: cachedResult });
      }

      // Analyze the name
      const analysis = await analyzeNameMatch(name, gender, meaningTheme || '', chineseMetaphysics || '', chineseTranslation);

      // Cache the result
      setCachedAnalysis(name, gender, meaningTheme, chineseMetaphysics, analysis);

      return NextResponse.json({ analysis });
    }

    // For batch processing
    if (!names || !Array.isArray(names) || names.length === 0) {
      return NextResponse.json({
        error: 'Missing required parameter: either "name" for single analysis or "names" array for batch analysis'
      }, { status: 400 });
    }

    // Store analysis results
    const results: NameMatchAnalysis[] = [];
    let namesToAnalyze = [...names];

    // Check if user provided Chinese translations for batch processing
    const userChineseTranslations = body.chineseTranslations || {};
    const hasUserTranslations = Object.keys(userChineseTranslations).length > 0;

    if (hasUserTranslations) {
      console.log(`[${new Date().toISOString()}] Batch request includes ${Object.keys(userChineseTranslations).length} user-provided Chinese translations`);
    }

    // Check cache for batch results
    for (const nameItem of names) {
      const cachedResult = getCachedAnalysis(nameItem, gender, meaningTheme, chineseMetaphysics);
      if (cachedResult) {
        // If user provided a translation for this name, override the cached one
        if (hasUserTranslations && userChineseTranslations[nameItem]) {
          const userTranslation = userChineseTranslations[nameItem];
          console.log(`[${new Date().toISOString()}] Using user-provided translation for ${nameItem}: "${userTranslation}"`);

          results.push({
            ...cachedResult,
            chineseTranslations: [
              {
                translation: userTranslation,
                explanation: `User-provided Chinese translation for "${nameItem}".`
              },
              ...(cachedResult.chineseTranslations.length > 0 ? [cachedResult.chineseTranslations[0]] : [])
            ].filter((t, i, arr) => i === 0 || t.translation !== arr[0].translation) // Ensure no duplicates
          });
        } else {
          results.push(cachedResult);
        }
        // Remove from names to analyze
        namesToAnalyze = namesToAnalyze.filter(n => n !== nameItem);
      }
    }

    console.log(`[${new Date().toISOString()}] Cache hits: ${results.length}, Cache misses: ${namesToAnalyze.length}`);

    // 使用预过滤来减少需要分析的名字数量
    if (usePrefiltering && meaningTheme) {
      console.log(`[${new Date().toISOString()}] Using prefiltering with batch size ${prefilterBatchSize}`);
      console.log(`[${new Date().toISOString()}] Starting batch analysis with prefiltering for ${names.length} names`);
      console.log(`[${new Date().toISOString()}] Meaning theme: "${meaningTheme}", Chinese metaphysics: "${chineseMetaphysics || ''}"`);

      console.log(`[${new Date().toISOString()}] Prefiltering names based on meaning theme: "${meaningTheme}"`);
      namesToAnalyze = await prefilterNamesByMeaning(names, gender, meaningTheme, prefilterBatchSize);

      console.log(`[${new Date().toISOString()}] After prefiltering: ${namesToAnalyze.length} names to analyze`);

      // Make sure we include names with user translations even if they didn't pass prefiltering
      if (hasUserTranslations) {
        const translatedNames = Object.keys(userChineseTranslations);
        const missingTranslatedNames = translatedNames.filter(name =>
          names.includes(name) && !namesToAnalyze.includes(name)
        );

        if (missingTranslatedNames.length > 0) {
          console.log(`[${new Date().toISOString()}] Adding ${missingTranslatedNames.length} names with user translations that were filtered out`);
          namesToAnalyze = [...new Set([...namesToAnalyze, ...missingTranslatedNames])];
        }
      }
    }

    console.log(`[${new Date().toISOString()}] After prefiltering process: ${namesToAnalyze.length} names to analyze`);

    // 批量分析名字
    const batchStartTime = performance.now();
    console.log(`[${new Date().toISOString()}] [Batch #1] Starting batch analysis of ${namesToAnalyze.length} names`);
    console.log(`[${new Date().toISOString()}] [Batch #1] Names to analyze: ${namesToAnalyze.slice(0, 10).join(', ')}${namesToAnalyze.length > 10 ? '...' : ''}`);
    console.log(`[${new Date().toISOString()}] [Batch #1] Target matches: ${targetMatches}`);

    const analyses: NameMatchAnalysis[] = [];
    const matchingAnalyses: NameMatchAnalysis[] = [];

    // 将名字分成小批次进行分析，每批次3个名字
    const batchSize = 3;
    const batches = [];

    for (let i = 0; i < namesToAnalyze.length; i += batchSize) {
      batches.push(namesToAnalyze.slice(i, i + batchSize));
    }

    // 处理每个批次
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[${new Date().toISOString()}] [Batch #1] Processing batch ${i+1}/${batches.length}, names: ${batch.join(', ')}`);

      const batchStartTime = performance.now();

      // 并行分析批次中的每个名字
      const batchAnalyses = await Promise.all(
        batch.map(name => {
          // Use user-provided translation if available
          const userTranslation = hasUserTranslations ? userChineseTranslations[name] : undefined;
          return analyzeNameMatch(name, gender, meaningTheme || '', chineseMetaphysics || '', userTranslation);
        })
      );

      // 添加到分析结果
      analyses.push(...batchAnalyses);

      // 筛选匹配的名字
      const batchMatches = batchAnalyses.filter(analysis => analysis.overallMatch);
      matchingAnalyses.push(...batchMatches);

      const batchEndTime = performance.now();
      console.log(`[${new Date().toISOString()}] [Batch #1] Completed batch ${i+1}: ${batch.length} names in ${(batchEndTime - batchStartTime).toFixed(2)}ms (${analyses.length}/${namesToAnalyze.length} total, matches: ${matchingAnalyses.length}/${targetMatches})`);

      // 如果已经找到足够的匹配，可以提前结束
      if (matchingAnalyses.length >= targetMatches) {
        console.log(`[${new Date().toISOString()}] [Batch #1] Found ${matchingAnalyses.length} matching names, which meets or exceeds target of ${targetMatches}`);
        break;
      }

      // 如果还有更多批次要处理，等待一秒钟以避免API速率限制
      if (i < batches.length - 1) {
        console.log(`[${new Date().toISOString()}] [Batch #1] Waiting 1 second before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const batchEndTime = performance.now();
    console.log(`[${new Date().toISOString()}] [Batch #1] Batch analysis completed: ${analyses.length}/${namesToAnalyze.length} names in ${((batchEndTime - batchStartTime)/1000).toFixed(2)} seconds`);
    console.log(`[${new Date().toISOString()}] [Batch #1] Found ${matchingAnalyses.length} matching names out of ${analyses.length} analyzed`);
    console.log(`[${new Date().toISOString()}] [Batch #1] Average time per name: ${((batchEndTime - batchStartTime)/1000/analyses.length).toFixed(2)} seconds`);

    const requestEndTime = performance.now();
    console.log(`[${new Date().toISOString()}] Batch analysis completed in ${((requestEndTime - requestStartTime)/1000).toFixed(2)} seconds`);
    console.log(`[${new Date().toISOString()}] Matching names: ${matchingAnalyses.length}/${analyses.length}`);
    console.log(`[${new Date().toISOString()}] Total request time: ${((requestEndTime - requestStartTime)/1000).toFixed(2)} seconds`);

    // 如果没有找到足够的匹配，记录警告
    if (matchingAnalyses.length < targetMatches) {
      console.log(`[${new Date().toISOString()}] WARNING: Only found ${matchingAnalyses.length} matching names, which is less than the target of ${targetMatches}`);
      console.log(`[${new Date().toISOString()}] Consider expanding the search criteria or processing more names`);
    }

    console.log(`[${new Date().toISOString()}] Returning ${matchingAnalyses.length} matching analyses`);
    if (matchingAnalyses.length > 0) {
      // 检查第一个匹配结果是否包含所有必要字段
      const firstMatch = matchingAnalyses[0];
      console.log(`[${new Date().toISOString()}] First matching analysis:`, JSON.stringify(firstMatch, null, 2));
      console.log(`[${new Date().toISOString()}] First matching analysis name: ${firstMatch.name}`);
      console.log(`[${new Date().toISOString()}] First matching analysis has meaning: ${!!firstMatch.meaning}`);
      console.log(`[${new Date().toISOString()}] First matching analysis has origin: ${!!firstMatch.origin}`);
      console.log(`[${new Date().toISOString()}] First matching analysis has chineseTranslations: ${!!(firstMatch.chineseTranslations && firstMatch.chineseTranslations.length > 0)}`);
    }

    // 确保返回的数据不包含 null 或 undefined 值
    const validAnalyses = matchingAnalyses.filter(analysis => analysis !== null && analysis !== undefined);
    console.log(`[${new Date().toISOString()}] After filtering null/undefined: ${validAnalyses.length} analyses`);

    // 将新分析的结果存入缓存
    for (const analysis of validAnalyses) {
      setCachedAnalysis(analysis.name, gender, meaningTheme, chineseMetaphysics, analysis);
      results.push(analysis);
    }

    // 添加缓存使用总结日志
    const totalCacheHits = results.length - namesToAnalyze.length;
    const cacheHitRate = results.length > 0 ? (totalCacheHits / results.length * 100).toFixed(2) : '0';

    // 在批量分析部分添加日志
    console.log(`[${new Date().toISOString()}] Using optimized batch API processing with up to 5 names per API call`);

    // 修改 Cache 使用总结中添加新的指标
    const apiCallsWithoutBatching = namesToAnalyze.length;
    const apiCallsWithBatching = Math.ceil(namesToAnalyze.length / 5);
    const apiCallsSaved = apiCallsWithoutBatching - apiCallsWithBatching;

    console.log('\n=== CACHE USAGE SUMMARY ===');
    console.log(`[${new Date().toISOString()}] Total names processed: ${results.length}`);
    console.log(`[${new Date().toISOString()}] Cache hits: ${totalCacheHits} (${cacheHitRate}%)`);
    console.log(`[${new Date().toISOString()}] Cache misses: ${namesToAnalyze.length}`);
    console.log(`[${new Date().toISOString()}] API calls without batching: ${apiCallsWithoutBatching}`);
    console.log(`[${new Date().toISOString()}] API calls with batching: ${apiCallsWithBatching}`);
    console.log(`[${new Date().toISOString()}] Additional API calls saved by batching: ${apiCallsSaved}`);
    console.log(`[${new Date().toISOString()}] Total API calls saved: ${totalCacheHits + apiCallsSaved}`);
    console.log(`[${new Date().toISOString()}] Processing time: ${Math.round((performance.now() - requestStartTime) / 1000)} seconds`);
    console.log('=========================\n');

    return NextResponse.json({
      analyses: results,
      totalAnalyzed: namesToAnalyze.length + results.length
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error analyzing names:`, error);
    return NextResponse.json({
      error: (error as Error).message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { NameMatchAnalysis } from "@/types/name-analysis";
import { getCachedAnalysis, setCachedAnalysis, getSessionCacheStats } from '../cache/name-analysis-cache';
import { ZodInfer } from "../zod-wrapper";

// 使用标准 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  // Removed Helicone proxy service - directly using OpenAI API
});


let analysisCounter = 0;

/**
 * Helper function to log API call timing
 */
function logApiTiming(functionName: string, startTime: number, description: string = ''): void {
  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  const descText = description ? ` - ${description}` : '';
  console.log(`[${new Date().toISOString()}] [API Timing] ${functionName}${descText}: ${duration}s`);
}

/**
 * 分析名字是否符合用户标准
 */
export async function analyzeNameMatch(
  name: string,
  gender: 'Male' | 'Female',
  meaningTheme: string,
  chineseMetaphysics: string,
  userChineseTranslation?: string
): Promise<NameMatchAnalysis> {
  try {
    // 首先检查缓存
    const cachedResult = getCachedAnalysis(name, gender, meaningTheme, chineseMetaphysics);
    if (cachedResult) {
      console.log(`[${new Date().toISOString()}] [Cache Hit] Using cached analysis for "${name}" with criteria: ${gender}, "${meaningTheme.substring(0, 30)}...", "${chineseMetaphysics.substring(0, 30)}..."`);

      // If user provided a Chinese translation, override the cached one
      if (userChineseTranslation) {
        console.log(`[${new Date().toISOString()}] [Translation Override] Using user-provided Chinese translation: "${userChineseTranslation}"`);
        return {
          ...cachedResult,
          chineseTranslations: [
            {
              translation: userChineseTranslation,
              explanation: `User-provided Chinese translation for "${name}".`
            },
            ...(cachedResult.chineseTranslations.length > 0 ? [cachedResult.chineseTranslations[0]] : [])
          ]
        };
      }

      return cachedResult;
    }

    console.log(`[${new Date().toISOString()}] [Cache Miss] No cached data for "${name}" - performing new analysis`);
    console.log(`Analyzing name: ${name} for gender: ${gender}`);
    console.log(`Criteria - Meaning/Theme: ${meaningTheme}`);
    console.log(`Criteria - Chinese Metaphysics: ${chineseMetaphysics}`);
    if (userChineseTranslation) {
      console.log(`User-provided Chinese translation: ${userChineseTranslation}`);
    }

    analysisCounter++;
    const startTime = performance.now();

    // Add additional console logs
    console.log(`[${new Date().toISOString()}] Starting OpenAI request for name: ${name}`);

    try {
      // Prepare system message based on whether user provided a translation
      let systemMessage = "";

      if (userChineseTranslation) {
        systemMessage = `You are an expert in name analysis, specializing in cultural symbolism, psychology, literature, art, phonetics, and Chinese metaphysics. Your task is to analyze the given name based on the user's criteria and provide a structured, cross-cultural analysis. Your analysis must be comprehensive but concise, ensuring it aligns with cultural depth and psychological impact.

NOTE: The user has already provided a Chinese translation for this name: "${userChineseTranslation}". DO NOT generate new Chinese translations. Use ONLY this translation in your analysis.

Your response must follow the structured format below.`;
      } else {
        systemMessage = `You are an expert in name analysis, specializing in cultural symbolism, psychology, literature, art, phonetics, and Chinese metaphysics. Your task is to analyze the given name based on the user's criteria and provide a structured, cross-cultural analysis. Your analysis must be comprehensive but concise, ensuring it aligns with cultural depth and psychological impact.

CRITICAL REQUIREMENT: You MUST provide at least 2 Chinese translations of the name.
Each translation MUST include both the Chinese characters and an explanation of their meaning and pronunciation.

Your response must follow the structured format below.`;
      }

      // Prepare user message based on whether user provided a translation
      let contentRequirements = "";

      if (userChineseTranslation) {
        contentRequirements = `Your response must include:
1. Analysis of the provided Chinese Translation: "${userChineseTranslation}"
2. Cultural & Psychological Symbolism (historical figures, famous namesakes, psychological impact)
3. Literary & Artistic Relevance (appearance in literature, art, music, and media)
4. Phonetic & Linguistic Analysis (pronunciation across languages, phonetic appeal)
5. Chinese Metaphysics (Bazi, Qi Men Dun Jia, Feng Shui, Five Elements)
6. Western Numerology & Astrology (if applicable, numerology, planetary influences)`;
      } else {
        contentRequirements = `Your response must include:
1. Chinese Translations (at least two, with pronunciation and meaning)
2. Cultural & Psychological Symbolism (historical figures, famous namesakes, psychological impact)
3. Literary & Artistic Relevance (appearance in literature, art, music, and media)
4. Phonetic & Linguistic Analysis (pronunciation across languages, phonetic appeal)
5. Chinese Metaphysics (Bazi, Qi Men Dun Jia, Feng Shui, Five Elements)
6. Western Numerology & Astrology (if applicable, numerology, planetary influences)

MANDATORY REQUIREMENT: You MUST include at least 2 Chinese translations of the name in your response.
For each translation, you MUST provide:
1. The Chinese characters (translation)
2. An explanation of the meaning and pronunciation`;
      }

      const apiCallStart = performance.now();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            "role": "system",
            "content": systemMessage
          },
          {
            "role": "user",
            "content": `Analyze the name "${name}" (${gender}) based on these criteria:
            - Meaning/Theme desired: ${meaningTheme}
            - Chinese Metaphysics criteria: ${chineseMetaphysics}

            ${contentRequirements}

            For each category of analysis, provide a score on a scale of 1-10 (where 10 is the highest match) indicating how well the name fits the criteria.

            Please provide a JSON response with the following structure:
            {
              "name": "the name",
              "origin": "origin of the name",
              "meaning": "meaning of the name",
              "chineseTranslations": [
                { "translation": "${userChineseTranslation || '中文名1'}", "explanation": "explanation 1" }${userChineseTranslation ? '' : ',\n                { "translation": "中文名2", "explanation": "explanation 2" }'}
              ],
              "characterAnalysis": { "matches": true/false, "explanation": "...", "score": 0-10 },
              "nameAnalysis": { "matches": true/false, "explanation": "...", "score": 0-10 },
              "baziAnalysis": { "matches": true/false, "explanation": "...", "score": 0-10 },
              "qiMenDunJiaAnalysis": { "matches": true/false, "explanation": "...", "score": 0-10 },
              "fengShuiAnalysis": { "matches": true/false, "explanation": "...", "score": 0-10 },
              "culturalPsychologicalAnalysis": {
                "matches": true/false,
                "explanation": "...",
                "historicalReferences": ["..."],
                "psychologicalImpact": "...",
                "score": 0-10
              },
              "literaryArtisticAnalysis": {
                "matches": true/false,
                "explanation": "...",
                "literaryReferences": ["..."],
                "artisticConnections": ["..."],
                "score": 0-10
              },
              "linguisticAnalysis": {
                "matches": true/false,
                "explanation": "...",
                "phonetics": "...",
                "pronunciationVariations": ["..."],
                "score": 0-10
              },
              "fiveElementAnalysis": {
                "matches": true/false,
                "explanation": "...",
                "associatedElement": "...",
                "score": 0-10
              },
              "numerologyAnalysis": {
                "matches": true/false,
                "explanation": "...",
                "lifePathNumber": 0,
                "personalityNumber": 0,
                "score": 0-10
              },
              "astrologyAnalysis": {
                "matches": true/false,
                "explanation": "...",
                "associatedZodiac": "...",
                "planetaryInfluence": "...",
                "score": 0-10
              },
              "summary": "..."
            }`
          }
        ],
        temperature: 0.7,
      });
      logApiTiming('analyzeNameMatch', apiCallStart, name);

      console.log('API call successful!');
      console.log('Response status:', completion.choices[0].finish_reason);

      // Parse JSON response manually
      const content = completion.choices[0].message.content;
      console.log('Response content type:', typeof content);
      console.log('Response content length:', content ? content.length : 0);

      let parsedResponse = null;
      if (content) {
        try {
          // Check if the response is wrapped in markdown code blocks
          let jsonContent = content;

          // Extract JSON from markdown code blocks if present
          if (content.includes("```json") || content.includes("```")) {
            console.log('Detected markdown code block in response, extracting JSON...');
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch && jsonMatch[1]) {
              jsonContent = jsonMatch[1].trim();
              console.log('Extracted JSON content from markdown');
            }
          }

          parsedResponse = JSON.parse(jsonContent);
          console.log('Successfully parsed JSON response');

          // If user provided a translation, ensure it's used
          if (userChineseTranslation && parsedResponse) {
            // Make sure the user's translation is the first one
            const existingTranslations = parsedResponse.chineseTranslations || [];
            const userTranslationEntry = {
              translation: userChineseTranslation,
              explanation: existingTranslations.length > 0 && existingTranslations[0].translation === userChineseTranslation ?
                existingTranslations[0].explanation :
                `User-provided Chinese translation for "${name}".`
            };

            parsedResponse.chineseTranslations = [userTranslationEntry];

            // Only include a second translation if it's different from the user's
            if (existingTranslations.length > 1 && existingTranslations[1].translation !== userChineseTranslation) {
              parsedResponse.chineseTranslations.push(existingTranslations[1]);
            } else if (existingTranslations.length > 0 && existingTranslations[0].translation !== userChineseTranslation) {
              parsedResponse.chineseTranslations.push(existingTranslations[0]);
            }

            console.log(`[${new Date().toISOString()}] Ensured user-provided Chinese translation "${userChineseTranslation}" is used in the analysis`);
          }
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          console.log('First 500 chars of response:', content.substring(0, 500));
          console.log('Last 500 chars of response:', content.substring(content.length - 500));
        }
      }

      // Rest of the function remains the same
      let result = parsedResponse ? calculateOverallMatch(parsedResponse) : createDefaultAnalysis(name, `Failed to parse response for ${name}`);

      // One final check to ensure user translation is respected
      if (userChineseTranslation && result) {
        const hasUserTranslation = result.chineseTranslations.some(t => t.translation === userChineseTranslation);
        if (!hasUserTranslation) {
          console.log(`[${new Date().toISOString()}] Adding missing user-provided translation to final result`);
          result.chineseTranslations = [
            {
              translation: userChineseTranslation,
              explanation: `User-provided Chinese translation for "${name}".`
            },
            ...result.chineseTranslations.slice(0, 1)
          ];
        }
      }

      console.log('Final result with chineseTranslations:', result.chineseTranslations);

      // 将结果存入缓存
      setCachedAnalysis(name, gender, meaningTheme, chineseMetaphysics, result);

      return result;
    } catch (error) {
      console.error('OpenAI API error details:', error);
      // Existing error handling
      throw error;
    }
  } catch (error) {
    console.error('Error analyzing name:', error);

    // 创建一个默认的分析结果，包含中文翻译
    const defaultAnalysis: NameMatchAnalysis = {
      name,
      origin: "Unknown (error occurred)",
      meaning: "Unknown (error occurred)",
      chineseTranslations: userChineseTranslation ?
        [
          {
            translation: userChineseTranslation,
            explanation: `User-provided Chinese translation for "${name}".`
          },
          {
            translation: `${name}的中文翻译2`,
            explanation: `这是${name}的另一个默认中文翻译，因为分析过程中发生错误。`
          }
        ] :
        [
          {
            translation: `${name}的中文翻译1`,
            explanation: `这是${name}的默认中文翻译，因为分析过程中发生错误。`
          },
          {
            translation: `${name}的中文翻译2`,
            explanation: `这是${name}的另一个默认中文翻译，因为分析过程中发生错误。`
          }
        ],
      culturalPsychologicalAnalysis: {
        matches: false,
        explanation: `Error during analysis: ${(error as Error).message}`,
        historicalReferences: [],
        psychologicalImpact: "Unknown due to error"
      },
      literaryArtisticAnalysis: {
        matches: false,
        explanation: `Error during analysis: ${(error as Error).message}`,
        literaryReferences: [],
        artisticConnections: []
      },
      linguisticAnalysis: {
        matches: false,
        explanation: `Error during analysis: ${(error as Error).message}`,
        phonetics: "",
        pronunciationVariations: []
      },
      baziAnalysis: { matches: false, explanation: `Error during analysis: ${(error as Error).message}` },
      qiMenDunJiaAnalysis: { matches: false, explanation: `Error during analysis: ${(error as Error).message}` },
      fengShuiAnalysis: { matches: false, explanation: `Error during analysis: ${(error as Error).message}` },
      fiveElementAnalysis: {
        matches: false,
        explanation: `Error during analysis: ${(error as Error).message}`,
        associatedElement: "Unknown"
      },
      numerologyAnalysis: {
        matches: false,
        explanation: `Error during analysis: ${(error as Error).message}`,
        lifePathNumber: 0,
        personalityNumber: 0
      },
      astrologyAnalysis: {
        matches: false,
        explanation: `Error during analysis: ${(error as Error).message}`,
        associatedZodiac: "Unknown",
        planetaryInfluence: "Unknown"
      },
      summary: `Error occurred during analysis: ${(error as Error).message}`,
      overallMatch: false,
      meaningMatchScore: 0,
      meaningMatchReason: `Error during analysis: ${(error as Error).message}`,
      chineseMetaphysicsScore: 0,
      chineseMetaphysicsReason: "Error during analysis",
      characterAnalysis: {
        matches: false,
        explanation: `Error during analysis: ${(error as Error).message}`
      },
      nameAnalysis: {
        matches: false,
        explanation: `Error during analysis: ${(error as Error).message}`
      }
    };

    return defaultAnalysis;
  }
}

/**
 * 批量预处理名字，根据meaning主题进行初步筛选
 * @param names 要预处理的名字数组
 * @param gender 性别
 * @param meaningTheme 用户输入的meaning主题
 * @param batchSize 每批处理的名字数量
 * @returns 可能匹配meaning主题的名字数组
 */
export async function prefilterNamesByMeaning(
  names: string[],
  gender: 'Male' | 'Female',
  meaningTheme: string,
  batchSize = 100
): Promise<string[]> {
  if (!meaningTheme || meaningTheme.trim() === '') {
    console.log(`[${new Date().toISOString()}] No meaning theme provided, skipping prefiltering`);
    return names; // 如果没有提供meaning主题，则不进行预过滤
  }

  // 如果名字数量很少，直接返回所有名字
  if (names.length <= 20) {
    console.log(`[${new Date().toISOString()}] Only ${names.length} names provided, skipping prefiltering`);
    return names;
  }

  console.log(`[${new Date().toISOString()}] Starting name prefiltering for ${names.length} names based on meaning theme: "${meaningTheme}"`);
  const startTime = performance.now();

  // 将名字分成批次处理
  const batches = [];
  for (let i = 0; i < names.length; i += batchSize) {
    batches.push(names.slice(i, i + batchSize));
  }

  console.log(`[${new Date().toISOString()}] Split ${names.length} names into ${batches.length} batches of up to ${batchSize} names each`);

  const potentialMatches: string[] = [];

  // 增加处理的批次数量，以找到更多潜在匹配
  const maxBatchesToProcess = 5; // 增加到5个批次
  const batchesToProcess = Math.min(batches.length, maxBatchesToProcess);

  if (batches.length > maxBatchesToProcess) {
    console.log(`[${new Date().toISOString()}] Processing only the first ${batchesToProcess} batches out of ${batches.length} total batches`);
  }

  try {
    // 使用 OpenAI API 进行批量预过滤
    const apiCallStart = performance.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in name meanings and themes. Your task is to identify which names from a list might relate to a specific theme or meaning.`
        },
        {
          role: "user",
          content: `I have a list of ${names.length} names and I'm looking for names that relate to the theme: "${meaningTheme}".

          Please analyze the first ${batchesToProcess * batchSize} names from this list and return ONLY the names that might have meanings, origins, or associations related to "${meaningTheme}".

          Here are the names to analyze (first ${batchesToProcess} batches):
          ${batches.slice(0, batchesToProcess).flat().join(", ")}

          Return your response as a simple comma-separated list of ONLY the names that match the theme. Do not include any explanations or additional text.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    logApiTiming('prefilterNamesByMeaning', apiCallStart, `Filtered ${names.length} names`);

    const response = completion.choices[0].message.content;

    console.log(completion.choices[0].message);

    if (response) {
      // 解析响应中的名字列表
      const matchedNames = response.split(',').map((name: string) => name.trim()).filter(Boolean);

      // 添加到潜在匹配列表
      potentialMatches.push(...matchedNames);

      console.log(`[${new Date().toISOString()}] Prefiltering found ${matchedNames.length} potential matches from first ${batchesToProcess} batches`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error during prefiltering:`, error);
    // 如果预过滤失败，返回原始名字列表
    return names;
  }

  // 确保结果中只包含原始名字列表中的名字，并去重
  const filteredMatches = [...new Set(potentialMatches.filter(name => names.includes(name)))];

  // 如果找到的匹配太少，返回原始列表
  if (filteredMatches.length < 10) {
    console.log(`[${new Date().toISOString()}] Too few matches found (${filteredMatches.length}), returning original list`);
    return names;
  }

  const endTime = performance.now();
  console.log(`[${new Date().toISOString()}] Prefiltering completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
  console.log(`[${new Date().toISOString()}] Reduced list from ${names.length} to ${filteredMatches.length} potential matches`);

  return filteredMatches;
}

/**
 * 批量分析多个名字，减少 API 调用次数
 */
export async function analyzeNamesBatchApi(
  names: string[],
  gender: 'Male' | 'Female',
  meaningTheme: string,
  chineseMetaphysics: string,
  userChineseTranslations?: Record<string, string>
): Promise<NameMatchAnalysis[]> {
  if (names.length === 0) return [];

  console.log(`[${new Date().toISOString()}] [Batch API] Analyzing ${names.length} names in a single API call`);
  console.log(`[${new Date().toISOString()}] [Batch API] Names: ${names.join(', ')}`);

  if (userChineseTranslations && Object.keys(userChineseTranslations).length > 0) {
    console.log(`[${new Date().toISOString()}] [Batch API] User provided Chinese translations for ${Object.keys(userChineseTranslations).length} names`);
  }

  const apiStartTime = performance.now();
  try {
    // Prepare the system message based on whether there are user translations
    const hasUserTranslations = userChineseTranslations && Object.keys(userChineseTranslations).length > 0;

    let systemMessage = `You are an expert in name analysis, Chinese metaphysics, and cultural meanings of names.
    Analyze each of the provided names based on the user's criteria and provide a structured analysis.
    Your analysis should be thorough but concise, focusing on whether each name matches the user's criteria.`;

    if (hasUserTranslations) {
      systemMessage += `\n\nIMPORTANT: For some names, the user has already provided Chinese translations. DO NOT generate new translations for these names. Use ONLY the provided translations in your analysis.`;
    } else {
      systemMessage += `\n\nCRITICAL REQUIREMENT: For EACH name, you MUST provide at least 2 Chinese translations.
      Each translation MUST include both the Chinese characters and an explanation of their meaning and pronunciation.
      This is a mandatory part of your response and cannot be omitted under any circumstances.`;
    }

    // Prepare a list of names with their translations if provided
    let namesWithTranslations = '';
    if (hasUserTranslations) {
      namesWithTranslations = 'Names with user-provided Chinese translations:\n';
      names.forEach(name => {
        if (userChineseTranslations[name]) {
          namesWithTranslations += `- ${name}: "${userChineseTranslations[name]}"\n`;
        }
      });
    }

    const apiCallStart = performance.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: `Analyze the following names for a ${gender} baby based on these criteria:
          - Names to analyze: ${names.join(', ')}
          - Meaning/Theme desired: ${meaningTheme}
          - Chinese Metaphysics criteria: ${chineseMetaphysics}
          ${hasUserTranslations ? '\n' + namesWithTranslations : ''}

          Provide your analysis for EACH name in a structured JSON format that evaluates if the name matches the criteria.

          IMPORTANT: Return your response as a valid JSON array where each object in the array represents one name's analysis.

          For each name, include the following structure:
          {
            "name": "Name being analyzed",
            "characterAnalysis": { "matches": true/false, "explanation": "...", "score": 0-10 },
            "baziAnalysis": { "matches": true/false, "explanation": "...", "score": 0-10 },
            "qiMenDunJiaAnalysis": { "matches": true/false, "explanation": "...", "score": 0-10 },
            "fengShuiAnalysis": { "matches": true/false, "explanation": "...", "score": 0-10 },
            "nameAnalysis": { "matches": true/false, "explanation": "...", "score": 0-10 },
            "chineseTranslations": [
              { "translation": "中文名1", "explanation": "Explanation of meaning and pronunciation" },
              { "translation": "中文名2", "explanation": "Explanation of meaning and pronunciation" }
            ],
            "summary": "Overall summary of the name's match to criteria"
          }

          Return the results as a JSON array: [analysis1, analysis2, ...] without any additional text.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });
    logApiTiming('analyzeNamesBatchApi', apiCallStart, `Batch of ${names.length} names`);

    // 解析响应
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenAI API");
    }

    console.log(`[${new Date().toISOString()}] [Batch API] Received response for ${names.length} names`);

    try {
      const parsedResponse = JSON.parse(responseContent);

      if (!Array.isArray(parsedResponse.results)) {
        console.error(`[${new Date().toISOString()}] [Batch API] Invalid response format:`, responseContent);
        throw new Error("Invalid response format from OpenAI API");
      }

      // 处理每个名字的分析结果
      const nameAnalyses: NameMatchAnalysis[] = [];

      for (const analysis of parsedResponse.results) {
        if (!analysis || !analysis.name) {
          console.warn(`[${new Date().toISOString()}] [Batch API] Skipping invalid analysis entry`);
          continue;
        }

        // 确保包含必要的字段
        const processedAnalysis = ensureValidAnalysis(analysis);

        // If user provided a translation for this name, ensure it's used
        if (userChineseTranslations && userChineseTranslations[analysis.name]) {
          const userTranslation = userChineseTranslations[analysis.name];
          console.log(`[${new Date().toISOString()}] [Batch API] Using user-provided translation for ${analysis.name}: "${userTranslation}"`);

          // Ensure the user's translation is the first one
          const existingTranslations = processedAnalysis.chineseTranslations || [];
          processedAnalysis.chineseTranslations = [
            {
              translation: userTranslation,
              explanation: `User-provided Chinese translation for "${analysis.name}".`
            }
          ];

          // Add a second translation if available and different
          if (existingTranslations.length > 0 && existingTranslations[0].translation !== userTranslation) {
            processedAnalysis.chineseTranslations.push(existingTranslations[0]);
          } else if (existingTranslations.length > 1) {
            processedAnalysis.chineseTranslations.push(existingTranslations[1]);
          }
        }

        // 计算整体匹配度
        const finalAnalysis = calculateOverallMatch(processedAnalysis);

        // 将分析结果存入缓存
        setCachedAnalysis(
          finalAnalysis.name,
          gender,
          meaningTheme,
          chineseMetaphysics,
          finalAnalysis
        );

        nameAnalyses.push(finalAnalysis);
      }

      console.log(`[${new Date().toISOString()}] [Batch API] Successfully analyzed ${nameAnalyses.length} names in a single API call in ${((performance.now() - apiStartTime) / 1000).toFixed(2)}s`);
      return nameAnalyses;

    } catch (parseError) {
      console.error(`[${new Date().toISOString()}] [Batch API] Error parsing response:`, parseError);
      throw new Error(`Failed to parse API response: ${(parseError as Error).message}`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [Batch API] Error making batch request:`, error);
    const duration = ((performance.now() - apiStartTime) / 1000).toFixed(2);
    console.log(`[${new Date().toISOString()}] [API Timing] analyzeNamesBatchApi failed after ${duration}s`);

    // 生成默认分析结果
    return names.map(name => createDefaultAnalysis(
      name,
      `Error in batch API request: ${(error as Error).message}`,
      userChineseTranslations ? userChineseTranslations[name] : undefined
    ));
  }
}

/**
 * 确保分析结果包含所有必要字段
 */
function ensureValidAnalysis(analysis: any): any {
  // 检查必要的字段是否存在，如果不存在则添加默认值
  const name = analysis.name || "Unknown";

  const ensureAnalysisCategory = (category: any) => {
    if (!category || typeof category !== 'object') {
      return { matches: false, explanation: "No data available" };
    }
    return {
      matches: !!category.matches,
      explanation: category.explanation || "No explanation provided"
    };
  };

  // 确保中文翻译存在
  let chineseTranslations = [];
  if (!analysis.chineseTranslations || !Array.isArray(analysis.chineseTranslations) || analysis.chineseTranslations.length === 0) {
    chineseTranslations = [
      { translation: `${name}的中文翻译1`, explanation: `这是${name}的默认中文翻译` },
      { translation: `${name}的中文翻译2`, explanation: `这是${name}的另一个默认中文翻译` }
    ];
  } else {
    chineseTranslations = analysis.chineseTranslations.map((t: any) => ({
      translation: t.translation || `${name}的中文翻译`,
      explanation: t.explanation || "无解释"
    }));
  }

  return {
    name,
    characterAnalysis: ensureAnalysisCategory(analysis.characterAnalysis),
    baziAnalysis: ensureAnalysisCategory(analysis.baziAnalysis),
    qiMenDunJiaAnalysis: ensureAnalysisCategory(analysis.qiMenDunJiaAnalysis),
    fengShuiAnalysis: ensureAnalysisCategory(analysis.fengShuiAnalysis),
    nameAnalysis: ensureAnalysisCategory(analysis.nameAnalysis),
    chineseTranslations,
    summary: analysis.summary || "No summary provided",
    origin: analysis.origin || "Unknown",
    meaning: analysis.meaning || "Unknown",
  };
}

/**
 * 批量分析名字，支持缓存和API批处理
 */
export async function batchAnalyzeNames(
  names: string[],
  gender: 'Male' | 'Female',
  meaningTheme: string,
  chineseMetaphysics: string,
  batchSize = 5,
  targetMatches?: number,
  userChineseTranslations?: Record<string, string>
): Promise<NameMatchAnalysis[]> {
  console.log(`[${new Date().toISOString()}] Target matches: ${targetMatches || 'unlimited'}`);
  if (userChineseTranslations && Object.keys(userChineseTranslations).length > 0) {
    console.log(`[${new Date().toISOString()}] User provided ${Object.keys(userChineseTranslations).length} Chinese translations`);
  }

  const batchStartTime = performance.now();
  const batchId = ++analysisCounter;

  // 存储结果
  const results: NameMatchAnalysis[] = [];
  let matchCount = 0;

  // 首先检查缓存
  const cachedResults: NameMatchAnalysis[] = [];
  const namesToProcess: string[] = [];

  for (const name of names) {
    const cachedResult = getCachedAnalysis(name, gender, meaningTheme, chineseMetaphysics);
    if (cachedResult) {
      // If user provided a translation, override the cached one
      if (userChineseTranslations && userChineseTranslations[name]) {
        const userTranslation = userChineseTranslations[name];
        console.log(`[${new Date().toISOString()}] [Cache Hit] Overriding cached translation for "${name}" with user-provided: "${userTranslation}"`);

        const modifiedResult = {
          ...cachedResult,
          chineseTranslations: [
            {
              translation: userTranslation,
              explanation: `User-provided Chinese translation for "${name}".`
            },
            ...(cachedResult.chineseTranslations.length > 0 ? [cachedResult.chineseTranslations[0]] : [])
          ].filter((t, i, arr) => i === 0 || t.translation !== arr[0].translation) // Ensure no duplicates
        };

        cachedResults.push(modifiedResult);
        if (modifiedResult.overallMatch) {
          matchCount++;
        }
      } else {
        cachedResults.push(cachedResult);
        if (cachedResult.overallMatch) {
          matchCount++;
        }
      }
    } else {
      namesToProcess.push(name);
    }
  }

  console.log(`[${new Date().toISOString()}] [Batch #${batchId}] Found ${cachedResults.length} cached results (${matchCount} matches)`);
  results.push(...cachedResults);

  // 如果已经找到足够的匹配，或者没有需要处理的名字，就直接返回
  if ((targetMatches && matchCount >= targetMatches) || namesToProcess.length === 0) {
    console.log(`[${new Date().toISOString()}] [Batch #${batchId}] Already have ${matchCount} matches from cache, no further processing needed`);
    return results;
  }

  // 将剩余名字分成批次进行处理
  const apiBatchSize = 5; // 每个API调用处理的名字数量
  const batches = [];

  for (let i = 0; i < namesToProcess.length; i += apiBatchSize) {
    batches.push(namesToProcess.slice(i, i + apiBatchSize));
  }

  console.log(`[${new Date().toISOString()}] [Batch #${batchId}] Split ${namesToProcess.length} names into ${batches.length} API batches of up to ${apiBatchSize} names each`);

  // 处理每个批次
  let batchNumber = 1;
  for (const batch of batches) {
    // 如果已经找到足够的匹配，就停止处理
    if (targetMatches && matchCount >= targetMatches) {
      console.log(`[${new Date().toISOString()}] [Batch #${batchId}] Found ${matchCount} matches, which meets the target of ${targetMatches}. Stopping further processing.`);
      break;
    }

    console.log(`[${new Date().toISOString()}] [Batch #${batchId}] Processing API batch ${batchNumber}/${batches.length}, names: ${batch.join(', ')}`);

    try {
      const batchStartTime = performance.now();

      // Extract the relevant translations for this batch
      const batchTranslations = userChineseTranslations ?
        Object.keys(userChineseTranslations)
          .filter(name => batch.includes(name))
          .reduce((obj, name) => {
            obj[name] = userChineseTranslations[name];
            return obj;
          }, {} as Record<string, string>) :
        undefined;

      // 使用批量API处理这一批名字
      const batchResults = await analyzeNamesBatchApi(batch, gender, meaningTheme, chineseMetaphysics, batchTranslations);

      // 更新匹配计数
      const batchMatches = batchResults.filter(r => r.overallMatch).length;
      matchCount += batchMatches;

      results.push(...batchResults);

      const batchEndTime = performance.now();
      console.log(`[${new Date().toISOString()}] [Batch #${batchId}] Completed API batch ${batchNumber}: ${batch.length} names in ${((batchEndTime - batchStartTime)/1000).toFixed(2)} seconds (matches: ${batchMatches})`);

      // 添加延迟以避免速率限制
      if (batchNumber < batches.length && (!targetMatches || matchCount < targetMatches)) {
        console.log(`[${new Date().toISOString()}] [Batch #${batchId}] Waiting 1 second before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [Batch #${batchId}] Error processing API batch ${batchNumber}:`, error);

      // 在出错的情况下回退到单个处理
      console.log(`[${new Date().toISOString()}] [Batch #${batchId}] Falling back to individual processing for batch ${batchNumber}`);

      for (const name of batch) {
        if (targetMatches && matchCount >= targetMatches) break;

        try {
          const userTranslation = userChineseTranslations ? userChineseTranslations[name] : undefined;
          const analysis = await analyzeNameMatch(name, gender, meaningTheme, chineseMetaphysics, userTranslation);
          results.push(analysis);
          if (analysis.overallMatch) matchCount++;
        } catch (nameError) {
          console.error(`[${new Date().toISOString()}] [Batch #${batchId}] Error processing individual name ${name}:`, nameError);

          // 添加默认分析结果
          const userTranslation = userChineseTranslations ? userChineseTranslations[name] : undefined;
          const defaultAnalysis = createDefaultAnalysis(name, `Error: ${(nameError as Error).message}`, userTranslation);
          results.push(defaultAnalysis);
        }
      }
    }

    batchNumber++;
  }

  const batchEndTime = performance.now();
  const totalTimeSeconds = (batchEndTime - batchStartTime) / 1000;

  console.log(`[${new Date().toISOString()}] [Batch #${batchId}] Batch analysis completed: ${results.length} names in ${totalTimeSeconds.toFixed(2)} seconds`);
  console.log(`[${new Date().toISOString()}] [Batch #${batchId}] Found ${matchCount} matching names out of ${results.length} analyzed`);
  console.log(`[${new Date().toISOString()}] [Batch #${batchId}] Average time per name: ${(totalTimeSeconds / results.length).toFixed(2)} seconds`);

  const { hits, misses, hitRate } = getSessionCacheStats();
  console.log('\n--- BATCH ANALYSIS CACHE SUMMARY ---');
  console.log(`[${new Date().toISOString()}] Total batch requests: ${hits + misses}`);
  console.log(`[${new Date().toISOString()}] Cache hits in batch: ${hits}`);
  console.log(`[${new Date().toISOString()}] Cache hit rate: ${hitRate}`);
  console.log(`[${new Date().toISOString()}] Estimated API calls saved: ${hits} requests`);
  console.log('----------------------------------\n');

  // 确保结果数组中没有重复的名字
  const uniqueResults = Array.from(
    new Map(results.map(item => [item.name, item]))
  ).map(([_, value]) => value);

  return uniqueResults;
}

/**
 * 批量分析名字，支持预过滤
 */
export async function batchAnalyzeNamesWithPrefiltering(
  names: string[],
  gender: 'Male' | 'Female',
  meaningTheme: string,
  chineseMetaphysics: string,
  batchSize = 5,
  targetMatches?: number,
  usePrefiltering = true,
  userChineseTranslations?: Record<string, string>
): Promise<NameMatchAnalysis[]> {
  const totalStartTime = performance.now();
  console.log(`[${new Date().toISOString()}] Starting batch analysis with${usePrefiltering ? '' : 'out'} prefiltering for ${names.length} names`);
  if (userChineseTranslations && Object.keys(userChineseTranslations).length > 0) {
    console.log(`[${new Date().toISOString()}] User provided ${Object.keys(userChineseTranslations).length} Chinese translations`);
  }

  // 如果启用预过滤，先进行预过滤
  let namesToAnalyze = names;
  let prefilterTime = 0;

  if (usePrefiltering && names.length > 20) {
    const prefilterStartTime = performance.now();
    namesToAnalyze = await prefilterNamesByMeaning(names, gender, meaningTheme);
    prefilterTime = performance.now() - prefilterStartTime;
    console.log(`[${new Date().toISOString()}] [API Timing] Prefiltering step: ${(prefilterTime / 1000).toFixed(2)}s (reduced from ${names.length} to ${namesToAnalyze.length} names)`);

    // Make sure we include names with user translations even if they didn't pass prefiltering
    if (userChineseTranslations && Object.keys(userChineseTranslations).length > 0) {
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

  // 然后进行详细分析
  const analysisStartTime = performance.now();
  const results = await batchAnalyzeNames(namesToAnalyze, gender, meaningTheme, chineseMetaphysics, batchSize, targetMatches, userChineseTranslations);
  const analysisTime = performance.now() - analysisStartTime;

  const totalTime = performance.now() - totalStartTime;
  console.log(`[${new Date().toISOString()}] [API Timing] Complete analysis pipeline: ${(totalTime / 1000).toFixed(2)}s total`);
  console.log(`[${new Date().toISOString()}] [API Timing] --- Prefiltering: ${(prefilterTime / 1000).toFixed(2)}s (${(prefilterTime/totalTime*100).toFixed(1)}%)`);
  console.log(`[${new Date().toISOString()}] [API Timing] --- Detailed analysis: ${(analysisTime / 1000).toFixed(2)}s (${(analysisTime/totalTime*100).toFixed(1)}%)`);
  console.log(`[${new Date().toISOString()}] [API Timing] --- Average time per result: ${(totalTime / results.length / 1000).toFixed(2)}s`);

  return results;
}

/**
 * 计算名字是否符合标准
 */
function calculateOverallMatch(analysis: ZodInfer<typeof NameMatchAnalysisSchema> | null): NameMatchAnalysis {
  // 处理空值
  if (!analysis) {
    throw new Error("Analysis result is null or undefined");
  }

  // 检查是否有中文翻译，如果没有，添加一个默认的
  if (!analysis.chineseTranslations || analysis.chineseTranslations.length === 0) {
    console.warn(`No Chinese translations found for name: ${analysis.name}. Adding default translations.`);
    analysis.chineseTranslations = [
      {
        translation: `${analysis.name}的中文翻译1`,
        explanation: `这是${analysis.name}的默认中文翻译，因为API没有返回翻译。`
      },
      {
        translation: `${analysis.name}的中文翻译2`,
        explanation: `这是${analysis.name}的另一个默认中文翻译，因为API没有返回翻译。`
      }
    ];
  }

  // 计算整体匹配度（如果至少半数类别匹配则为true）
  const analysisFields = [
    analysis.culturalPsychologicalAnalysis?.matches,
    analysis.literaryArtisticAnalysis?.matches,
    analysis.linguisticAnalysis?.matches,
    analysis.baziAnalysis?.matches,
    analysis.qiMenDunJiaAnalysis?.matches,
    analysis.fengShuiAnalysis?.matches,
    analysis.fiveElementAnalysis?.matches,
    analysis.numerologyAnalysis?.matches,
    analysis.astrologyAnalysis?.matches
  ];

  // Count matches, filtering out undefined values
  const validFields = analysisFields.filter(match => match !== undefined);
  const matchCount = validFields.filter(Boolean).length;
  const threshold = Math.ceil(validFields.length / 2); // At least half should match

  // 添加整体匹配属性
  return {
    ...analysis,
    overallMatch: matchCount >= threshold,
    chineseTranslations: analysis.chineseTranslations
  };
}

// 导出 Zod schema 以便在其他地方使用
export const AnalysisCategory = z.object({
  matches: z.boolean(),
  explanation: z.string(),
  score: z.number().min(0).max(10).optional()
});

export const NameMatchAnalysisSchema = z.object({
  name: z.string(),
  origin: z.string().optional(),
  meaning: z.string().optional(),
  chineseTranslations: z.array(z.object({
    translation: z.string(),
    explanation: z.string()
  })),
  culturalPsychologicalAnalysis: z.object({
    matches: z.boolean(),
    explanation: z.string(),
    historicalReferences: z.array(z.string()).optional(),
    psychologicalImpact: z.string().optional(),
    score: z.number().min(0).max(10).optional()
  }).optional(),
  literaryArtisticAnalysis: z.object({
    matches: z.boolean(),
    explanation: z.string(),
    literaryReferences: z.array(z.string()).optional(),
    artisticConnections: z.array(z.string()).optional(),
    score: z.number().min(0).max(10).optional()
  }).optional(),
  linguisticAnalysis: z.object({
    matches: z.boolean(),
    explanation: z.string(),
    phonetics: z.string().optional(),
    pronunciationVariations: z.array(z.string()).optional(),
    score: z.number().min(0).max(10).optional()
  }).optional(),
  baziAnalysis: AnalysisCategory.optional(),
  qiMenDunJiaAnalysis: AnalysisCategory.optional(),
  fengShuiAnalysis: AnalysisCategory.optional(),
  fiveElementAnalysis: z.object({
    matches: z.boolean(),
    explanation: z.string(),
    associatedElement: z.string().optional(),
    score: z.number().min(0).max(10).optional()
  }).optional(),
  numerologyAnalysis: z.object({
    matches: z.boolean(),
    explanation: z.string(),
    lifePathNumber: z.number().optional(),
    personalityNumber: z.number().optional(),
    score: z.number().min(0).max(10).optional()
  }).optional(),
  astrologyAnalysis: z.object({
    matches: z.boolean(),
    explanation: z.string(),
    associatedZodiac: z.string().optional(),
    planetaryInfluence: z.string().optional(),
    score: z.number().min(0).max(10).optional()
  }).optional(),
  summary: z.string().optional(),
  characterAnalysis: z.object({
    matches: z.boolean(),
    explanation: z.string(),
    score: z.number().min(0).max(10).optional()
  }),
  nameAnalysis: z.object({
    matches: z.boolean(),
    explanation: z.string(),
    score: z.number().min(0).max(10).optional()
  })
});

function createDefaultAnalysis(name: string, errorMessage: string, userChineseTranslation?: string): NameMatchAnalysis {
  return {
    name,
    origin: "Unknown (error occurred)",
    meaning: "Unknown (error occurred)",
    chineseTranslations: userChineseTranslation ?
      [
        {
          translation: userChineseTranslation,
          explanation: `User-provided Chinese translation for "${name}".`
        },
        {
          translation: `${name}的中文翻译2`,
          explanation: `这是${name}的另一个默认中文翻译，因为分析过程中发生错误。`
        }
      ] :
      [
        {
          translation: `${name}的中文翻译1`,
          explanation: `这是${name}的默认中文翻译，因为分析过程中发生错误。`
        },
        {
          translation: `${name}的中文翻译2`,
          explanation: `这是${name}的另一个默认中文翻译，因为分析过程中发生错误。`
        }
      ],
    culturalPsychologicalAnalysis: {
      matches: false,
      explanation: errorMessage,
      historicalReferences: [],
      psychologicalImpact: "Unknown due to error",
      score: 0
    },
    literaryArtisticAnalysis: {
      matches: false,
      explanation: errorMessage,
      literaryReferences: [],
      artisticConnections: [],
      score: 0
    },
    linguisticAnalysis: {
      matches: false,
      explanation: errorMessage,
      phonetics: "",
      pronunciationVariations: [],
      score: 0
    },
    baziAnalysis: { matches: false, explanation: errorMessage, score: 0 },
    qiMenDunJiaAnalysis: { matches: false, explanation: errorMessage, score: 0 },
    fengShuiAnalysis: { matches: false, explanation: errorMessage, score: 0 },
    fiveElementAnalysis: {
      matches: false,
      explanation: errorMessage,
      associatedElement: "Unknown",
      score: 0
    },
    numerologyAnalysis: {
      matches: false,
      explanation: errorMessage,
      lifePathNumber: 0,
      personalityNumber: 0,
      score: 0
    },
    astrologyAnalysis: {
      matches: false,
      explanation: errorMessage,
      associatedZodiac: "Unknown",
      planetaryInfluence: "Unknown",
      score: 0
    },
    summary: errorMessage,
    overallMatch: false,
    meaningMatchScore: 0,
    meaningMatchReason: errorMessage,
    chineseMetaphysicsScore: 0,
    chineseMetaphysicsReason: "Error during analysis",
    characterAnalysis: {
      matches: false,
      explanation: errorMessage,
      score: 0
    },
    nameAnalysis: {
      matches: false,
      explanation: errorMessage,
      score: 0
    }
  };
}
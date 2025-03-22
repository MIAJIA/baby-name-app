import OpenAI from "openai";
import { z, ZodInfer } from "@/lib/zod-wrapper";
import { zodResponseFormat } from "openai/helpers/zod";

// Define the schema for name analysis results using Zod
const AnalysisCategory = z.object({
  matches: z.boolean(),
  explanation: z.string()
});

const NameMatchAnalysisSchema = z.object({
  name: z.string(),
  characterAnalysis: AnalysisCategory,
  baziAnalysis: AnalysisCategory,
  qiMenDunJiaAnalysis: AnalysisCategory,
  fengShuiAnalysis: AnalysisCategory,
  nameAnalysis: AnalysisCategory,
  summary: z.string()
});

// Export the type derived from the schema
export type NameMatchAnalysis = ZodInfer<typeof NameMatchAnalysisSchema> & {
  overallMatch: boolean;
};

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-your_openai_api_key_here',
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": process.env.HELICON_API_KEY || ''
  }
});

/**
 * Calculates if a name matches the criteria based on analysis results
 * @param analysis - The parsed analysis from OpenAI
 * @returns The analysis with overall match calculated
 */
function calculateOverallMatch(analysis: ZodInfer<typeof NameMatchAnalysisSchema> | null): NameMatchAnalysis {
  // Handle null case
  if (!analysis) {
    throw new Error("Analysis result is null or undefined");
  }

  // Calculate overall match (true if at least 3 categories match)
  const matchCount = [
    analysis.characterAnalysis.matches,
    analysis.baziAnalysis.matches,
    analysis.qiMenDunJiaAnalysis.matches,
    analysis.fengShuiAnalysis.matches,
    analysis.nameAnalysis.matches
  ].filter(Boolean).length;

  // Add the overall match property
  return {
    ...analysis,
    overallMatch: matchCount >= 3
  };
}

/**
 * Analyzes a name based on user criteria using OpenAI's structured output with Zod
 * @param name - The baby name to analyze
 * @param gender - The gender of the name (Male or Female)
 * @param meaningTheme - User's desired meaning or theme
 * @param chineseMetaphysics - User's Chinese metaphysics criteria
 * @returns Promise<NameMatchAnalysis> - Structured analysis of the name
 */
export async function analyzeNameMatch(
  name: string,
  gender: 'Male' | 'Female',
  meaningTheme: string,
  chineseMetaphysics: string
): Promise<NameMatchAnalysis> {
  try {
    console.log(`Analyzing name: ${name} for gender: ${gender}`);
    console.log(`Criteria - Meaning/Theme: ${meaningTheme}`);
    console.log(`Criteria - Chinese Metaphysics: ${chineseMetaphysics}`);

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in name analysis, Chinese metaphysics, and cultural meanings of names.
          Analyze the given name based on the user's criteria and provide a structured analysis.
          Your analysis should be thorough but concise, focusing on whether the name matches the user's criteria.`
        },
        {
          role: "user",
          content: `Analyze the name "${name}" (${gender}) based on these criteria:
          - Meaning/Theme desired: ${meaningTheme}
          - Chinese Metaphysics criteria: ${chineseMetaphysics}

          Provide your analysis in a structured format that evaluates if the name matches the criteria in each category.`
        }
      ],
      response_format: zodResponseFormat(NameMatchAnalysisSchema, "name_analysis")
    });

    // Get the parsed response and calculate overall match
    const parsedResponse = completion.choices[0].message.parsed;
    return calculateOverallMatch(parsedResponse);
  } catch (error) {
    console.error('Error analyzing name:', error);
    throw error;
  }
}

/**
 * Batch analyzes multiple names based on user criteria
 * @param names - Array of baby names to analyze
 * @param gender - The gender of the names
 * @param meaningTheme - User's desired meaning or theme
 * @param chineseMetaphysics - User's Chinese metaphysics criteria
 * @returns Promise<NameMatchAnalysis[]> - Array of name analyses
 */
export async function batchAnalyzeNames(
  names: string[],
  gender: 'Male' | 'Female',
  meaningTheme: string,
  chineseMetaphysics: string
): Promise<NameMatchAnalysis[]> {
  console.log(`Batch analyzing ${names.length} names`);

  // Process names in batches to avoid rate limiting
  const batchSize = 5;
  const results: NameMatchAnalysis[] = [];

  for (let i = 0; i < names.length; i += batchSize) {
    const batch = names.slice(i, i + batchSize);
    console.log(`Processing batch ${i/batchSize + 1}, names: ${batch.join(', ')}`);

    // Process each name in the batch concurrently
    const batchPromises = batch.map(name =>
      analyzeNameMatch(name, gender, meaningTheme, chineseMetaphysics)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < names.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
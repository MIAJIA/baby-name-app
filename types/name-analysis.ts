import { z, ZodInfer } from "@/lib/zod-wrapper";
import { AnalysisCategory, NameMatchAnalysisSchema } from "@/lib/name-analysis";

// 导出类型定义
export type AnalysisCategoryType = ZodInfer<typeof AnalysisCategory>;

// Define completely manually without using infer
export interface NameMatchAnalysis {
  name: string;
  overallMatch: boolean;
  origin?: string;  // 例如: Hebrew, English, Chinese
  meaning?: string; // 例如: "Son of the right hand"
  meaningMatchScore?: number;
  meaningMatchReason?: string;

  // **1️⃣ 确保Chinese Translations是首要参数**
  chineseTranslations: Array<{
    translation: string;
    explanation: string;
  }>;

  // Add the missing fields
  characterAnalysis: {
    matches: boolean;
    explanation: string;
    score?: number;
  };

  nameAnalysis: {
    matches: boolean;
    explanation: string;
    score?: number;
  };

  // **2️⃣ 文化象征 & 心理学**
  culturalPsychologicalAnalysis?: {
    matches: boolean;
    historicalReferences?: string[]; // 例如: ["Benjamin Franklin", "Biblical Benjamin"]
    psychologicalImpact?: string; // 例如: "This name is often associated with leadership and reliability."
    explanation: string;
    score?: number;
  };

  // **3️⃣ 文学 & 艺术**
  literaryArtisticAnalysis?: {
    matches: boolean;
    literaryReferences?: string[]; // 例如: ["The Curious Case of Benjamin Button"]
    artisticConnections?: string[]; // 例如: ["Benjamin Britten, English composer"]
    explanation: string;
    score?: number;
  };

  // **4️⃣ 语言学 & 语音分析**
  linguisticAnalysis?: {
    matches: boolean;
    phonetics?: string; // 例如: "ben-ja-min"
    pronunciationVariations?: string[]; // 例如: ["French: [bɑ̃.ʒa.mɛ̃]", "Spanish: Ben-ha-meen"]
    explanation: string;
    score?: number;
  };

  // **5️⃣ 东方文化分析**
  chineseMetaphysicsScore?: number;
  chineseMetaphysicsReason?: string;
  baziAnalysis?: {
    matches: boolean;
    explanation: string;
    score?: number;
  };
  qiMenDunJiaAnalysis?: {
    matches: boolean;
    explanation: string;
    score?: number;
  };
  fengShuiAnalysis?: {
    matches: boolean;
    explanation: string;
    score?: number;
  };
  fiveElementAnalysis?: {
    matches: boolean;
    associatedElement?: string; // 例如: "Wood"
    explanation: string;
    score?: number;
  };

  // **6️⃣ 西方数秘学 & 占星学**
  numerologyAnalysis?: {
    matches: boolean;
    lifePathNumber?: number;
    personalityNumber?: number;
    explanation: string;
    score?: number;
  };
  astrologyAnalysis?: {
    matches: boolean;
    associatedZodiac?: string; // 例如: "Capricorn, Leo"
    planetaryInfluence?: string; // 例如: "Jupiter"
    explanation: string;
    score?: number;
  };

  summary?: string;
}
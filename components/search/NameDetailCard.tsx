import React from 'react';
import { NameMatchAnalysis } from '@/types/name-analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface NameDetailCardProps {
  nameAnalysis: NameMatchAnalysis;
}

export default function NameDetailCard({ nameAnalysis }: NameDetailCardProps) {
  // Add improved debugging at the top of the component
  console.log(`NameDetailCard rendering for ${nameAnalysis?.name || 'unknown name'}`);
  console.log('Available analysis fields:', Object.keys(nameAnalysis || {}).filter(key => {
    const k = key as keyof NameMatchAnalysis;
    return nameAnalysis[k] &&
      typeof nameAnalysis[k] === 'object' &&
      'matches' in (nameAnalysis[k] as object);
  }));
  console.log('Has Chinese Translations:', Boolean(nameAnalysis?.chineseTranslations?.length));

  // Just use the actual data
  const analysisData = nameAnalysis;

  // 创建简单的进度条函数
  const renderProgressBar = (score: number) => {
    const percentage = score * 10;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-primary h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  // 渲染分析类别的函数
  const renderAnalysisCategory = (title: string, analysis: any) => {
    if (!analysis) return null;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium">{title}</h3>
          <span className={`px-2 py-1 rounded-md text-xs ${analysis.matches ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {analysis.matches ? 'Match' : 'No Match'}
          </span>
        </div>

        <p className="text-sm">{analysis.explanation}</p>

        {/* Display all specific fields in a grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {/* Check and render fields for all analysis types */}
          {analysis.historicalReferences?.length > 0 && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs font-medium">Historical References</p>
              <p className="text-xs">{analysis.historicalReferences.join(', ')}</p>
            </div>
          )}

          {analysis.psychologicalImpact && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs font-medium">Psychological Impact</p>
              <p className="text-xs">{analysis.psychologicalImpact}</p>
            </div>
          )}

          {analysis.literaryReferences?.length > 0 && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs font-medium">Literary References</p>
              <p className="text-xs">{analysis.literaryReferences.join(', ')}</p>
            </div>
          )}

          {analysis.artisticConnections?.length > 0 && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs font-medium">Artistic Connections</p>
              <p className="text-xs">{analysis.artisticConnections.join(', ')}</p>
            </div>
          )}

          {analysis.phonetics && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs font-medium">Phonetics</p>
              <p className="text-xs">{analysis.phonetics}</p>
            </div>
          )}

          {analysis.pronunciationVariations?.length > 0 && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs font-medium">Pronunciation Variations</p>
              <p className="text-xs">{analysis.pronunciationVariations.join(', ')}</p>
            </div>
          )}

          {analysis.lifePathNumber !== undefined && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs font-medium">Life Path Number</p>
              <p className="text-xs">{analysis.lifePathNumber}</p>
            </div>
          )}

          {analysis.personalityNumber !== undefined && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs font-medium">Personality Number</p>
              <p className="text-xs">{analysis.personalityNumber}</p>
            </div>
          )}

          {analysis.associatedZodiac && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs font-medium">Associated Zodiac</p>
              <p className="text-xs">{analysis.associatedZodiac}</p>
            </div>
          )}

          {analysis.planetaryInfluence && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs font-medium">Planetary Influence</p>
              <p className="text-xs">{analysis.planetaryInfluence}</p>
            </div>
          )}

          {analysis.associatedElement && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs font-medium">Associated Element</p>
              <p className="text-xs">{analysis.associatedElement}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // New helper function to render specific fields for each analysis type
  const renderSpecificAnalysisFields = (analysis: any) => {
    const fieldGroups = [];

    // Historical/Psychological references
    if (analysis.historicalReferences?.length > 0 || analysis.psychologicalImpact) {
      fieldGroups.push(
        <div key="historical" className="mt-2 border-t pt-2">
          {analysis.historicalReferences?.length > 0 && (
            <div className="mb-1">
              <span className="text-xs font-medium">Historical References: </span>
              <span className="text-xs">{analysis.historicalReferences.join(', ')}</span>
            </div>
          )}
          {analysis.psychologicalImpact && (
            <div>
              <span className="text-xs font-medium">Psychological Impact: </span>
              <span className="text-xs">{analysis.psychologicalImpact}</span>
            </div>
          )}
        </div>
      );
    }

    // Literary/Artistic references
    if (analysis.literaryReferences?.length > 0 || analysis.artisticConnections?.length > 0) {
      fieldGroups.push(
        <div key="literary" className="mt-2 border-t pt-2">
          {analysis.literaryReferences?.length > 0 && (
            <div className="mb-1">
              <span className="text-xs font-medium">Literary References: </span>
              <span className="text-xs">{analysis.literaryReferences.join(', ')}</span>
            </div>
          )}
          {analysis.artisticConnections?.length > 0 && (
            <div>
              <span className="text-xs font-medium">Artistic Connections: </span>
              <span className="text-xs">{analysis.artisticConnections.join(', ')}</span>
            </div>
          )}
        </div>
      );
    }

    // Phonetic information
    if (analysis.phonetics || analysis.pronunciationVariations?.length > 0) {
      fieldGroups.push(
        <div key="phonetic" className="mt-2 border-t pt-2">
          {analysis.phonetics && (
            <div className="mb-1">
              <span className="text-xs font-medium">Phonetics: </span>
              <span className="text-xs">{analysis.phonetics}</span>
            </div>
          )}
          {analysis.pronunciationVariations?.length > 0 && (
            <div>
              <span className="text-xs font-medium">Pronunciation Variations: </span>
              <span className="text-xs">{analysis.pronunciationVariations.join(', ')}</span>
            </div>
          )}
        </div>
      );
    }

    // Numerology
    if (analysis.lifePathNumber !== undefined || analysis.personalityNumber !== undefined) {
      fieldGroups.push(
        <div key="numerology" className="mt-2 border-t pt-2">
          {analysis.lifePathNumber !== undefined && (
            <div className="mb-1">
              <span className="text-xs font-medium">Life Path Number: </span>
              <span className="text-xs">{analysis.lifePathNumber}</span>
            </div>
          )}
          {analysis.personalityNumber !== undefined && (
            <div>
              <span className="text-xs font-medium">Personality Number: </span>
              <span className="text-xs">{analysis.personalityNumber}</span>
            </div>
          )}
        </div>
      );
    }

    // Astrology
    if (analysis.associatedZodiac || analysis.planetaryInfluence) {
      fieldGroups.push(
        <div key="astrology" className="mt-2 border-t pt-2">
          {analysis.associatedZodiac && (
            <div className="mb-1">
              <span className="text-xs font-medium">Associated Zodiac: </span>
              <span className="text-xs">{analysis.associatedZodiac}</span>
            </div>
          )}
          {analysis.planetaryInfluence && (
            <div>
              <span className="text-xs font-medium">Planetary Influence: </span>
              <span className="text-xs">{analysis.planetaryInfluence}</span>
            </div>
          )}
        </div>
      );
    }

    // Five Elements
    if (analysis.associatedElement) {
      fieldGroups.push(
        <div key="element" className="mt-2 border-t pt-2">
          <div>
            <span className="text-xs font-medium">Associated Element: </span>
            <span className="text-xs">{analysis.associatedElement}</span>
          </div>
        </div>
      );
    }

    return fieldGroups.length > 0 ? fieldGroups : null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{analysisData.name}</CardTitle>
          {analysisData.origin && <Badge variant="outline">{analysisData.origin}</Badge>}
        </div>
        {analysisData.meaning && <CardDescription>{analysisData.meaning}</CardDescription>}
      </CardHeader>

      <CardContent className="pt-6">
        <Tabs defaultValue="basic">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="chinese">Chinese Metaphysics</TabsTrigger>
            <TabsTrigger value="western">Western Analysis</TabsTrigger>
            <TabsTrigger value="cultural">Cultural Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* Basic name information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisData.origin && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">Origin</p>
                  <p className="text-sm">{analysisData.origin}</p>
                </div>
              )}

              {analysisData.meaning && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">Meaning</p>
                  <p className="text-sm">{analysisData.meaning}</p>
                </div>
              )}
            </div>

            {/* Score display sections */}
            <div className="space-y-3">
              {analysisData.meaningMatchScore !== undefined && (
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Meaning Match:</span>
                    <span className="font-medium">{Math.round(analysisData.meaningMatchScore * 100)}%</span>
                  </div>
                  {renderProgressBar(analysisData.meaningMatchScore)}
                  {analysisData.meaningMatchReason && (
                    <p className="text-sm text-gray-600">{analysisData.meaningMatchReason}</p>
                  )}
                </div>
              )}

              {analysisData.chineseMetaphysicsScore !== undefined && (
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Chinese Metaphysics Match:</span>
                    <span className="font-medium">{Math.round(analysisData.chineseMetaphysicsScore * 100)}%</span>
                  </div>
                  {renderProgressBar(analysisData.chineseMetaphysicsScore)}
                  {analysisData.chineseMetaphysicsReason && (
                    <p className="text-sm text-gray-600">{analysisData.chineseMetaphysicsReason}</p>
                  )}
                </div>
              )}
            </div>

            {/* Chinese Translations */}
            {analysisData.chineseTranslations && analysisData.chineseTranslations.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Chinese Translations</h3>
                <div className="space-y-2">
                  {analysisData.chineseTranslations.map((translation, index) => (
                    <div key={index} className="p-3 bg-muted rounded-md">
                      <p className="text-md font-medium">{translation.translation}</p>
                      <p className="text-sm text-muted-foreground">{translation.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {analysisData.summary && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Summary</h3>
                <p className="text-sm">{analysisData.summary}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chinese" className="space-y-4">
            {analysisData.chineseMetaphysicsScore !== undefined && (
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Chinese Metaphysics Match:</span>
                  <span className="font-medium">{analysisData.chineseMetaphysicsScore}/10</span>
                </div>
                {renderProgressBar(analysisData.chineseMetaphysicsScore)}
                <p className="text-sm text-gray-600">{analysisData.chineseMetaphysicsReason}</p>
              </div>
            )}

            <Accordion type="multiple" className="w-full">
              {analysisData.baziAnalysis && (
                <AccordionItem value="bazi">
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span>BaZi Analysis</span>
                      <span className={analysisData.baziAnalysis.matches ? "text-green-600" : "text-red-500"}>
                        {analysisData.baziAnalysis.matches ? "✓" : "✗"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderAnalysisCategory('BaZi Analysis', analysisData.baziAnalysis)}
                  </AccordionContent>
                </AccordionItem>
              )}

              {analysisData.qiMenDunJiaAnalysis && (
                <AccordionItem value="qimen">
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span>Qi Men Dun Jia Analysis</span>
                      <span className={analysisData.qiMenDunJiaAnalysis.matches ? "text-green-600" : "text-red-500"}>
                        {analysisData.qiMenDunJiaAnalysis.matches ? "✓" : "✗"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderAnalysisCategory('Qi Men Dun Jia Analysis', analysisData.qiMenDunJiaAnalysis)}
                  </AccordionContent>
                </AccordionItem>
              )}

              {analysisData.fengShuiAnalysis && (
                <AccordionItem value="fengshui">
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span>Feng Shui Analysis</span>
                      <span className={analysisData.fengShuiAnalysis.matches ? "text-green-600" : "text-red-500"}>
                        {analysisData.fengShuiAnalysis.matches ? "✓" : "✗"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderAnalysisCategory('Feng Shui Analysis', analysisData.fengShuiAnalysis)}
                  </AccordionContent>
                </AccordionItem>
              )}

              {analysisData.fiveElementAnalysis && (
                <AccordionItem value="fiveelements">
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span>Five Element Analysis</span>
                      <span className={analysisData.fiveElementAnalysis.matches ? "text-green-600" : "text-red-500"}>
                        {analysisData.fiveElementAnalysis.matches ? "✓" : "✗"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderAnalysisCategory('Five Element Analysis', analysisData.fiveElementAnalysis)}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </TabsContent>

          <TabsContent value="western" className="space-y-4">
            <Accordion type="multiple" className="w-full">
              {analysisData.numerologyAnalysis && (
                <AccordionItem value="numerology">
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span>Numerology Analysis</span>
                      <span className={analysisData.numerologyAnalysis.matches ? "text-green-600" : "text-red-500"}>
                        {analysisData.numerologyAnalysis.matches ? "✓" : "✗"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderAnalysisCategory('Numerology Analysis', analysisData.numerologyAnalysis)}
                  </AccordionContent>
                </AccordionItem>
              )}

              {analysisData.astrologyAnalysis && (
                <AccordionItem value="astrology">
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span>Astrology Analysis</span>
                      <span className={analysisData.astrologyAnalysis.matches ? "text-green-600" : "text-red-500"}>
                        {analysisData.astrologyAnalysis.matches ? "✓" : "✗"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderAnalysisCategory('Astrology Analysis', analysisData.astrologyAnalysis)}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </TabsContent>

          <TabsContent value="cultural" className="space-y-4">
            <Accordion type="multiple" className="w-full">
              {analysisData.characterAnalysis && (
                <AccordionItem value="character">
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span>Character Analysis</span>
                      <span className={analysisData.characterAnalysis.matches ? "text-green-600" : "text-red-500"}>
                        {analysisData.characterAnalysis.matches ? "✓" : "✗"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderAnalysisCategory('Character Analysis', analysisData.characterAnalysis)}
                  </AccordionContent>
                </AccordionItem>
              )}

              {analysisData.nameAnalysis && (
                <AccordionItem value="name">
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span>Name Analysis</span>
                      <span className={analysisData.nameAnalysis.matches ? "text-green-600" : "text-red-500"}>
                        {analysisData.nameAnalysis.matches ? "✓" : "✗"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderAnalysisCategory('Name Analysis', analysisData.nameAnalysis)}
                  </AccordionContent>
                </AccordionItem>
              )}

              {analysisData.linguisticAnalysis && (
                <AccordionItem value="linguistic">
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span>Linguistic Analysis</span>
                      <span className={analysisData.linguisticAnalysis.matches ? "text-green-600" : "text-red-500"}>
                        {analysisData.linguisticAnalysis.matches ? "✓" : "✗"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderAnalysisCategory('Linguistic Analysis', analysisData.linguisticAnalysis)}
                  </AccordionContent>
                </AccordionItem>
              )}

              {analysisData.culturalPsychologicalAnalysis && (
                <AccordionItem value="cultural">
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span>Cultural & Psychological Analysis</span>
                      <span className={analysisData.culturalPsychologicalAnalysis.matches ? "text-green-600" : "text-red-500"}>
                        {analysisData.culturalPsychologicalAnalysis.matches ? "✓" : "✗"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderAnalysisCategory('Cultural & Psychological Analysis', analysisData.culturalPsychologicalAnalysis)}
                  </AccordionContent>
                </AccordionItem>
              )}

              {analysisData.literaryArtisticAnalysis && (
                <AccordionItem value="literary">
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span>Literary & Artistic Analysis</span>
                      <span className={analysisData.literaryArtisticAnalysis.matches ? "text-green-600" : "text-red-500"}>
                        {analysisData.literaryArtisticAnalysis.matches ? "✓" : "✗"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderAnalysisCategory('Literary & Artistic Analysis', analysisData.literaryArtisticAnalysis)}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="pt-2 border-t">
        <div className="text-sm text-gray-500 w-full text-center">
          Overall Match:
          <span className={`font-semibold ${analysisData.overallMatch ? 'text-green-600' : 'text-red-600'}`}>
            {analysisData.overallMatch ? ' ✓' : ' ✗'}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
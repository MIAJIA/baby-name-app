import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NameMatchAnalysis } from '@/types/name-analysis';
import { Badge } from '@/components/ui/badge';
import { Check, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NameCardProps {
  nameData: NameMatchAnalysis;
  isFavorite: boolean;
  onToggleFavorite: (name: string) => void;
  onViewDetails: (name: string) => void;
  searchCriteria?: {
    gender: 'Male' | 'Female';
    meaningTheme: string;
    chineseMetaphysics: string;
  };
}

export default function NameCard({ nameData, isFavorite, onToggleFavorite, onViewDetails, searchCriteria }: NameCardProps) {
  // Add detailed null checks
  if (!nameData || typeof nameData !== 'object') {
    console.error('NameCard received invalid nameData:', nameData);
    return (
      <Card className="overflow-hidden border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Error: Invalid data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Name analysis data is invalid or missing</p>
        </CardContent>
      </Card>
    );
  }

  // 检查必要的字段是否存在
  if (!nameData.name) {
    console.error('NameCard received nameData without name property:', nameData);
    return (
      <Card className="overflow-hidden border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Error: Missing name</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Name analysis data is missing the name property</p>
        </CardContent>
      </Card>
    );
  }

  // 添加调试日志
  console.log('NameCard rendering for:', nameData.name);
  console.log('Name analysis data:', {
    name: nameData.name,
    meaning: nameData.meaning,
    origin: nameData.origin,
    meaningMatchScore: nameData.meaningMatchScore,
    chineseMetaphysicsScore: nameData.chineseMetaphysicsScore,
    hasChineseTranslations: nameData.chineseTranslations && nameData.chineseTranslations.length > 0
  });

  return (
    <Card className={`overflow-hidden ${nameData.overallMatch ? 'border-green-500' : 'border-gray-200'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{nameData.name}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log('🔄 Favorite button clicked for:', nameData.name);
                console.log('�� Current isFavorite prop value:', isFavorite);
                console.log('🔄 onToggleFavorite function exists?', !!onToggleFavorite);
                console.log('🔄 Type of onToggleFavorite:', typeof onToggleFavorite);
                if (onToggleFavorite) {
                  onToggleFavorite(nameData.name);
                } else {
                  console.error('🔄 ERROR: onToggleFavorite is undefined or null');
                }
              }}
              className="h-8 w-8 rounded-full"
            >
              {isFavorite ? (
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
            </Button>
          </div>
          {nameData.overallMatch !== undefined ? (
            nameData.overallMatch ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                <Check className="h-3 w-3 mr-1" /> Match
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                <X className="h-3 w-3 mr-1" /> No Match
              </Badge>
            )
          ) : null}
        </div>
        {nameData.origin && (
          <CardDescription>Origin: {nameData.origin}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {nameData.meaning && (
          <div className="mb-2">
            <p className="text-sm font-medium">Meaning:</p>
            <p className="text-sm">{nameData.meaning}</p>
          </div>
        )}

        {nameData.meaningMatchScore !== undefined && (
          <div className="mb-2">
            <p className="text-sm font-medium">Theme Match:</p>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div
                  className={`h-2.5 rounded-full ${nameData.meaningMatchScore >= 0.7 ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${nameData.meaningMatchScore * 100}%` }}
                ></div>
              </div>
              <span className="text-xs">{Math.round(nameData.meaningMatchScore * 100)}%</span>
            </div>
            {nameData.meaningMatchReason && (
              <p className="text-xs text-gray-600 mt-1">{nameData.meaningMatchReason}</p>
            )}
          </div>
        )}

        {nameData.chineseMetaphysicsScore !== undefined && (
          <div className="mb-2">
            <p className="text-sm font-medium">Chinese Metaphysics Match:</p>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div
                  className={`h-2.5 rounded-full ${nameData.chineseMetaphysicsScore >= 0.7 ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${nameData.chineseMetaphysicsScore * 100}%` }}
                ></div>
              </div>
              <span className="text-xs">{Math.round(nameData.chineseMetaphysicsScore * 100)}%</span>
            </div>
            {nameData.chineseMetaphysicsReason && (
              <p className="text-xs text-gray-600 mt-1">{nameData.chineseMetaphysicsReason}</p>
            )}
          </div>
        )}

        {nameData.chineseTranslations && nameData.chineseTranslations.length > 0 && (
          <div>
            <p className="text-sm font-medium">Chinese Translations:</p>
            <ul className="mt-1 space-y-1">
              {nameData.chineseTranslations.map((translation, index) => (
                <li key={index} className="text-sm">
                  <span className="font-semibold">{translation.translation}</span>
                  {translation.explanation && (
                    <span className="text-xs block text-gray-600">{translation.explanation}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Render all analysis results with a more comprehensive approach */}
        <div className="mt-4 space-y-4">
          {/* General Chinese Metaphysics Analyses */}
          {(
            ['baziAnalysis', 'qiMenDunJiaAnalysis', 'fengShuiAnalysis', 'fiveElementAnalysis'] as const
          ).some(field => nameData[field as keyof NameMatchAnalysis]) && (
            <div>
              <p className="text-sm font-semibold">Chinese Metaphysics:</p>
              <div className="space-y-2 mt-1">
                {(['baziAnalysis', 'qiMenDunJiaAnalysis', 'fengShuiAnalysis', 'fiveElementAnalysis'] as const).map(field => {
                  const analysisField = field as keyof NameMatchAnalysis;
                  const analysis = nameData[analysisField];

                  if (analysis && typeof analysis === 'object' && 'explanation' in analysis) {
                    return (
                      <div key={field} className="text-sm">
                        <span className="font-medium">{field.replace('Analysis', '')}: </span>
                        <span className={analysis.matches ? 'text-green-600' : 'text-red-600'}>
                          {analysis.matches ? '✓' : '✗'}
                        </span>
                        {field === 'fiveElementAnalysis' && 'associatedElement' in analysis && (
                          <span className="ml-1 text-gray-600">({analysis.associatedElement})</span>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Cultural and Linguistic Analyses */}
          {(
            ['characterAnalysis', 'nameAnalysis', 'culturalPsychologicalAnalysis', 'literaryArtisticAnalysis', 'linguisticAnalysis'] as const
          ).some(field => nameData[field as keyof NameMatchAnalysis]) && (
            <div>
              <p className="text-sm font-semibold">Character & Cultural Analysis:</p>
              <div className="space-y-2 mt-1">
                {(['characterAnalysis', 'nameAnalysis', 'culturalPsychologicalAnalysis', 'literaryArtisticAnalysis', 'linguisticAnalysis'] as const).map(field => {
                  const analysisField = field as keyof NameMatchAnalysis;
                  const analysis = nameData[analysisField];

                  if (analysis && typeof analysis === 'object' && 'explanation' in analysis) {
                    return (
                      <div key={field} className="text-sm">
                        <span className="font-medium">{field.replace('Analysis', '')}: </span>
                        <span className={analysis.matches ? 'text-green-600' : 'text-red-600'}>
                          {analysis.matches ? '✓' : '✗'}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Western Analyses */}
          {(
            ['numerologyAnalysis', 'astrologyAnalysis'] as const
          ).some(field => nameData[field as keyof NameMatchAnalysis]) && (
            <div>
              <p className="text-sm font-semibold">Western Analysis:</p>
              <div className="space-y-2 mt-1">
                {(['numerologyAnalysis', 'astrologyAnalysis'] as const).map(field => {
                  const analysisField = field as keyof NameMatchAnalysis;
                  const analysis = nameData[analysisField];

                  if (analysis && typeof analysis === 'object' && 'explanation' in analysis) {
                    let extraInfo = '';

                    if (field === 'numerologyAnalysis' && 'lifePathNumber' in analysis) {
                      extraInfo = `(Life Path: ${analysis.lifePathNumber})`;
                    } else if (field === 'astrologyAnalysis' && 'associatedZodiac' in analysis) {
                      extraInfo = `(${analysis.associatedZodiac})`;
                    }

                    return (
                      <div key={field} className="text-sm">
                        <span className="font-medium">{field.replace('Analysis', '')}: </span>
                        <span className={analysis.matches ? 'text-green-600' : 'text-red-600'}>
                          {analysis.matches ? '✓' : '✗'}
                        </span>
                        {extraInfo && <span className="ml-1 text-gray-600">{extraInfo}</span>}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>

        {searchCriteria && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Search Criteria:</p>
            <p className="text-xs text-gray-500">Gender: {searchCriteria.gender}</p>
            {searchCriteria.meaningTheme && (
              <p className="text-xs text-gray-500">Theme: "{searchCriteria.meaningTheme}"</p>
            )}
            {searchCriteria.chineseMetaphysics && (
              <p className="text-xs text-gray-500">Chinese Metaphysics: "{searchCriteria.chineseMetaphysics}"</p>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(nameData.name)}
            className="w-full"
          >
            View Full Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
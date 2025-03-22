'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import NameSourceSelector from './NameSourceSelector';

export interface SearchCriteria {
  gender: 'Male' | 'Female';
  meaningTheme: string;
  chineseMetaphysics: string;
  targetMatches: number;
  nameSource: 'ssa' | 'popCulture';
  usePrefiltering: boolean;
}

export interface ExtendedSearchCriteria extends SearchCriteria {
  prefilterBatchSize?: number;
}

interface SearchFormProps {
  onSearch: (criteria: ExtendedSearchCriteria) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    gender: 'Male',
    meaningTheme: 'open and positive',
    chineseMetaphysics: 'tree',
    targetMatches: 3,
    nameSource: 'ssa',
    usePrefiltering: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      gender: searchCriteria.gender,
      meaningTheme: searchCriteria.meaningTheme,
      chineseMetaphysics: searchCriteria.chineseMetaphysics,
      targetMatches: searchCriteria.targetMatches,
      nameSource: searchCriteria.nameSource,
      usePrefiltering: searchCriteria.usePrefiltering,
      prefilterBatchSize: 100
    });
  };

  // 处理目标匹配数量的输入变化
  const handleTargetMatchesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    // 确保值在 1-50 之间
    if (!isNaN(value)) {
      setSearchCriteria(prev => ({ ...prev, targetMatches: Math.min(Math.max(1, value), 50) }));
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="gender" className="block mb-2">Gender</Label>
              <RadioGroup
                id="gender"
                value={searchCriteria.gender}
                onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, gender: value as 'Male' | 'Female' }))}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="meaningTheme" className="block mb-2">Meaning Theme</Label>
              <Textarea
                id="meaningTheme"
                placeholder="Describe the meaning or theme you want for the name (e.g., strength, wisdom, nature)"
                value={searchCriteria.meaningTheme}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, meaningTheme: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="chineseMetaphysics" className="block mb-2">Chinese Metaphysics Criteria (Optional)</Label>
              <Textarea
                id="chineseMetaphysics"
                placeholder="Describe any Chinese metaphysics criteria (e.g., specific elements or numbers)"
                value={searchCriteria.chineseMetaphysics}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, chineseMetaphysics: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="targetMatches" className="block mb-2">Number of Names to Find</Label>
              <Input
                id="targetMatches"
                type="number"
                min="1"
                max="50"
                value={searchCriteria.targetMatches}
                onChange={handleTargetMatchesChange}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Enter a number between 1 and 50</p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="usePrefiltering"
                checked={searchCriteria.usePrefiltering}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, usePrefiltering: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="usePrefiltering">Use prefiltering (faster results)</Label>
            </div>

            <NameSourceSelector
              value={searchCriteria.nameSource || 'ssa'}
              onChange={(value) => setSearchCriteria(prev => ({ ...prev, nameSource: value as 'ssa' | 'popCulture' }))}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full mt-4">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              'Search Names'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
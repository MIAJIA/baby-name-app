'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import NameSourceSelector from './NameSourceSelector';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('SearchForm');
  const commonT = useTranslations('Common');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    gender: 'Male',
    meaningTheme: 'open and positive',
    chineseMetaphysics: 'tree',
    targetMatches: 2,
    nameSource: 'ssa',
    usePrefiltering: true
  });

  const handleSubmit = (e: FormEvent) => {
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
  const handleTargetMatchesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10);
    // 确保值在 1-50 之间
    if (!Number.isNaN(value)) {
      setSearchCriteria(prev => ({ ...prev, targetMatches: Math.min(Math.max(1, value), 50) }));
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="gender" className="block mb-2">{t('gender')}</Label>
              <RadioGroup
                id="gender"
                value={searchCriteria.gender}
                onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, gender: value as 'Male' | 'Female' }))}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">{t('male')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">{t('female')}</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="meaningTheme" className="block mb-2">{t('meaningTheme')}</Label>
              <Textarea
                id="meaningTheme"
                value={searchCriteria.meaningTheme}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, meaningTheme: e.target.value }))}
                placeholder={t('meaningThemePlaceholder')}
                className="h-24"
              />
            </div>

            <div>
              <Label htmlFor="chineseMetaphysics" className="block mb-2">{t('chineseElement')}</Label>
              <Input
                id="chineseMetaphysics"
                value={searchCriteria.chineseMetaphysics}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, chineseMetaphysics: e.target.value }))}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="nameSource" className="block mb-2">{t('nameSource')}</Label>
              <NameSourceSelector
                value={searchCriteria.nameSource}
                onChange={(value) => setSearchCriteria(prev => ({ ...prev, nameSource: value }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="usePrefiltering"
                checked={searchCriteria.usePrefiltering}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, usePrefiltering: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="usePrefiltering">{t('usePrefiltering')}</Label>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {commonT('loading')}
                </>
              ) : (
                t('search')
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
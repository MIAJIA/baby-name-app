import { useTranslations } from 'next-intl';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface NameSourceSelectorProps {
  value: 'ssa' | 'popCulture';
  onChange: (value: 'ssa' | 'popCulture') => void;
}

export default function NameSourceSelector({ value, onChange }: NameSourceSelectorProps) {
  const t = useTranslations('NameSourceSelector');
  const formT = useTranslations('SearchForm');

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{formT('nameSource')}</h3>
          <RadioGroup
            value={value}
            onValueChange={(val) => onChange(val as 'ssa' | 'popCulture')}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ssa" id="ssa" />
              <Label htmlFor="ssa" className="cursor-pointer">
                {t('ssaDatabase')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="popCulture" id="popCulture" />
              <Label htmlFor="popCulture" className="cursor-pointer">
                {t('popCulture')}
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
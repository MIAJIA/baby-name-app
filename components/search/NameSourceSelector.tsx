import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface NameSourceSelectorProps {
  value: 'ssa' | 'popCulture';
  onChange: (value: 'ssa' | 'popCulture') => void;
}

export default function NameSourceSelector({ value, onChange }: NameSourceSelectorProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Name Source</h3>
          <RadioGroup
            value={value}
            onValueChange={(val) => onChange(val as 'ssa' | 'popCulture')}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ssa" id="ssa" />
              <Label htmlFor="ssa" className="cursor-pointer">
                SSA Popular Names
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="popCulture" id="popCulture" />
              <Label htmlFor="popCulture" className="cursor-pointer">
                Pop Culture References
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
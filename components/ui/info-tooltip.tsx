import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  children: React.ReactNode;
}

export function InfoTooltip({ children }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 inline-block ml-1 text-gray-500 cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
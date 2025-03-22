import { CheckCircle, XCircle } from 'lucide-react';

interface AnalysisCategoryProps {
  title: string;
  matches: boolean;
  explanation: string;
}

export default function AnalysisCategory({ title, matches, explanation }: AnalysisCategoryProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-semibold">{title}</h3>
        <div className={`flex items-center ${matches ? 'text-green-600' : 'text-amber-600'}`}>
          {matches ? (
            <>
              <CheckCircle className="w-5 h-5 mr-1" />
              <span>Match</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 mr-1" />
              <span>Partial Match</span>
            </>
          )}
        </div>
      </div>
      <p className="text-gray-700">{explanation}</p>
    </div>
  );
}
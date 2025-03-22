import { CheckCircle, XCircle } from 'lucide-react';

interface AnalysisCategoryProps {
  title: string;
  matches: boolean;
  explanation: string;
  score?: number;
}

export default function AnalysisCategory({ title, matches, explanation, score }: AnalysisCategoryProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
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
          {score !== undefined && (
            <div className={`px-2 py-1 rounded-md text-xs font-medium ${getScoreColor(score)}`}>
              Score: {score}/10
            </div>
          )}
        </div>
      </div>
      <p className="text-gray-700">{explanation}</p>
    </div>
  );
}

// Helper function to determine the color based on the score
function getScoreColor(score: number): string {
  if (score >= 8) return 'bg-green-100 text-green-800';
  if (score >= 5) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}
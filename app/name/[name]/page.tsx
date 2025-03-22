'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { NameMatchAnalysis } from '@/types/name-analysis';
import NameDetailCard from '@/components/search/NameDetailCard';

// Define the TrendDataPoint interface locally rather than importing it
interface TrendDataPoint {
  year: number;
  name: string;
  gender: 'Male' | 'Female';
  rank: number | null;
  count: number;
}

export default function NameDetailPage() {
  const params = useParams();
  const name = params.name as string;

  const [nameData, setNameData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<NameMatchAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popularityData, setPopularityData] = useState<TrendDataPoint | null>(null);

  useEffect(() => {
    const fetchNameData = async () => {
      try {
        setIsLoading(true);

        // Fetch real data from your API
        const response = await fetch(`/api/name-analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            names: [name],
            gender: 'Unknown', // Or provide a default
            meaningTheme: '', // Empty or default value
            chineseMetaphysics: '', // Empty or default value
            maxResults: 1
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch name data');
        }

        const data = await response.json();

        // Get gender from the analysis data
        const detectedGender = data.analyses?.[0]?.gender ||
                              (data.analyses?.[0]?.nameAnalysis?.preferredGender) ||
                              'Unknown';

        // Fetch popularity data from the new API endpoint
        try {
          // Create URL with search parameters
          const url = new URL('/api/name-popularity', window.location.origin);
          url.searchParams.append('name', name);

          if (detectedGender !== 'Unknown') {
            url.searchParams.append('gender', detectedGender);
          }
          // Let the API find the most recent data
          // No longer specifying a year parameter to use the fallback mechanism

          const popResponse = await fetch(url);
          if (!popResponse.ok) {
            throw new Error('Failed to fetch popularity data');
          }

          const popData = await popResponse.json();
          const popularity = popData.data || [];

          // Use the most relevant data point (first one with a rank)
          const mostRecent = popularity.find((p: TrendDataPoint) => p.rank !== null) ||
                            (popularity.length > 0 ? popularity[0] : null);

          setPopularityData(mostRecent);

          // Set the actual name data with popularity information
          setNameData({
            name,
            gender: mostRecent?.gender || detectedGender,
            rank: mostRecent?.rank || 'Not ranked',
            year: mostRecent?.year || new Date().getFullYear() - 1,
            count: mostRecent?.count || 'Not available'
          });
        } catch (popError) {
          console.error('Error fetching popularity data:', popError);
          // Set default values if popularity data can't be fetched
          setNameData({
            name,
            gender: detectedGender,
            rank: 'Not ranked',
            year: new Date().getFullYear() - 1,
            count: 'Not available'
          });
        }

        // Set the real analysis with actual translations
        setAnalysis(data.analyses?.[0] || null);
      } catch (err) {
        setError('Failed to load name data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (name) {
      fetchNameData();
    }
  }, [name]);

  if (isLoading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  if (error || !nameData || !analysis) {
    return <div className="container mx-auto p-8">Error: {error || 'Name not found'}</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">{nameData.name}</h1>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Name Details</h2>
          <p><strong>Gender:</strong> {nameData.gender}</p>
          <p><strong>Popularity Rank:</strong> {typeof nameData.rank === 'number' ? `#${nameData.rank} in ${nameData.year}` : nameData.rank}</p>
          <p><strong>Number of Babies:</strong> {typeof nameData.count === 'number' ? nameData.count.toLocaleString() : nameData.count}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Quick Summary</h2>
          <div className="mb-2">
            <span className={`inline-block px-3 py-1 rounded ${analysis.overallMatch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {analysis.overallMatch ? 'Recommended' : 'Not Recommended'}
            </span>
          </div>
          <p>{analysis.summary}</p>
        </div>
      </div>

      {/* Use the comprehensive NameDetailCard component */}
      <NameDetailCard nameAnalysis={analysis} />

      <div className="flex space-x-4 mt-6">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Add to Favorites
        </button>
        <a href="/search" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
          Back to Search
        </a>
      </div>
    </div>
  );
}

function AnalysisCategory({
  title,
  matches,
  explanation
}: {
  title: string;
  matches: boolean;
  explanation: string;
}) {
  return (
    <div className="p-4 border rounded">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <span className={`inline-block px-2 py-1 rounded text-sm ${matches ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {matches ? 'Match' : 'No Match'}
        </span>
      </div>
      <p className="text-gray-700">{explanation}</p>
    </div>
  );
}
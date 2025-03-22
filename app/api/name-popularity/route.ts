import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

interface BabyNameRecord {
  name: string;
  gender: string;
  count: string;
}

interface TrendDataPoint {
  year: number;
  name: string;
  gender: 'Male' | 'Female';
  rank: number | null;
  count: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const gender = searchParams.get('gender') as 'Male' | 'Female' | null;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;

    if (!name) {
      return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
    }

    if (!gender || !['Male', 'Female'].includes(gender)) {
      // If no gender specified, try both
      const maleData = await findMostRecentNameData(name, 'Male', year);
      const femaleData = await findMostRecentNameData(name, 'Female', year);

      // Return non-null data or empty array
      const combinedData = [...maleData, ...femaleData].filter(item => item.rank !== null);
      return NextResponse.json({ data: combinedData });
    }

    const data = await findMostRecentNameData(name, gender, year);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching name popularity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch name popularity data', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// New function to find the most recent data available
async function findMostRecentNameData(
  name: string,
  gender: 'Male' | 'Female',
  startYear: number | null = null
): Promise<TrendDataPoint[]> {
  const currentYear = new Date().getFullYear();

  // Start from 2023 or the specified year (but not future years)
  const maxYear = Math.min(currentYear - 1, startYear || currentYear - 1);

  // Try each year, going backward until we find data
  const yearsToTry = [];
  for (let year = maxYear; year >= maxYear - 5; year--) {
    yearsToTry.push(year);
  }

  console.log(`Will try to find data for ${name} (${gender}) in years: ${yearsToTry.join(', ')}`);

  // Try each year until we find valid data with a rank
  for (const year of yearsToTry) {
    const data = await getNamePopularityData(name, gender, year);

    // Check if we found valid data with a rank
    if (data.length > 0 && data[0].rank !== null) {
      console.log(`Found valid data for ${name} (${gender}) in year ${year}`);
      return data;
    }

    console.log(`No valid ranking found for ${name} (${gender}) in year ${year}, trying earlier year`);
  }

  // If we didn't find any ranked data, return the data from the most recent year we tried
  const fallbackData = await getNamePopularityData(name, gender, yearsToTry[0]);
  console.log(`Returning fallback data from ${yearsToTry[0]} (without rank) for ${name} (${gender})`);
  return fallbackData;
}

async function getNamePopularityData(
  name: string,
  gender: 'Male' | 'Female',
  year: number | null = null
): Promise<TrendDataPoint[]> {
  const currentYear = new Date().getFullYear();
  const targetYear = year || currentYear - 1;
  const trendData: TrendDataPoint[] = [];

  // Use the existing data directory
  const dataDir = path.join(process.cwd(), 'data', 'names');

  console.log(`Looking for name popularity data in: ${dataDir}`);
  console.log(`Searching for: ${name}, Gender: ${gender}, Year: ${targetYear}`);

  const filename = `yob${targetYear}.txt`;
  const filePath = path.join(dataDir, filename);

  console.log(`Checking for file: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.log(`No data file found for year ${targetYear}`);
    trendData.push({
      year: targetYear,
      name,
      gender,
      rank: null,
      count: 0
    });
    return trendData;
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log(`Loaded file ${filename}, size: ${fileContent.length} bytes`);

    const records = parse(fileContent, {
      columns: ['name', 'gender', 'count'],
      skip_empty_lines: true
    }) as BabyNameRecord[];

    console.log(`Parsed ${records.length} records from file`);

    // Find the name in the records
    const genderCode = gender === 'Female' ? 'F' : 'M';
    const nameRecord = records.find(record =>
      record.name.toLowerCase() === name.toLowerCase() &&
      record.gender === genderCode
    );

    if (nameRecord) {
      console.log(`Found matching record for ${name}, gender: ${genderCode}`);

      // Calculate the rank
      const sameGenderRecords = records.filter(record => record.gender === genderCode);
      const sortedRecords = sameGenderRecords.sort((a, b) =>
        parseInt(b.count) - parseInt(a.count)
      );
      const rank = sortedRecords.findIndex(record =>
        record.name.toLowerCase() === name.toLowerCase()
      ) + 1;

      console.log(`Calculated rank: #${rank} with count: ${nameRecord.count}`);

      trendData.push({
        year: targetYear,
        name,
        gender,
        rank,
        count: parseInt(nameRecord.count)
      });
    } else {
      console.log(`No record found for ${name}, gender: ${genderCode}`);
      // Name not found for this year
      trendData.push({
        year: targetYear,
        name,
        gender,
        rank: null,
        count: 0
      });
    }

    return trendData;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    // Return empty data on error
    trendData.push({
      year: targetYear,
      name,
      gender,
      rank: null,
      count: 0
    });
    return trendData;
  }
}
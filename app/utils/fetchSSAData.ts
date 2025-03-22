import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

interface BabyNameRecord {
  name: string;
  gender: string;
  count: string;
}

export interface BabyName {
  name: string;
  gender: 'Male' | 'Female';
  count: number;
  rank: number;
  year: number;
}

export interface TrendDataPoint {
  year: number;
  name: string;
  gender: 'Male' | 'Female';
  rank: number | null;
  count: number;
}

/**
 * Gets popularity trend for a specific name over time
 * @param name - The name to get trends for
 * @param gender - 'Male' or 'Female'
 * @param startYear - Starting year for trend data
 * @param endYear - Ending year for trend data
 * @returns Array of yearly popularity data
 */
export async function getNamePopularityTrend(
  name: string,
  gender: 'Male' | 'Female',
  startYear: number = 1990,
  endYear: number | null = null
): Promise<TrendDataPoint[]> {
  const currentYear = new Date().getFullYear();
  const actualEndYear = endYear || currentYear - 1;

  try {
    const trendData: TrendDataPoint[] = [];

    // Use local files to get trend data instead of API calls
    const dataDir = '/Users/miajia/Documents/personal/ai project/data/names/';

    for (let year = startYear; year <= actualEndYear; year++) {
      const filename = `yob${year}.txt`;
      const filePath = path.join(dataDir, filename);

      if (!fs.existsSync(filePath)) {
        console.log(`No data file found for year ${year}`);
        trendData.push({
          year,
          name,
          gender,
          rank: null,
          count: 0
        });
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const records = parse(fileContent, {
        columns: ['name', 'gender', 'count'],
        skip_empty_lines: true
      }) as BabyNameRecord[];

      // Find the name in the records
      const genderCode = gender === 'Female' ? 'F' : 'M';
      const nameRecord = records.find(record =>
        record.name.toLowerCase() === name.toLowerCase() &&
        record.gender === genderCode
      );

      if (nameRecord) {
        // Calculate the rank
        const sameGenderRecords = records.filter(record => record.gender === genderCode);
        const sortedRecords = sameGenderRecords.sort((a, b) =>
          parseInt(b.count) - parseInt(a.count)
        );
        const rank = sortedRecords.findIndex(record =>
          record.name.toLowerCase() === name.toLowerCase()
        ) + 1;

        trendData.push({
          year,
          name,
          gender,
          rank,
          count: parseInt(nameRecord.count)
        });
      } else {
        // Name not found for this year
        trendData.push({
          year,
          name,
          gender,
          rank: null,
          count: 0
        });
      }
    }

    return trendData;
  } catch (error) {
    console.error('Error getting name popularity trend:', error);
    throw error;
  }
}

/**
 * Gets popular baby names from local data files
 * @param year - The year to fetch data for
 * @param limit - Number of top names to retrieve
 * @returns Array of popular baby names with rankings
 */
export async function getPopularBabyNamesFromFiles(
  year: number | null = null,
  limit: number = 1000
): Promise<BabyName[]> {
  try {
    // If no year specified, use the most recent available
    const currentYear = new Date().getFullYear();
    const targetYear = year || currentYear - 1;

    console.log(`Fetching popular baby names from files for year ${targetYear}, limit ${limit}`);

    // Path to the data directory
    const dataDir = '/Users/miajia/Documents/personal/ai project/data/names/';

    // Construct the filename - SSA files are typically named like "yob2022.txt"
    const filename = `yob${targetYear}.txt`;
    const filePath = path.join(dataDir, filename);

    console.log(`Looking for file: ${filePath}`);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return [];
    }

    // Read and parse the file
    // SSA files are CSV format with: name,gender,count
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log(`File loaded, size: ${fileContent.length} bytes`);

    const records = parse(fileContent, {
      columns: ['name', 'gender', 'count'],
      skip_empty_lines: true
    }) as BabyNameRecord[];

    console.log(`Parsed ${records.length} records from file`);

    // Process the data - calculate rankings for each gender
    const maleNames = records
      .filter(record => record.gender === 'M')
      .sort((a, b) => parseInt(b.count) - parseInt(a.count))
      .slice(0, limit)
      .map((record, index) => ({
        name: record.name,
        gender: 'Male' as const,
        count: parseInt(record.count),
        rank: index + 1,
        year: targetYear
      }));

    const femaleNames = records
      .filter(record => record.gender === 'F')
      .sort((a, b) => parseInt(b.count) - parseInt(a.count))
      .slice(0, limit)
      .map((record, index) => ({
        name: record.name,
        gender: 'Female' as const,
        count: parseInt(record.count),
        rank: index + 1,
        year: targetYear
      }));

    // Combine the results
    const names = [...maleNames, ...femaleNames];
    console.log(`Processed ${names.length} names (${maleNames.length} male, ${femaleNames.length} female)`);

    return names;
  } catch (error) {
    console.error('Error fetching baby names from files:', error);
    throw error;
  }
}
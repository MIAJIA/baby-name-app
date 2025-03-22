import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface BabyName {
  name: string;
  gender: 'Male' | 'Female';
  count: number;
  rank: number;
  year: number;
}

/**
 * Gets popular baby names from local data files across multiple years
 * @param startYear - The starting year to fetch data from
 * @param endYear - The ending year to fetch data from
 * @param gender - 'Male' or 'Female'
 * @param limit - Number of top names to retrieve
 * @returns Promise<BabyName[]> - Array of popular baby names with rankings
 */
export async function getPopularBabyNamesFromLastDecade(
  gender: 'Male' | 'Female',
  limit = 500,
  startYear = 2013,
  endYear = 2023
): Promise<BabyName[]> {
  try {
    console.log(`Fetching baby names from ${startYear} to ${endYear}, limit: ${limit}, gender: ${gender}`);

    // Map to store aggregated counts for each name
    const nameCountMap: Map<string, { totalCount: number, years: number[] }> = new Map();

    // Base directory for name files
    const dataDir = path.join(process.cwd(), 'data', 'names');

    // Process each year
    for (let year = startYear; year <= endYear; year++) {
      try {
        const filePath = path.join(dataDir, `yob${year}.txt`);
        console.log(`Looking for file: ${filePath}`);

        if (!fs.existsSync(filePath)) {
          console.log(`File not found: ${filePath}`);
          continue;
        }

        // Read and parse the file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = parse(fileContent, {
          columns: ['name', 'gender', 'count'],
          skip_empty_lines: true
        });

        // Filter by gender and accumulate counts
        for (const record of records) {
          const recordGender = record.gender === 'M' ? 'Male' : 'Female';
          if (recordGender === gender) {
            const name = record.name;
            const count = parseInt(record.count, 10);

            if (nameCountMap.has(name)) {
              const data = nameCountMap.get(name)!;
              data.totalCount += count;
              data.years.push(year);
            } else {
              nameCountMap.set(name, { totalCount: count, years: [year] });
            }
          }
        }
      } catch (error) {
        console.error(`Error processing year ${year}:`, error);
      }
    }

    // Convert map to array and sort by total count
    const namesArray: BabyName[] = Array.from(nameCountMap.entries())
      .map(([name, data]) => ({
        name,
        gender,
        count: data.totalCount,
        rank: 0, // Will be assigned after sorting
        year: Math.max(...data.years) // Use the most recent year the name appeared
      }))
      .sort((a, b) => b.count - a.count);

    // Assign ranks
    namesArray.forEach((name, index) => {
      name.rank = index + 1;
    });

    // Return top names up to the limit
    return namesArray.slice(0, limit);
  } catch (error) {
    console.error('Error fetching baby names from files:', error);
    throw error;
  }
}

// Keep the original function for backward compatibility
export async function getPopularBabyNamesFromFiles(
  year: number | null = null,
  gender: 'Male' | 'Female',
  limit = 1000
): Promise<BabyName[]> {
  try {
    console.log(`Fetching baby names for year: ${year}, limit: ${limit}, gender: ${gender}`);

    // If no year specified, use the most recent available (2023)
    const targetYear = year || 2023;

    // Path to the data directory
    const dataDir = path.join(process.cwd(), 'data', 'names');
    const filePath = path.join(dataDir, `yob${targetYear}.txt`);

    console.log(`Looking for file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      throw new Error(`Baby names data file for year ${targetYear} not found`);
    }

    // Read and parse the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: ['name', 'gender', 'count'],
      skip_empty_lines: true
    });

    // Filter by gender and convert to our format
    const filteredNames = records
      .filter((record: any) => {
        return (record.gender === 'M' && gender === 'Male') ||
               (record.gender === 'F' && gender === 'Female');
      })
      .map((record: any, index: number) => ({
        name: record.name,
        gender,
        count: parseInt(record.count, 10),
        rank: index + 1,
        year: targetYear
      }));

    // Return top names up to the limit
    return filteredNames.slice(0, limit);
  } catch (error) {
    console.error('Error fetching baby names from files:', error);
    throw error;
  }
}

/**
 * Gets popular baby names with streaming support
 * @param gender - 'Male' or 'Female'
 * @param limit - Number of top names to retrieve
 * @param startYear - The starting year to fetch data from
 * @param endYear - The ending year to fetch data from
 * @param onProgress - Callback function to receive names as they're processed
 * @returns Promise<BabyName[]> - Complete array of baby names
 */
export async function getPopularBabyNamesStreaming(
  gender: 'Male' | 'Female',
  limit = 500,
  startYear = 2013,
  endYear = 2023,
  onProgress?: (names: BabyName[]) => void
): Promise<BabyName[]> {
  try {
    console.log(`Streaming baby names from ${startYear} to ${endYear}, limit: ${limit}, gender: ${gender}`);

    // Map to store aggregated counts for each name
    const nameCountMap: Map<string, { totalCount: number, years: number[] }> = new Map();

    // Base directory for name files
    const dataDir = path.join(process.cwd(), 'data', 'names');

    // Process each year
    for (let year = endYear; year >= startYear; year--) {
      try {
        const filePath = path.join(dataDir, `yob${year}.txt`);
        console.log(`Looking for file: ${filePath}`);

        if (!fs.existsSync(filePath)) {
          console.log(`File not found: ${filePath}`);
          continue;
        }

        // Read and parse the file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = parse(fileContent, {
          columns: ['name', 'gender', 'count'],
          skip_empty_lines: true
        });

        // Filter by gender and accumulate counts
        for (const record of records) {
          const recordGender = record.gender === 'M' ? 'Male' : 'Female';
          if (recordGender === gender) {
            const name = record.name;
            const count = parseInt(record.count, 10);

            if (nameCountMap.has(name)) {
              const data = nameCountMap.get(name)!;
              data.totalCount += count;
              data.years.push(year);
            } else {
              nameCountMap.set(name, { totalCount: count, years: [year] });
            }
          }
        }

        // After each year, send a progress update with current top names
        if (onProgress) {
          const currentNames = Array.from(nameCountMap.entries())
            .map(([name, data]) => ({
              name,
              gender,
              count: data.totalCount,
              rank: 0, // Temporary rank
              year: Math.max(...data.years)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

          // Assign temporary ranks
          currentNames.forEach((name, index) => {
            name.rank = index + 1;
          });

          onProgress(currentNames);
        }

        // Early termination if we have enough names and user only wants a small number
        if (limit <= 20 && nameCountMap.size >= limit * 10) {
          console.log(`Early termination: Found ${nameCountMap.size} names, which is enough for limit ${limit}`);
          break;
        }
      } catch (error) {
        console.error(`Error processing year ${year}:`, error);
      }
    }

    // Final processing - convert map to array and sort by total count
    const namesArray: BabyName[] = Array.from(nameCountMap.entries())
      .map(([name, data]) => ({
        name,
        gender,
        count: data.totalCount,
        rank: 0, // Will be assigned after sorting
        year: Math.max(...data.years)
      }))
      .sort((a, b) => b.count - a.count);

    // Assign ranks
    namesArray.forEach((name, index) => {
      name.rank = index + 1;
    });

    // Return top names up to the limit
    return namesArray.slice(0, limit);
  } catch (error) {
    console.error('Error fetching baby names with streaming:', error);
    throw error;
  }
}
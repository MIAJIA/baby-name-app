import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

/**
 * 从本地文件获取流行婴儿名字，从最近年份开始
 * @param year - 获取数据的年份，如果为null则使用可用的最近年份
 * @param limit - 获取的名字数量
 * @returns 流行婴儿名字数组
 */
export async function getPopularBabyNamesFromFiles(year: number | null = null, limit = 1000) {
  const functionStartTime = performance.now();
  console.log(`[${new Date().toISOString()}] [PERFORMANCE] Starting getPopularBabyNamesFromFiles`);

  try {
    // 如果未指定年份，使用最近可用的年份
    const currentYear = new Date().getFullYear();
    const targetYear = year || currentYear - 1;

    console.log(`[${new Date().toISOString()}] Fetching popular baby names from files for year ${targetYear}, limit ${limit}`);

    // 数据目录路径
    const dataDir = path.join(process.cwd(), 'data/names');

    // 构建文件名 - SSA 文件通常命名为 "yob2022.txt"
    const filename = `yob${targetYear}.txt`;
    const filePath = path.join(dataDir, filename);

    console.log(`[${new Date().toISOString()}] Looking for file: ${filePath}`);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`[${new Date().toISOString()}] File not found: ${filePath}`);
      return [];
    }

    // 读取文件内容
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // 手动解析CSV内容，避免使用csv-parse库的异步问题
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    const parsedRecords = lines.map(line => {
      const [name, gender, countStr] = line.split(',');
      return {
        name,
        gender,
        count: parseInt(countStr, 10)
      };
    });

    // 分别处理男性和女性名字
    const maleNames = parsedRecords
      .filter(record => record.gender === 'M')
      .map(record => ({
        name: record.name,
        gender: 'Male',
        count: record.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    const femaleNames = parsedRecords
      .filter(record => record.gender === 'F')
      .map(record => ({
        name: record.name,
        gender: 'Female',
        count: record.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    const allNames = [...maleNames, ...femaleNames];

    const functionEndTime = performance.now();
    console.log(`[${new Date().toISOString()}] [PERFORMANCE] getPopularBabyNamesFromFiles completed in ${(functionEndTime - functionStartTime).toFixed(2)}ms`);
    console.log(`[${new Date().toISOString()}] Found ${maleNames.length} male names and ${femaleNames.length} female names for year ${targetYear}`);

    return allNames;
  } catch (error) {
    const functionEndTime = performance.now();
    console.error(`[${new Date().toISOString()}] Error fetching baby names from files:`, error);
    console.log(`[${new Date().toISOString()}] [PERFORMANCE] getPopularBabyNamesFromFiles failed after ${(functionEndTime - functionStartTime).toFixed(2)}ms`);
    return [];
  }
}

/**
 * 从多个年份获取流行婴儿名字，从最近年份开始
 * @param startYear - 开始年份
 * @param endYear - 结束年份
 * @param limit - 每个年份获取的名字数量
 * @param gender - 性别过滤
 * @returns 流行婴儿名字数组
 */
export async function getPopularBabyNamesFromYearRange(startYear: number, endYear: number, limit = 1000, gender?: 'Male' | 'Female') {
  console.log(`[${new Date().toISOString()}] Fetching popular baby names from year range ${startYear}-${endYear}, limit ${limit}, gender: ${gender || 'All'}`);

  // 确保年份范围有效
  const validStartYear = Math.max(1880, startYear); // SSA数据从1880年开始
  const currentYear = new Date().getFullYear();
  const validEndYear = Math.min(currentYear - 1, endYear); // 最多到去年

  if (validStartYear > validEndYear) {
    console.error(`[${new Date().toISOString()}] Invalid year range: ${validStartYear}-${validEndYear}`);
    return [];
  }

  // 创建年份数组，从最近年份开始
  const years = [];
  for (let year = validEndYear; year >= validStartYear; year--) {
    years.push(year);
  }

  const allNames = [];
  const uniqueNames = new Set();
  const namePopularityMap = new Map(); // 用于跟踪每个名字的总流行度

  // 从最近年份开始，逐年获取名字
  for (const year of years) {
    try {
      const namesForYear = await getPopularBabyNamesFromFiles(year, 1000); // 获取每年的前1000个名字

      // 根据性别过滤
      const filteredNames = gender
        ? namesForYear.filter(name => name.gender === gender)
        : namesForYear;

      // 累计每个名字的流行度
      for (const nameObj of filteredNames) {
        if (!uniqueNames.has(nameObj.name)) {
          uniqueNames.add(nameObj.name);
          allNames.push(nameObj);
          namePopularityMap.set(nameObj.name, nameObj.count);
        } else {
          // 如果名字已存在，累加其流行度
          const currentCount = namePopularityMap.get(nameObj.name) || 0;
          namePopularityMap.set(nameObj.name, currentCount + nameObj.count);
        }
      }

      console.log(`[${new Date().toISOString()}] Processed year ${year}, total unique names so far: ${uniqueNames.size}`);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error processing year ${year}:`, error);
      // 继续处理其他年份
    }
  }

  // 根据累计的流行度对名字进行排序
  allNames.sort((a, b) => {
    const aPopularity = namePopularityMap.get(a.name) || 0;
    const bPopularity = namePopularityMap.get(b.name) || 0;
    return bPopularity - aPopularity; // 降序排列，最流行的在前
  });

  // 限制返回的名字数量
  const result = allNames.slice(0, limit);

  console.log(`[${new Date().toISOString()}] Completed fetching names from year range ${validStartYear}-${validEndYear}, found ${uniqueNames.size} unique names, returning top ${result.length}`);
  return result;
}

// 辅助函数：将记录插入到已排序的数组中
function insertSorted(arr: BabyName[], record: BabyName) {
  let i = 0;
  while (i < arr.length && arr[i].count > record.count) {
    i++;
  }
  arr.splice(i, 0, record);
}

// 添加或修改这个接口定义
export interface BabyName {
  name: string;
  gender: 'Male' | 'Female';
  count: number;
  rank: number;
  year: number;
}
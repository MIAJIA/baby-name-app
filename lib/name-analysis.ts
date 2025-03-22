// 重定向文件 - 导入并重新导出 lib/name-analysis/index.ts 中的所有内容
export * from './name-analysis/index';

// 添加警告，表明这个文件已被弃用
console.warn('Warning: lib/name-analysis.ts is deprecated. Please import from lib/name-analysis/index.ts instead.');
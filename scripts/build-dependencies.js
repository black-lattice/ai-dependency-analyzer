const fs = require('fs');
const path = require('path');

const { loadConfig } = require('../src/config');
const { isHelpFlag, printHelp } = require('../src/cli/help');
const { Analyzer } = require('../src/core/analyzer');
const { TreeFilter } = require('../src/filters/tree-filter');

const PROJECT_ROOT = process.cwd();
const OUTPUT_FILE = path.join(PROJECT_ROOT, '.dependency-analysis.json');

if (isHelpFlag(process.argv[2])) {
  printHelp('build');
  process.exit(0);
}

console.log('========================================');
console.log('开始执行依赖分析聚合脚本');
console.log('========================================\n');

try {
  const config = loadConfig(PROJECT_ROOT);
  
  console.log('步骤 1/2: 分析依赖关系...');
  console.log('----------------------------------------');
  const analyzer = new Analyzer(PROJECT_ROOT, config);
  const dependencyMap = analyzer.analyze();
  console.log(`分析完成！共分析 ${Object.keys(dependencyMap).length} 个文件\n`);

  console.log('步骤 2/2: 过滤依赖关系...');
  console.log('----------------------------------------');
  const filter = new TreeFilter(config);
  const { filteredDependencies } = filter.filter(dependencyMap);
  console.log(`过滤完成！剩余 ${Object.keys(filteredDependencies).length} 个文件\n`);

  console.log('生成最终文件...');
  
  const now = new Date();
  // 生成带时区的本地时间字符串（例如：北京时间）
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const year = beijingTime.getFullYear();
  const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getDate()).padStart(2, '0');
  const hours = String(beijingTime.getHours()).padStart(2, '0');
  const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
  const seconds = String(beijingTime.getSeconds()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  
  const result = {
    timestamp: timestamp,
    totalFiles: Object.keys(filteredDependencies).length,
    dependencies: filteredDependencies,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`文件已保存到: ${OUTPUT_FILE}\n`);

  console.log('========================================');
  console.log('依赖分析聚合脚本执行完成！');
  console.log('========================================');
} catch (error) {
  console.error('\n========================================');
  console.error('执行失败！');
  console.error('========================================');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}

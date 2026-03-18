const fs = require('fs');
const path = require('path');
const {
  getDependencyGraph,
  getDownstream,
  getUpstream,
  getImpactScope,
  searchByPattern
} = require('../src/core/query');

const DEPENDENCY_FILE = path.join(process.cwd(), '.dependency-analysis.json');

if (!fs.existsSync(DEPENDENCY_FILE)) {
  console.error('缺少依赖分析结果文件，无法运行查询演示脚本。');
  console.error(`请先在目标项目根目录执行: ai-dependency-analyzer build`);
  console.error(`当前期望文件路径: ${DEPENDENCY_FILE}`);
  process.exit(1);
}

console.log('========================================');
console.log('依赖关系查询演示');
console.log('========================================\n');

console.log('测试 1: 查询某个文件的完整依赖关系图');
console.log('----------------------------------------');
const testFile1 = 'pages/account/home/index.page.tsx';
const graph1 = getDependencyGraph(testFile1);
console.log(`文件: ${graph1.file}`);
console.log(`是否存在: ${graph1.exists}`);
console.log(`下游依赖数: ${graph1.downstream ? graph1.downstream.all.length : 0}`);
console.log(`上游依赖数: ${graph1.upstream ? graph1.upstream.all.length : 0}`);
console.log('');

console.log('测试 2: 查询影响范围');
console.log('----------------------------------------');
const testFile2 = 'business/auth-wrap.tsx';
const impact = getImpactScope(testFile2);
console.log(`文件: ${impact.file}`);
console.log(`影响级别: ${impact.impact}`);
console.log(`直接依赖方: ${impact.directDependents}`);
console.log(`总依赖方: ${impact.totalDependents}`);
console.log(`建议: ${impact.recommendation}`);
console.log('');

console.log('测试 3: 查询下游依赖');
console.log('----------------------------------------');
const testFile3 = 'business/OrderFooter/index.tsx';
const downstream = getDownstream(testFile3);
console.log(`文件: ${testFile3}`);
console.log(`直接依赖: ${downstream.direct.join(', ')}`);
console.log(`所有依赖: ${downstream.all.join(', ')}`);
console.log('');

console.log('测试 4: 查询上游依赖');
console.log('----------------------------------------');
const testFile4 = 'components/Button/index.tsx';
const upstream = getUpstream(testFile4);
console.log(`文件: ${testFile4}`);
console.log(`直接被依赖: ${upstream.direct.join(', ')}`);
console.log(`所有被依赖: ${upstream.all.join(', ')}`);
console.log('');

console.log('测试 5: 模式搜索');
console.log('----------------------------------------');
const pattern = 'pages/account/home';
const searchResults = searchByPattern(pattern);
console.log(`搜索模式: ${pattern}`);
console.log(`找到 ${searchResults.length} 个文件`);
searchResults.slice(0, 3).forEach((result, index) => {
  console.log(`  ${index + 1}. ${result.file} (依赖数: ${result.dependencyCount}, 影响: ${result.impact})`);
});
console.log('');

console.log('========================================');
console.log('演示完成！');
console.log('========================================');
console.log('\n可用的函数:');
console.log('  - getDependencyGraph(filePath, options)  获取完整依赖关系图');
console.log('  - getDownstream(filePath)               获取下游依赖');
console.log('  - getUpstream(filePath)                 获取上游依赖');
console.log('  - getImpactScope(filePath)               获取影响范围评估');
console.log('  - searchByPattern(pattern)               按模式搜索文件');

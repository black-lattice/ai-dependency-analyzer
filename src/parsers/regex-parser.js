/**
 * 基于正则表达式的依赖提取器
 * 适用于快速静态扫描，跨端兼容 CommonJS 和 ESM 语法
 */
function parseImports(content) {
  const imports = [];
  
  // 覆盖大部分前端项目引入模式
  const patterns = [
    /import\s+.*?from\s+['"]([^'"]+)['"]/g,           // import { A } from 'a'
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,           // import('a') 动态导入
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,          // require('a') CommonJS
    /export\s+\*\s+from\s+['"]([^'"]+)['"]/g,         // export * from 'a' 转发
    /export\s+{[^}]*}\s+from\s+['"]([^'"]+)['"]/g,    // export { A } from 'a' 转发
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      imports.push(match[1]);
    }
  });

  // 去重
  return [...new Set(imports)];
}

module.exports = { parseImports };

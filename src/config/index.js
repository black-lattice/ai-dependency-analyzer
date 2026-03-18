const path = require('path');
const fs = require('fs');

const DEFAULT_CONFIG = {
  // 分析根目录 (相对于项目根目录)
  sourceDir: 'src',
  // 需分析的文件后缀
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
  // 静态资源/样式后缀 (将被忽略)
  ignoreExtensions: ['.css', '.less', '.scss', '.sass', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp'],
  // 路径别名映射 (例如: { "@/": "src/" })
  aliases: {
    // 默认兼容当前项目的绝对路径写法 (以 / 开头映射到 src)
    '/': 'src/'
  },
  // 入口文件/保留节点匹配规则 (正则表达式字符串数组)
  // 只要匹配这些规则的文件，即使没有被其他文件引用也不会被过滤掉
  entryPointPatterns: [
    '\\.page\\.tsx?$',
    '\\.page\\.jsx?$',
    '^_app\\.page\\.tsx?$',
    '^_document\\.page\\.tsx?$',
    '^_error\\.js$'
  ]
};

function loadConfig(projectRoot) {
  // 尝试加载用户自定义配置 (向上寻找项目根目录的 dependency-analyzer.config.js)
  const configPath = path.join(projectRoot, 'dependency-analyzer.config.js');
  let userConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      userConfig = require(configPath);
      console.log(`[Config] 成功加载项目自定义配置: ${configPath}`);
    } catch (e) {
      console.warn(`[Warning] 加载配置文件失败: ${e.message}`);
    }
  }
  
  // 合并配置，对于 aliases 和 entryPointPatterns 我们做浅合并/覆盖，具体可根据需求改为深合并
  return { ...DEFAULT_CONFIG, ...userConfig };
}

module.exports = { loadConfig, DEFAULT_CONFIG };

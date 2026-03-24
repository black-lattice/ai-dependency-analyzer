const QUERY_ACTIONS = ['impact', 'downstream', 'upstream', 'graph', 'search'];
const INIT_STACKS = ['vue', 'react', 'next', 'nestjs'];
const HELP_FLAGS = new Set(['--help', '-h', 'help']);

function isHelpFlag(value) {
  return HELP_FLAGS.has(value);
}

function printHelp(command = 'main') {
  console.log(getHelpText(command));
}

function getHelpText(command = 'main') {
  switch (command) {
    case 'init':
      return getInitHelpText();
    case 'build':
      return getBuildHelpText();
    case 'query':
      return getQueryHelpText();
    case 'mcp':
      return getMcpHelpText();
    default:
      return getMainHelpText();
  }
}

function getMainHelpText() {
  return `ai-dependency-analyzer - 前端项目依赖分析与查询工具

使用方法:
  ai-dependency-analyzer <命令> [参数]
  npx ai-dependency-analyzer <命令> [参数]

常用流程:
  1. ai-dependency-analyzer init
  2. ai-dependency-analyzer build
  3. ai-dependency-analyzer query impact pages/demo.tsx
  4. ai-dependency-analyzer mcp

可用命令:
  init        初始化 dependency-analyzer.config.js
  build       扫描源码并生成 .dependency-analysis.json
  query       查询指定文件的影响范围、上下游或依赖图
  mcp         启动 MCP Server，供 AI 客户端调用
  help        查看帮助信息

帮助示例:
  ai-dependency-analyzer --help
  ai-dependency-analyzer init --help
  ai-dependency-analyzer build --help
  ai-dependency-analyzer query --help
  ai-dependency-analyzer mcp --help`;
}

function getInitHelpText() {
  return `init - 初始化配置文件

使用方法:
  ai-dependency-analyzer init [技术栈]
  npx ai-dependency-analyzer init [技术栈]

参数说明:
  技术栈可选值: ${INIT_STACKS.join(', ')}
  不传技术栈时，会尝试从当前目录 package.json 自动推断

输出文件:
  dependency-analyzer.config.js

示例:
  ai-dependency-analyzer init
  ai-dependency-analyzer init react
  ai-dependency-analyzer init next`;
}

function getBuildHelpText() {
  return `build - 构建依赖分析数据

使用方法:
  ai-dependency-analyzer build
  npx ai-dependency-analyzer build

执行要求:
  请在目标项目根目录执行，并确保已存在 dependency-analyzer.config.js

输出文件:
  .dependency-analysis.json

说明:
  该命令会扫描源码目录、解析依赖关系并生成缓存结果
  使用 --help 时只输出帮助，不会执行实际构建`;
}

function getQueryHelpText() {
  return `query - 在终端查询依赖关系

使用方法:
  ai-dependency-analyzer query <${QUERY_ACTIONS.join('|')}> <目标>
  npx ai-dependency-analyzer query <${QUERY_ACTIONS.join('|')}> <目标>

动作说明:
  impact      查看某个文件的影响范围与风险级别
  downstream  查看某个文件引用的下游文件
  upstream    查看哪些文件引用了当前文件
  graph       查看完整上下游依赖图
  search      按关键字或正则表达式搜索路径

示例:
  ai-dependency-analyzer query impact src/components/Button/index.tsx
  ai-dependency-analyzer query downstream pages/order/index.page.tsx
  ai-dependency-analyzer query upstream utils/request.ts
  ai-dependency-analyzer query graph pages/order/index.page.tsx
  ai-dependency-analyzer query search OrderCard

说明:
  执行查询前，请先运行 ai-dependency-analyzer build
  查询结果输出为纯 JSON，便于 AI 或脚本继续处理`;
}

function getMcpHelpText() {
  return `mcp - 启动 MCP Server

使用方法:
  ai-dependency-analyzer mcp
  npx ai-dependency-analyzer mcp

说明:
  该命令会通过标准输入输出启动 MCP Server
  启动前请先执行 ai-dependency-analyzer build，确保依赖数据已生成

当前提供的 MCP 工具:
  get_file_impact
  get_downstream_dependencies
  get_upstream_dependencies
  get_dependency_graph
  search_dependencies`;
}

module.exports = {
  QUERY_ACTIONS,
  INIT_STACKS,
  isHelpFlag,
  printHelp,
  getHelpText,
};

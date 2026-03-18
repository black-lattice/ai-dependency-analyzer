#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const command = process.argv[2];

function printHelp() {
  console.log(`
ai-dependency-analyzer - 前端项目依赖分析与查询工具

使用方法:
  npx @your-company/ai-dependency-analyzer <command> [options]

可用命令:
  init        在当前项目初始化配置文件 (dependency-analyzer.config.js)
              支持参数: vue, react, next, nestjs 或不带参数自动推断

  build       静态扫描当前项目依赖，生成缓存数据 (.dependency-analysis.json)

  mcp         启动 MCP (Model Context Protocol) Server，供 AI 客户端调用

  query       [备用] 在终端进行命令行查询
              用法: query <impact|downstream|upstream|search> <文件路径>
`);
}

switch (command) {
  case 'init':
    // 将 process.argv 调整为匹配 scripts/init-config.js 的期望
    // init-config.js 期望从 argv[2] 获取参数，由于我们在 cli.js，它实际在 argv[3]
    process.argv[2] = process.argv[3];
    require('../scripts/init-config');
    break;

  case 'build':
    require('../scripts/build-dependencies');
    break;

  case 'mcp':
    require('./mcp-server');
    break;

  case 'query':
    // 同理，调整 argv 以适配 ai-entry
    process.argv[2] = process.argv[3];
    process.argv[3] = process.argv[4];
    require('./ai-entry');
    break;

  default:
    if (command && command !== 'help' && command !== '--help' && command !== '-h') {
      console.log(`❌ 未知的命令: ${command}\\n`);
    }
    printHelp();
    process.exit(command ? 1 : 0);
}

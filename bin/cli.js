#!/usr/bin/env node

const { isHelpFlag, printHelp } = require('../src/cli/help');

const command = process.argv[2];

if (!command || isHelpFlag(command)) {
  printHelp('main');
  process.exit(0);
}

switch (command) {
  case 'init':
    if (isHelpFlag(process.argv[3])) {
      printHelp('init');
      process.exit(0);
    }

    // 将 process.argv 调整为匹配 scripts/init-config.js 的期望
    // init-config.js 期望从 argv[2] 获取参数，由于我们在 cli.js，它实际在 argv[3]
    process.argv[2] = process.argv[3];
    require('../scripts/init-config');
    break;

  case 'build':
    if (isHelpFlag(process.argv[3])) {
      printHelp('build');
      process.exit(0);
    }
    require('../scripts/build-dependencies');
    break;

  case 'mcp':
    if (isHelpFlag(process.argv[3])) {
      printHelp('mcp');
      process.exit(0);
    }
    require('./mcp-server');
    break;

  case 'query':
    if (isHelpFlag(process.argv[3])) {
      printHelp('query');
      process.exit(0);
    }

    // 同理，调整 argv 以适配 ai-entry
    process.argv[2] = process.argv[3];
    process.argv[3] = process.argv[4];
    require('./ai-entry');
    break;

  default:
    console.log(`❌ 未知的命令: ${command}\n`);
    printHelp('main');
    process.exit(1);
}

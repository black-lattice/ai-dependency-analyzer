const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = process.cwd();
const packageJsonPath = path.join(projectRoot, 'package.json');
const cliPath = path.join(projectRoot, 'bin', 'cli.js');

function assert(condition, message) {
  if (!condition) {
    console.error(`校验失败: ${message}`);
    process.exit(1);
  }
}

assert(fs.existsSync(packageJsonPath), '缺少 package.json');
assert(fs.existsSync(cliPath), '缺少 CLI 入口文件 bin/cli.js');

const pkg = require(packageJsonPath);

assert(pkg.name === 'ai-dependency-analyzer', '包名不是 ai-dependency-analyzer');
assert(pkg.bin && pkg.bin['ai-dependency-analyzer'] === './bin/cli.js', 'bin 配置不正确');
assert(Array.isArray(pkg.files) && pkg.files.length > 0, 'files 配置缺失');

const helpResult = spawnSync(process.execPath, [cliPath, '--help'], {
  cwd: projectRoot,
  encoding: 'utf-8',
});

assert(helpResult.status === 0, '--help 退出码不是 0');
assert(helpResult.stdout.includes('ai-dependency-analyzer'), '帮助输出缺少包名');
assert(helpResult.stdout.includes('query <impact|downstream|upstream|graph|search>'), '帮助输出缺少 query 动作列表');

console.log('基础发布校验通过');

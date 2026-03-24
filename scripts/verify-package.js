const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = process.cwd();
const packageJsonPath = path.join(projectRoot, 'package.json');
const cliPath = path.join(projectRoot, 'bin', 'cli.js');
const dependencyFilePath = path.join(projectRoot, '.dependency-analysis.json');

function assert(condition, message) {
  if (!condition) {
    console.error(`校验失败: ${message}`);
    process.exit(1);
  }
}

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: projectRoot,
    encoding: 'utf-8',
  });
}

assert(fs.existsSync(packageJsonPath), '缺少 package.json');
assert(fs.existsSync(cliPath), '缺少 CLI 入口文件 bin/cli.js');

const pkg = require(packageJsonPath);

assert(pkg.name === 'ai-dependency-analyzer', '包名不是 ai-dependency-analyzer');
assert(pkg.bin && pkg.bin['ai-dependency-analyzer'] === './bin/cli.js', 'bin 配置不正确');
assert(Array.isArray(pkg.files) && pkg.files.length > 0, 'files 配置缺失');

const hadDependencyFile = fs.existsSync(dependencyFilePath);
const originalDependencyFileContent = hadDependencyFile
  ? fs.readFileSync(dependencyFilePath, 'utf-8')
  : null;

try {
  const helpResult = runCli(['--help']);
  assert(helpResult.status === 0, '--help 退出码不是 0');
  assert(helpResult.stdout.includes('ai-dependency-analyzer'), '帮助输出缺少包名');
  assert(helpResult.stdout.includes('query --help'), '帮助输出缺少子命令帮助示例');

  const initHelpResult = runCli(['init', '--help']);
  assert(initHelpResult.status === 0, 'init --help 退出码不是 0');
  assert(initHelpResult.stdout.includes('技术栈可选值'), 'init --help 缺少技术栈说明');

  const buildHelpResult = runCli(['build', '--help']);
  assert(buildHelpResult.status === 0, 'build --help 退出码不是 0');
  assert(buildHelpResult.stdout.includes('只输出帮助，不会执行实际构建'), 'build --help 缺少保护说明');
  assert(!buildHelpResult.stdout.includes('开始执行依赖分析聚合脚本'), 'build --help 不应执行构建逻辑');
  assert(fs.existsSync(dependencyFilePath) === hadDependencyFile, 'build --help 改变了依赖分析文件的存在状态');

  if (hadDependencyFile) {
    const currentContent = fs.readFileSync(dependencyFilePath, 'utf-8');
    assert(currentContent === originalDependencyFileContent, 'build --help 不应改写已有依赖分析文件');
  }

  const queryHelpResult = runCli(['query', '--help']);
  assert(queryHelpResult.status === 0, 'query --help 退出码不是 0');
  assert(queryHelpResult.stdout.includes('query <impact|downstream|upstream|graph|search> <目标>'), 'query --help 缺少查询用法');

  const unknownActionResult = runCli(['query', 'unknown', 'demo']);
  assert(unknownActionResult.status === 1, '未知查询动作退出码不是 1');
  assert(unknownActionResult.stdout.includes('未知查询动作'), '未知查询动作缺少错误提示');
} finally {
  if (!hadDependencyFile && fs.existsSync(dependencyFilePath)) {
    fs.unlinkSync(dependencyFilePath);
  }
}

console.log('基础发布校验通过');

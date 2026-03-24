const {
  getImpactScope,
  getDownstream,
  getUpstream,
  getDependencyGraph,
  searchByPattern
} = require('../src/core/query');
const { QUERY_ACTIONS, isHelpFlag, printHelp } = require('../src/cli/help');

const action = process.argv[2];
const target = process.argv[3];

if (isHelpFlag(action)) {
  printHelp('query');
  process.exit(0);
}

if (!action || !target) {
  console.log(JSON.stringify({
    error: '缺少查询参数。',
    usage: 'ai-dependency-analyzer query <impact|downstream|upstream|graph|search> <目标>',
    actions: QUERY_ACTIONS,
    suggestion: '请先执行 ai-dependency-analyzer query --help 查看完整用法'
  }, null, 2));
  process.exit(1);
}

try {
  let result;
  switch (action) {
    case 'impact':
      result = getImpactScope(target);
      break;
    case 'downstream':
      // 对于 AI，通常只关心简化的信息，但这里返回完整结构以便 AI 根据需要提取 direct 或 all
      result = getDownstream(target);
      break;
    case 'upstream':
      result = getUpstream(target);
      break;
    case 'graph':
      result = getDependencyGraph(target);
      break;
    case 'search':
      result = searchByPattern(target);
      break;
    default:
      console.log(JSON.stringify({
        error: `未知查询动作: ${action}`,
        availableActions: QUERY_ACTIONS,
      }, null, 2));
      process.exit(1);
  }
  
  // 确保输出纯净的 JSON 格式，不含任何人类阅读的杂音
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: error.message }, null, 2));
  process.exit(1);
}

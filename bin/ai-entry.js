const {
  getImpactScope,
  getDownstream,
  getUpstream,
  getDependencyGraph,
  searchByPattern
} = require('../src/core/query');

const action = process.argv[2];
const target = process.argv[3];

if (!action || !target) {
  console.log(JSON.stringify({ 
    error: "Missing arguments.", 
    usage: "node ai-entry.js <action> <target>",
    actions: ["impact", "downstream", "upstream", "graph", "search"]
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
      result = { 
        error: `Unknown action: ${action}.`, 
        availableActions: ["impact", "downstream", "upstream", "graph", "search"] 
      };
  }
  
  // 确保输出纯净的 JSON 格式，不含任何人类阅读的杂音
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.log(JSON.stringify({ error: error.message, stack: error.stack }, null, 2));
  process.exit(1);
}

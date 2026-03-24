const fs = require('fs');
const path = require('path');

const DEPENDENCY_FILE = path.join(
  process.cwd(),
  '.dependency-analysis.json',
);

let dependencyCache = null;

function loadDependencies() {
  if (dependencyCache) {
    return dependencyCache;
  }

  if (!fs.existsSync(DEPENDENCY_FILE)) {
    throw new Error('未找到 .dependency-analysis.json，请先在目标项目根目录执行 ai-dependency-analyzer build');
  }

  try {
    const data = JSON.parse(fs.readFileSync(DEPENDENCY_FILE, 'utf-8'));
    if (!data || typeof data !== 'object' || !data.dependencies || typeof data.dependencies !== 'object') {
      throw new Error('依赖分析文件格式无效');
    }
    dependencyCache = data.dependencies;
    return dependencyCache;
  } catch (error) {
    throw new Error(`加载依赖关系文件失败: ${error.message}`);
  }
}

function uniqueList(items) {
  return [...new Set(items)];
}

function getDownstream(filePath, dependencies = null, visited = new Set()) {
  if (!dependencies) {
    dependencies = loadDependencies();
  }

  const normalizedPath = filePath.replace(/\\/g, '/');
  const deps = dependencies[normalizedPath] || [];

  if (visited.has(normalizedPath)) {
    return {
      direct: [],
      all: [],
      tree: [],
    };
  }

  visited.add(normalizedPath);
  const uniqueDeps = uniqueList(deps);

  const result = {
    direct: uniqueDeps,
    all: [...uniqueDeps],
    tree: [],
  };

  uniqueDeps.forEach((dep) => {
    const childResult = getDownstream(dep, dependencies, new Set(visited));
    result.all.push(...childResult.all);
    result.tree.push({
      file: dep,
      dependencies: childResult.tree,
    });
  });

  result.all = uniqueList(result.all).filter((item) => item !== normalizedPath);

  return result;
}

function getUpstream(filePath, dependencies = null, visited = new Set()) {
  if (!dependencies) {
    dependencies = loadDependencies();
  }

  const normalizedPath = filePath.replace(/\\/g, '/');
  const upstream = [];

  Object.keys(dependencies).forEach((file) => {
    const deps = dependencies[file];
    if (deps.includes(normalizedPath)) {
      upstream.push(file);
    }
  });

  if (visited.has(normalizedPath)) {
    return {
      direct: upstream,
      all: [],
      tree: [],
    };
  }

  visited.add(normalizedPath);
  const uniqueUpstream = uniqueList(upstream);

  const result = {
    direct: uniqueUpstream,
    all: [...uniqueUpstream],
    tree: [],
  };

  uniqueUpstream.forEach((file) => {
    const childResult = getUpstream(file, dependencies, new Set(visited));
    result.all.push(...childResult.all);
    result.tree.push({
      file: file,
      dependents: childResult.tree,
    });
  });

  result.all = uniqueList(result.all).filter((item) => item !== normalizedPath);

  return result;
}

function getDependencyGraph(filePath, options = {}) {
  const {
    includeDownstream = true,
    includeUpstream = true,
    maxDepth = 10,
  } = options;

  const dependencies = loadDependencies();
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (
    !dependencies[normalizedPath] &&
    !Object.keys(dependencies).some((key) =>
      dependencies[key].includes(normalizedPath),
    )
  ) {
    return {
      file: normalizedPath,
      exists: false,
      message: '文件不在依赖关系中',
    };
  }

  const result = {
    file: normalizedPath,
    exists: true,
    timestamp: new Date().toISOString(),
    downstream: null,
    upstream: null,
  };

  if (includeDownstream) {
    result.downstream = getDownstream(normalizedPath, dependencies);
  }

  if (includeUpstream) {
    result.upstream = getUpstream(normalizedPath, dependencies);
  }

  return result;
}

function getImpactScope(filePath) {
  const graph = getDependencyGraph(filePath, {
    includeDownstream: false,
    includeUpstream: true,
  });

  if (!graph.exists) {
    return {
      file: filePath,
      impact: 'none',
      message: '文件不在依赖关系中',
    };
  }

  const upstreamCount = graph.upstream.all.length;
  const directUpstreamCount = graph.upstream.direct.length;

  let impact = 'low';
  if (upstreamCount > 20) {
    impact = 'high';
  } else if (upstreamCount > 5) {
    impact = 'medium';
  }

  return {
    file: filePath,
    impact: impact,
    directDependents: directUpstreamCount,
    totalDependents: upstreamCount,
    affectedFiles: graph.upstream.all,
    recommendation: getRecommendation(impact, directUpstreamCount),
  };
}

function getRecommendation(impact, directCount) {
  if (impact === 'high') {
    return '此文件被大量其他文件依赖，修改时需要格外谨慎，建议：1) 保持向后兼容 2) 充分测试所有依赖方 3) 考虑使用渐进式迁移策略';
  } else if (impact === 'medium') {
    return `此文件被 ${directCount} 个文件直接依赖，修改时建议：1) 检查直接依赖方的使用方式 2) 运行相关测试 3) 通知相关开发者`;
  } else {
    return '此文件影响范围较小，修改相对安全，但仍建议进行基本的测试验证';
  }
}

function searchByPattern(pattern) {
  const dependencies = loadDependencies();
  const results = [];
  let regex;

  try {
    regex = new RegExp(pattern, 'i');
  } catch (error) {
    throw new Error(`无效的搜索表达式: ${error.message}`);
  }

  Object.keys(dependencies).forEach((file) => {
    if (regex.test(file)) {
      const deps = dependencies[file];
      const impact = getImpactScope(file);
      results.push({
        file: file,
        dependencies: deps,
        dependencyCount: deps.length,
        impact: impact.impact,
      });
    }
  });

  return results;
}

module.exports = {
  getDependencyGraph,
  getDownstream,
  getUpstream,
  getImpactScope,
  searchByPattern,
  loadDependencies,
};

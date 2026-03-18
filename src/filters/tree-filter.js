const path = require('path');

class TreeFilter {
  constructor(config) {
    this.config = config;
  }

  isEntryPoint(filePath) {
    const fileName = path.basename(filePath);
    return this.config.entryPointPatterns.some(patternStr => {
      const regex = new RegExp(patternStr);
      // 允许正则匹配文件名或全路径
      return regex.test(fileName) || regex.test(filePath);
    });
  }

  findLeafNodes(dependencies) {
    const leafNodes = [];
    const allFiles = Object.keys(dependencies);
    const referencedFiles = new Set();

    // 1. 收集所有被引用的文件集合
    allFiles.forEach((file) => {
      dependencies[file].forEach((dep) => {
        referencedFiles.add(dep);
      });
    });

    // 2. 找出从未被引用的文件（叶子节点）
    allFiles.forEach((file) => {
      if (!referencedFiles.has(file)) {
        leafNodes.push(file);
      }
    });

    return leafNodes;
  }

  filter(dependencies) {
    const leafNodes = this.findLeafNodes(dependencies);
    const filteredDependencies = {};

    Object.keys(dependencies).forEach((file) => {
      const isLeaf = leafNodes.includes(file);
      const isEntry = this.isEntryPoint(file);
      const hasDependencies = dependencies[file].length > 0;

      // 保留核心逻辑：
      // 1. 哪怕它是孤岛（Leaf），只要它是被配置认可的入口文件（Entry），就保留。
      // 2. 只要它不是孤岛（被别人引用了），不管它自身有没有下游依赖，都保留它。
      if ((!isLeaf || isEntry) && (hasDependencies || isEntry || !isLeaf)) {
        filteredDependencies[file] = dependencies[file];
      }
    });

    return {
      filteredDependencies,
      removedLeafNodes: leafNodes.filter((node) => !this.isEntryPoint(node)),
      keptEntryFiles: leafNodes.filter((node) => this.isEntryPoint(node)),
    };
  }
}

module.exports = { TreeFilter };

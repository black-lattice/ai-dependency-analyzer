const fs = require('fs');
const path = require('path');
const { parseImports } = require('../parsers/regex-parser');
const { PathResolver } = require('../resolvers/path-resolver');

class Analyzer {
  constructor(projectRoot, config) {
    this.projectRoot = projectRoot;
    this.config = config;
    this.resolver = new PathResolver(projectRoot, config);
    this.sourcePath = path.join(this.projectRoot, this.config.sourceDir);
  }

  _getAllFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) {
      console.warn(`[Analyzer] 目录不存在: ${dir}`);
      return fileList;
    }
    
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this._getAllFiles(filePath, fileList);
      } else {
        const ext = path.extname(file);
        if (this.config.extensions.includes(ext)) {
          fileList.push(filePath);
        }
      }
    });

    return fileList;
  }

  analyze() {
    const allFiles = this._getAllFiles(this.sourcePath);
    const dependencyMap = {};

    allFiles.forEach((file) => {
      const relativePath = this.resolver.getRelativePathFromSrc(file);
      const content = fs.readFileSync(file, 'utf-8');
      
      // 注意：未来如果需要，可以在这里通过配置切换为基于 AST 的 Parser
      const imports = parseImports(content);
      const dependencies = [];

      imports.forEach((importPath) => {
        const resolvedPath = this.resolver.resolve(importPath, file);

        if (resolvedPath && fs.existsSync(resolvedPath)) {
          if (!this.resolver.isIgnoredResource(resolvedPath)) {
            const depRelativePath = this.resolver.getRelativePathFromSrc(resolvedPath);
            // 排除对自身的循环引用
            if (depRelativePath !== relativePath) {
              dependencies.push(depRelativePath);
            }
          }
        }
      });

      dependencyMap[relativePath] = [...new Set(dependencies)].sort();
    });

    return dependencyMap;
  }
}

module.exports = { Analyzer };

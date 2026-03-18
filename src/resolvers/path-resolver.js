const path = require('path');
const fs = require('fs');

class PathResolver {
  constructor(projectRoot, config) {
    this.projectRoot = projectRoot;
    this.config = config;
    this.sourcePath = path.join(this.projectRoot, this.config.sourceDir);
  }

  isNodeModule(importPath) {
    // 简单判断: 不以 . 或 / 开头，且没有命中 alias 的，通常是 node_modules
    return !importPath.startsWith('.') && !importPath.startsWith('/') && !this._isAlias(importPath);
  }

  _isAlias(importPath) {
    return Object.keys(this.config.aliases).some(alias => importPath.startsWith(alias));
  }

  isIgnoredResource(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.config.ignoreExtensions.includes(ext);
  }

  resolve(importPath, currentFile) {
    if (this.isNodeModule(importPath)) {
      return null;
    }

    let resolvedPath = importPath;
    const currentDir = path.dirname(currentFile);

    // 1. 处理路径别名 (Aliases)
    let aliasMatched = false;
    for (const [alias, target] of Object.entries(this.config.aliases)) {
      if (importPath.startsWith(alias)) {
        const relativeTarget = importPath.replace(alias, '');
        resolvedPath = path.join(this.projectRoot, target, relativeTarget);
        aliasMatched = true;
        break;
      }
    }

    // 2. 处理相对路径
    if (!aliasMatched) {
      resolvedPath = path.join(currentDir, importPath);
    }

    // 3. 补全扩展名 / 寻找目录下的 index 文件
    if (!path.extname(resolvedPath) || !fs.existsSync(resolvedPath) || (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory())) {
      const possibleExtensions = this.config.extensions;
      let found = false;

      // 如果直接是一个已存在的目录，尝试寻找 index 文件
      let isDir = false;
      try { isDir = fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory(); } catch(e){}

      if (isDir) {
         for (const ext of possibleExtensions) {
          const testPath = path.join(resolvedPath, `index${ext}`);
          if (fs.existsSync(testPath)) {
            resolvedPath = testPath;
            found = true;
            break;
          }
        }
      } else {
        // 尝试给文件补全后缀
        for (const ext of possibleExtensions) {
          const testPath = resolvedPath + ext;
          if (fs.existsSync(testPath)) {
            resolvedPath = testPath;
            found = true;
            break;
          }
        }
      }
      
      if (!found && !fs.existsSync(resolvedPath)) {
         return null; // 无法在本地文件系统中解析，丢弃
      }
    }

    return resolvedPath;
  }

  getRelativePathFromSrc(filePath) {
    // 统一转换为相对于 sourceDir 的正斜杠路径，保证跨平台一致性
    const relativePath = path.relative(this.sourcePath, filePath);
    return relativePath.replace(/\\/g, '/');
  }
}

module.exports = { PathResolver };

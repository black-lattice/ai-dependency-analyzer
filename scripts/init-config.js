const fs = require('fs');
const path = require('path');
const { isHelpFlag, printHelp } = require('../src/cli/help');

// 模板字典
const TEMPLATES = {
  vue: {
    description: "Vue (Vite/Webpack) 标准单页应用",
    content: `module.exports = {
  // Vue 项目通常源码在 src 下
  sourceDir: 'src',
  // 必须包含 .vue 后缀
  extensions: ['.vue', '.js', '.ts', '.jsx', '.tsx'],
  // 绝大多数 Vue 项目使用 @/ 作为 src 的别名
  aliases: {
    '@/': 'src/'
  },
  // 入口文件：main.js/ts, 路由配置，以及 views 目录下的页面组件
  entryPointPatterns: [
    'main\\\\.(js|ts)$',
    'router/.*\\\\.(js|ts)$',
    'views/.*\\\\.vue$'
  ]
};
`
  },
  react: {
    description: "React (Vite/CRA) 标准单页应用",
    content: `module.exports = {
  sourceDir: 'src',
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  // 根据您的项目实际别名修改，通常是 @/ 或 src/
  aliases: {
    '@/': 'src/'
  },
  // 入口文件：index.js/ts, main.js/ts, App 组件，以及 pages 目录下的顶层页面
  entryPointPatterns: [
    '(main|index)\\\\.(js|ts|jsx|tsx)$',
    'App\\\\.(js|ts|jsx|tsx)$',
    'pages/.*\\\\.(jsx|tsx)$'
  ]
};
`
  },
  next: {
    description: "Next.js (React) 服务端渲染应用",
    content: `module.exports = {
  // Next 项目可能是 src 或者根目录下的 pages/app
  sourceDir: 'src',
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  // Next 通常直接使用 / 或 @/
  aliases: {
    '@/': 'src/',
    '/': 'src/' // 兼容旧项目绝对路径
  },
  // 入口文件：Next.js 基于文件系统的路由页面
  entryPointPatterns: [
    '\\\\.page\\\\.(jsx|tsx)$',      // 自定义页面后缀
    '^_app\\\\.(jsx|tsx)$',         // 全局 App
    '^_document\\\\.(jsx|tsx)$',    // 全局 Document
    'pages/.*\\\\.(jsx|tsx)$',      // Pages Router 页面
    'app/.*\\\\/page\\\\.(jsx|tsx)$' // App Router 页面
  ]
};
`
  },
  nestjs: {
    description: "NestJS Node.js 后台应用",
    content: `module.exports = {
  sourceDir: 'src',
  extensions: ['.ts', '.js'],
  aliases: {
    '@/': 'src/'
  },
  // 入口文件：main.ts, module 注册，以及所有的 controller
  entryPointPatterns: [
    'main\\\\.ts$',
    '.*\\\\.module\\\\.ts$',
    '.*\\\\.controller\\\\.ts$'
  ]
};
`
  }
};

function detectStack(projectRoot) {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return null;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['next']) return 'next';
    if (deps['@nestjs/core']) return 'nestjs';
    if (deps['vue']) return 'vue';
    if (deps['react']) return 'react';
    
    return null;
  } catch (e) {
    return null;
  }
}

function main() {
  const PROJECT_ROOT = process.cwd();
  let stack = process.argv[2];

  if (isHelpFlag(stack)) {
    printHelp('init');
    process.exit(0);
  }

  // 如果没有手动指定参数，尝试自动推断
  if (!stack) {
    console.log('🔄 未指定技术栈参数，正在尝试从 package.json 自动推断...');
    stack = detectStack(PROJECT_ROOT);
    
    if (stack) {
      console.log(`✅ 成功推断出当前项目技术栈为: ${stack} (${TEMPLATES[stack].description})`);
    } else {
      console.log('❌ 自动推断失败，请手动指定要初始化的技术栈模板。可选值:');
      Object.keys(TEMPLATES).forEach(key => {
        console.log(`  - ${key.padEnd(10)}: ${TEMPLATES[key].description}`);
      });
      console.log('\\n示例: ai-dependency-analyzer init vue');
      process.exit(1);
    }
  } else if (!TEMPLATES[stack]) {
    console.log(`❌ 无效的技术栈参数: ${stack}`);
    console.log('可选值:');
    Object.keys(TEMPLATES).forEach(key => {
      console.log(`  - ${key.padEnd(10)}: ${TEMPLATES[key].description}`);
    });
    process.exit(1);
  }

  const targetPath = path.join(PROJECT_ROOT, 'dependency-analyzer.config.js');

  if (fs.existsSync(targetPath)) {
    console.warn(`⚠️ 配置文件已存在: ${targetPath}`);
    console.warn('如果您想重新生成，请先手动删除该文件。');
    process.exit(1);
  }

  fs.writeFileSync(targetPath, TEMPLATES[stack].content, 'utf-8');
  console.log(`🎉 初始化成功！`);
  console.log(`📄 已在项目根目录生成基于 [${stack}] 栈的配置文件: dependency-analyzer.config.js`);
  console.log(`💡 您可以根据项目实际情况微调该文件中的 aliases 或 entryPointPatterns。`);
}

main();

# AI 依赖分析工具

`ai-dependency-analyzer` 是一套面向 AI 辅助开发场景的前端项目依赖分析工具。它通过静态分析提取项目文件之间的引用关系，并提供两种使用方式：

- 作为 CLI 工具，在终端中初始化配置、构建依赖数据、执行查询
- 作为 MCP Server，接入支持 MCP 的 AI 客户端，例如 Cursor、Claude Desktop、Trae

它适合解决这几类问题：

- 修改一个公共组件前，先评估影响范围
- 接手复杂页面时，快速拉出子组件与依赖结构
- 排查问题时，顺着依赖链定位上下游关系

## 为什么需要这个工具

在大型前端项目里，AI 经常面临两个核心问题：

- 缺少全局架构上下文
- 上下文窗口有限，盲目读代码成本高

通过本工具，AI 可以基于已有依赖数据更有针对性地工作：

- 评估修改风险：修改前先确认会影响多少上游页面或模块
- 精准获取上下文：只读取和当前任务相关的子组件、工具函数、服务文件
- 辅助问题排查：快速判断问题更可能出在当前文件、上游调用方还是下游实现

## 快速开始

### 方式一：作为 npm 包使用

你可以全局安装：

```bash
npm install -g ai-dependency-analyzer
```

安装后可直接使用以下命令：

```bash
ai-dependency-analyzer init
ai-dependency-analyzer build
ai-dependency-analyzer mcp
ai-dependency-analyzer query impact pages/demo.tsx
```

也可以不安装，直接用 `npx` 临时执行：

```bash
npx ai-dependency-analyzer init
npx ai-dependency-analyzer build
npx ai-dependency-analyzer mcp
npx ai-dependency-analyzer query impact pages/demo.tsx
```

### 方式二：作为源码仓库使用

如果你是当前仓库的维护者，或希望直接基于源码运行：

```bash
cd dependency-analysis-tools
npm install
```

当前仓库对外 CLI 命令入口是：

```bash
node bin/cli.js <command>
```

例如：

```bash
node bin/cli.js init
node bin/cli.js build
node bin/cli.js mcp
node bin/cli.js query impact pages/demo.tsx
```

## 典型工作流

无论你是通过 npm 安装还是源码运行，推荐都在“目标项目根目录”执行命令：

1. 初始化配置文件
2. 构建依赖分析数据
3. 启动 MCP Server 或直接使用 CLI 查询

示例：

```bash
ai-dependency-analyzer init
ai-dependency-analyzer build
ai-dependency-analyzer mcp
```

## 初始化配置

在目标项目根目录运行：

```bash
ai-dependency-analyzer init
```

工具会尝试自动读取当前项目根目录的 `package.json`，并推断技术栈后生成配置文件，当前支持：

- Vue
- React
- Next.js
- NestJS

如果你想手动指定技术栈，可以传参：

```bash
ai-dependency-analyzer init vue
```

也可以替换为：

```bash
ai-dependency-analyzer init react
ai-dependency-analyzer init next
ai-dependency-analyzer init nestjs
```

执行后会在当前项目根目录生成：

```bash
dependency-analyzer.config.js
```

你可以按项目实际情况调整其中的：

- `sourceDir`
- `extensions`
- `aliases`
- `entryPointPatterns`

## 构建依赖数据

在目标项目根目录运行：

```bash
ai-dependency-analyzer build
```

这一步会扫描源码目录，生成依赖分析结果文件：

```bash
.dependency-analysis.json
```

首次使用前建议先执行一次。项目发生较大重构、目录迁移或别名调整后，也建议重新构建。

如果你只是想查看构建命令说明，而不实际执行扫描，可以使用：

```bash
ai-dependency-analyzer build --help
```

## CLI 查询用法

你可以直接在终端进行查询：

```bash
ai-dependency-analyzer query <impact|downstream|upstream|graph|search> <目标>
```

示例：

```bash
ai-dependency-analyzer query impact src/components/Button/index.tsx
ai-dependency-analyzer query downstream pages/order/index.page.tsx
ai-dependency-analyzer query upstream utils/request.ts
ai-dependency-analyzer query graph pages/order/index.page.tsx
ai-dependency-analyzer query search OrderCard
```

说明：

- `impact`：查看某个文件的影响范围
- `downstream`：查看某个文件引用了哪些下游文件
- `upstream`：查看哪些文件引用了当前文件
- `graph`：查看完整上下游依赖图
- `search`：按关键字或正则表达式搜索路径

CLI 输出为纯 JSON，便于 AI 或其他脚本继续处理。

如果你想查看查询命令说明，可以使用：

```bash
ai-dependency-analyzer query --help
```

### 查询路径说明

查询命令中的文件路径，需要与 `.dependency-analysis.json` 中记录的相对路径保持一致。

这意味着：

- 如果你的分析结果里记录的是 `pages/order/index.page.tsx`，查询时就应传 `pages/order/index.page.tsx`
- 如果你的项目配置或生成结果里包含 `src/` 前缀，那么查询时也需要带上 `src/`

路径口径最终取决于你的项目配置，尤其是 `dependency-analyzer.config.js` 中的 `sourceDir`。

## 配置 MCP Server

如果你希望让 AI 客户端自动具备依赖分析能力，可以把它配置成 MCP Server。

本工具当前提供的是基于标准输入输出的 `stdio` 类型 MCP Server，推荐直接通过已安装命令启动，而不是写死仓库内部脚本路径。

在开始配置前，请先确保以下条件成立：

- 已通过 `npm install -g ai-dependency-analyzer` 全局安装
- 或者当前客户端运行环境中可以直接找到 `ai-dependency-analyzer` 命令

如果你的客户端环境无法直接找到这个命令，也可以改成你本机实际可执行文件的绝对路径。

例如，如果你的环境中 `ai-dependency-analyzer` 不能直接被识别，可以改成以下思路之一：

- `command` 直接写成 `node`
- `args` 传入全局安装后的实际可执行脚本路径，再追加 `mcp`

如果你是基于源码仓库运行，也可以直接把命令指向仓库内入口，例如：

```json
{
  "command": "node",
  "args": ["/你的绝对路径/dependency-analysis-tools/bin/cli.js", "mcp"]
}
```

### 在 Cursor 中配置

1. 打开 Cursor Settings。
2. 进入 `Features -> MCP`。
3. 点击 `+ Add New MCP Server`。
4. 填写如下信息：

- `Name`：`Dependency Analyzer`
- `Type`：`command`
- `Command`：`ai-dependency-analyzer`
- `Args`：`mcp`

### 在 Claude Desktop 中配置

编辑本地配置文件：

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

配置示例：

```json
{
  "mcpServers": {
    "DependencyAnalyzer": {
      "command": "ai-dependency-analyzer",
      "args": ["mcp"]
    }
  }
}
```

保存后重启 Claude Desktop。

### 在 Gemini CLI 中配置

如果你希望只在当前项目中启用，可以在项目根目录创建或编辑：

```bash
.gemini/settings.json
```

配置示例：

```json
{
  "mcpServers": {
    "dependencyAnalyzer": {
      "command": "ai-dependency-analyzer",
      "args": ["mcp"]
    }
  }
}
```

如果你希望全局生效，也可以放到 Gemini CLI 的用户级配置中，配置结构保持一致。

### 在 Codex 中配置

你可以通过命令直接添加：

```bash
codex mcp add dependencyAnalyzer -- ai-dependency-analyzer mcp
```

也可以手动编辑 Codex 配置文件，常见位置为：

```bash
~/.codex/config.toml
```

配置示例：

```toml
[mcp_servers.dependencyAnalyzer]
command = "ai-dependency-analyzer"
args = ["mcp"]
```

### 在不支持 MCP 的 AI 环境中降级使用

如果你使用的 AI 环境暂时不支持完整 MCP 协议，也可以让它直接调用 CLI：

```bash
ai-dependency-analyzer query impact components/Button/index.tsx
```

或：

```bash
npx ai-dependency-analyzer query impact src/components/Button/index.tsx
```

如果你只是想查看全部命令帮助，也可以直接运行：

```bash
ai-dependency-analyzer --help
ai-dependency-analyzer init --help
ai-dependency-analyzer build --help
ai-dependency-analyzer query --help
ai-dependency-analyzer mcp --help
```

## AI 可调用的 MCP 工具

当 MCP Server 配置完成后，AI 将自动获得以下工具：

### `get_file_impact`

用途：评估修改某个文件的影响范围和风险级别。  
参数：`file_path`

示例话术：

> 我想修改 `business/auth-wrap.tsx` 中的登录校验逻辑，请先帮我评估影响范围。

### `get_downstream_dependencies`

用途：获取指定文件直接或间接引用的所有下游文件。  
参数：`file_path`

示例话术：

> 我要接手 `pages/account/settle/index.page.tsx`，先帮我分析它的子组件和依赖层级。

### `get_upstream_dependencies`

用途：获取指定文件被哪些其他文件引用。  
参数：`file_path`

示例话术：

> 帮我查一下 `components/PickerView/PickerMixin.tsx` 都被哪些地方使用了。

### `get_dependency_graph`

用途：获取指定文件的完整上下游依赖图。  
参数：`file_path`

示例话术：

> 帮我把 `pages/order/index.page.tsx` 的上下游依赖图完整拉出来。

### `search_dependencies`

用途：通过正则表达式搜索路径，并返回匹配文件的依赖概况。  
参数：`pattern`

示例话术：

> 帮我搜索包含 `OrderCard` 的文件，并列出它们的依赖情况。

## 文件说明

在目标项目根目录中，这个工具主要会产生两个文件：

- `dependency-analyzer.config.js`：项目级配置文件
- `.dependency-analysis.json`：依赖分析结果数据文件

建议：

- `dependency-analyzer.config.js` 应纳入版本管理，便于团队共享统一配置
- `.dependency-analysis.json` 是否纳入版本管理，可按团队协作方式决定
- 如果项目结构频繁变化，建议在重要重构后重新执行一次 `build`

## 源码开发者说明

如果你正在维护本仓库本身，而不是单纯作为 npm 包使用，当前主要入口如下：

- [`bin/cli.js`](./bin/cli.js)：CLI 主入口
- [`bin/mcp-server.js`](./bin/mcp-server.js)：MCP Server 入口
- [`bin/ai-entry.js`](./bin/ai-entry.js)：纯 CLI 查询入口
- [`scripts/init-config.js`](./scripts/init-config.js)：初始化配置脚本
- [`scripts/build-dependencies.js`](./scripts/build-dependencies.js)：构建依赖数据脚本

本地调试时可直接运行：

```bash
node bin/cli.js --help
node bin/cli.js init --help
node bin/cli.js build --help
node bin/cli.js query --help
node bin/cli.js init
node bin/cli.js build
node bin/cli.js query impact pages/demo.tsx
```

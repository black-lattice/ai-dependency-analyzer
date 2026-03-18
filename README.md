# 前端依赖分析工具 (Dependency Analysis Tools)

本项目包含一套专为 AI 辅助开发量身定制的前端代码依赖分析工具。它通过静态分析提取项目文件的依赖（引用）关系，并封装为标准的 **MCP (Model Context Protocol) Server**，供支持 MCP 的 AI 客户端（如 Cursor, Claude Desktop, Trae 等）直接调用。

## 🌟 为什么需要这个工具？

在大型前端项目中，AI 最大的痛点是“缺乏全局架构直觉”和“上下文窗口限制”。盲目搜索容易消耗大量 Token 且容易遗漏。通过本工具，AI 可以：
- **评估修改风险**：在修改公共组件前，精确计算有多少页面受影响。
- **精准获取上下文**：在重构复杂页面时，获取确切的子组件列表，指引 AI 只读取需要的文件。
- **排查问题**：通过依赖树顺藤摸瓜，快速定位 Bug 根源。

---

## 🚀 快速开始

### 1. (跨项目) 初始化配置
如果你将此工具引入了一个全新的项目，只需在命令行运行 `init`，它会尝试**自动读取根目录的 `package.json` 并推断技术栈**生成匹配的配置文件（支持推断 Vue, React, Next.js, NestJS）：
```bash
cd dependency-analysis-tools
npm run init
```

*如果你想强制指定某个技术栈，可以传递参数：*
```bash
npm run init vue   # 或者 react, next, nestjs
```
*这会在项目根目录生成 `dependency-analyzer.config.js`。*

### 2. 更新依赖关系数据
在首次使用或项目代码发生大量重构后，请运行以下命令更新依赖缓存数据：
```bash
cd dependency-analysis-tools
npm run build:data
```
*这会扫描 `src/` 目录，生成最新的 `dependency-analysis-filtered.json` 文件。*

### 2. 依赖安装 (首次运行 MCP Server 前)
```bash
cd dependency-analysis-tools
npm install
```

---

## 🔌 配置 MCP Server (接入 AI 客户端)

为了让你的 AI 助手自动获得这些分析能力，你需要将它配置为 MCP Server。

### 👉 在 Cursor 中配置
1. 打开 Cursor Settings (`Cmd/Ctrl + Shift + J`)。
2. 导航到 **Features -> MCP**。
3. 点击 **+ Add New MCP Server**。
4. 填写如下信息：
   - **Name**: `Dependency Analyzer` (自定义名称)
   - **Type**: `command`
   - **Command**: `node /您的项目绝对路径/dependency-analysis-tools/bin/mcp-server.js`

### 👉 在 Claude Desktop 中配置
编辑本地配置文件 `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) 或 `%APPDATA%\Claude\claude_desktop_config.json` (Windows)：
```json
{
  "mcpServers": {
    "DependencyAnalyzer": {
      "command": "node",
      "args": [
        "/您的项目绝对路径/dependency-analysis-tools/bin/mcp-server.js"
      ]
    }
  }
}
```
*保存后请重启 Claude Desktop。*

### 👉 供纯 CLI Agent 调用的降级方案
如果你使用的 AI (如 Gemini CLI) 暂不支持完整的 MCP 协议，可以直接要求 AI 执行降级版的 CLI 命令：
```bash
node dependency-analysis-tools/bin/ai-entry.js <impact|downstream|upstream|search> <文件路径>
```

---

## 🛠 AI 可用的工具列表 (Tools)

当配置好 MCP Server 后，AI 将自动获得以下工具。你可以直接用自然语言要求 AI 使用它们：

### 1. `get_file_impact`
**描述**：评估修改指定前端文件可能带来的影响范围和风险级别。
**参数**：`file_path` (文件的相对路径，如 `business/auth-wrap.tsx`)
**使用话术示例**：
> "我想修改 `business/auth-wrap.tsx` 中的登录校验逻辑，请先用分析工具帮我看看影响范围和风险。"

### 2. `get_downstream_dependencies`
**描述**：获取指定文件直接或间接引用的所有子文件（子组件/工具/服务）。
**参数**：`file_path`
**使用话术示例**：
> "我要接手维护 `pages/account/settle/index.page.tsx` 这个结算页面，请用工具帮我拉取一下它所有的子组件层级，让我对页面结构有个底。"

### 3. `get_upstream_dependencies`
**描述**：获取指定文件被哪些其他文件引用了（父组件/页面）。
**参数**：`file_path`
**使用话术示例**：
> "帮我查一下 `components/PickerView/PickerMixin.tsx` 都在哪里被用到了。"

### 4. `search_dependencies`
**描述**：通过正则表达式搜索文件路径，并返回匹配文件的依赖概况。
**参数**：`pattern` (正则表达式，如 `pages/account/.*`)
**使用话术示例**：
> "用工具帮我搜一下包含 `OrderCard` 关键字的文件，并列出它们的依赖数。"

---

## 📝 维护建议
- 建议将 `dependency-analysis-filtered.json` 加入到 Git 仓库中，这样团队成员拉取代码后可以直接使用，不用频繁自行构建。
- 如果你的项目重构了大量的文件结构，别忘了提示 AI 运行 `npm run build:data` 更新数据底座。
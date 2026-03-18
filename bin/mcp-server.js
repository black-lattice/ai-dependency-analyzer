#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const queries = require("../src/core/query");

const server = new Server({
  name: "project-dependency-analyzer",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});

// 1. 定义工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_file_impact",
      description: "评估修改指定前端文件可能带来的影响范围和风险级别。在重构、修改公共组件或底层文件前必须调用。",
      inputSchema: {
        type: "object",
        properties: {
          file_path: { 
            type: "string", 
            description: "需要分析的相对文件路径，例如 'business/auth-wrap.tsx' 或 'pages/account/home/index.page.tsx'" 
          }
        },
        required: ["file_path"]
      }
    },
    {
      name: "get_downstream_dependencies",
      description: "获取指定文件直接或间接引用的所有文件（子组件/工具/服务）。当你需要了解一个复杂页面的构成，或者寻找某个功能是在哪个子组件中实现时使用。",
      inputSchema: {
        type: "object",
        properties: {
          file_path: { 
            type: "string", 
            description: "需要分析的相对文件路径" 
          }
        },
        required: ["file_path"]
      }
    },
    {
      name: "get_upstream_dependencies",
      description: "获取指定文件被哪些其他文件引用了（父组件/页面）。用于查找一个通用组件都在哪里被使用了。",
      inputSchema: {
        type: "object",
        properties: {
          file_path: { 
            type: "string", 
            description: "需要分析的相对文件路径" 
          }
        },
        required: ["file_path"]
      }
    },
    {
      name: "search_dependencies",
      description: "通过正则表达式搜索文件路径，并返回匹配文件的依赖概况。当你只记得文件名的一部分，或者想快速查看某一目录下所有页面的依赖数量时使用。",
      inputSchema: {
        type: "object",
        properties: {
          pattern: { 
            type: "string", 
            description: "用于匹配文件路径的正则表达式字符串，例如 'pages/account/.*' 或 'Button'" 
          }
        },
        required: ["pattern"]
      }
    }
  ]
}));

// 2. 实现工具调用逻辑
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    if (name === "get_file_impact") {
      const result = queries.getImpactScope(args.file_path);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    
    if (name === "get_downstream_dependencies") {
      // 对 AI 友好：结构化返回直接和所有依赖
      const result = queries.getDownstream(args.file_path);
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify({ direct: result.direct, all: result.all }, null, 2) 
        }] 
      };
    }

    if (name === "get_upstream_dependencies") {
       const result = queries.getUpstream(args.file_path);
       return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify({ direct: result.direct, all: result.all }, null, 2) 
        }] 
      };
    }

    if (name === "search_dependencies") {
      const result = queries.searchByPattern(args.pattern);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    
    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error executing tool: ${error.message}` }]
    };
  }
});

// 3. 启动传输层
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);

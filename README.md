# 待办事项 API 服务（D8）

## 项目简介

Node.js + Express 后端 API + 前端页面的完整待办事项应用。
从纯前端（D1-D7）进入后端开发，学习服务器、路由、RESTful API、SQLite 数据库等概念。

## 技术栈

- **运行时**：Node.js
- **Web 框架**：Express
- **数据库**：SQLite（文件数据库，零配置）
- **前端**：HTML + CSS + 原生 JavaScript（fetch API）

## 项目结构

```
07-todo-api/
├── server/                ← 后端代码
│   ├── package.json       ← Node.js 依赖
│   ├── server.js          ← 入口文件
│   ├── api.js             ← RESTful 接口
│   └── db.js              ← SQLite 数据库
├── public/                ← 前端静态文件
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .gitignore
└── README.md
```

## 安装和运行

### 前提条件

- 安装 Node.js（v18+）
- 安装 Git

### 安装依赖

```bash
cd 07-todo-api/server
npm install
```

### 启动服务

```bash
cd server
node server.js
```

浏览器访问 `http://localhost:3000`

## API 接口

| 方法 | URL | 说明 |
|------|-----|------|
| GET | `/api/todos` | 获取所有待办 |
| POST | `/api/todos` | 添加待办 |
| PUT | `/api/todos/:id` | 切换完成状态 |
| PUT | `/api/todos/:id/text` | 修改文字 |
| DELETE | `/api/todos/:id` | 删除待办 |
| POST | `/api/todos/clear-done` | 清除已完成 |
| POST | `/api/todos/clear-all` | 清除全部 |

## 收获

- Node.js 运行时和 npm 包管理
- Express 框架：中间件、路由
- RESTful API 设计
- SQLite 数据库操作
- fetch API 前端调用后端
- 前后端分离架构

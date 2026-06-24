# 统一工具箱（D8-D17 整合项目）

## 项目简介

Node.js + Express 全栈应用，整合了 5 个工具模块：待办事项、Excel 处理、图片处理、网页爬虫、OCR 识别。从纯前端（D1-D7）进入后端开发，学习服务器、路由、RESTful API、SQLite 数据库等概念。

## 技术栈

- **运行时**：Node.js
- **Web 框架**：Express v4
- **数据库**：SQLite（sql.js，纯 JS 无需编译）
- **文件上传**：multer
- **前端**：HTML + CSS + 原生 JavaScript（fetch API）
- **Excel**：xlsx
- **图片处理**：sharp
- **网页爬虫**：undici + cheerio
- **PDF 解析**：pdf-parse

## 项目结构

```
07-todo-api/
├── server.js              ← 统一入口（Express 服务器）
├── index.js               ← Railway 部署入口
├── package.json           ← 依赖配置
├── server/
│   ├── excel/
│   │   └── router.js      ← Excel 数据处理 API
│   ├── image/
│   │   └── router.js      ← 图片处理 API
│   ├── ocr/
│   │   └── router.js      ← OCR 识别 API
│   ├── scraper/
│   │   └── router.js      ← 网页爬虫 API
│   └── db.js              ← SQLite 数据库
├── public/
│   ├── index.html         ← 首页（工具箱导航）
│   ├── todo/              ← 待办事项前端
│   ├── excel/             ← Excel 处理前端
│   ├── image/             ← 图片处理前端
│   ├── scraper/           ← 网页爬虫前端
│   └── ocr/               ← OCR 识别前端
├── uploads/               ← 上传文件临时目录
└── exports/               ← 导出文件目录
```

## 部署信息

- **GitHub**：https://github.com/GitWuYanZu18/todo-api
- **Railway**：https://todo-api-production-be83.up.railway.app
- **Railway 部署日期**：2026-06-24

## 安装和运行

### 前提条件

- 安装 Node.js（v18+）
- 安装 Git

### 安装依赖

```bash
cd 07-todo-api
npm install
```

### 启动服务

```bash
cd 07-todo-api
node server.js
```

浏览器访问 `http://localhost:3000`

## 功能模块

### 1. 待办事项
| 方法 | URL | 说明 |
|------|-----|------|
| GET | `/todo` | 待办事项页面 |
| GET | `/api/todos` | 获取所有待办 |
| POST | `/api/todos` | 添加待办 |
| PUT | `/api/todos/:id` | 切换完成状态 |
| PUT | `/api/todos/:id/text` | 修改文字 |
| DELETE | `/api/todos/:id` | 删除待办 |
| POST | `/api/todos/clear-done` | 清除已完成 |
| POST | `/api/todos/clear-all` | 清除全部 |

### 2. Excel 批量处理
| 方法 | URL | 说明 |
|------|-----|------|
| GET | `/tools/excel` | Excel 处理页面 |
| POST | `/api/excel/read` | 读取 Excel 文件 |
| POST | `/api/excel/merge` | 合并多个 Sheet |
| POST | `/api/excel/filter` | 筛选数据 |
| POST | `/api/excel/sort` | 排序数据 |
| POST | `/api/excel/deduplicate` | 数据去重 |
| POST | `/api/excel/export-csv` | 导出为 CSV |
| GET | `/api/excel/download/:filename` | 下载文件 |

### 3. 图片批量处理
| 方法 | URL | 说明 |
|------|-----|------|
| GET | `/tools/image` | 图片处理页面 |
| POST | `/api/img/compress` | 图片压缩 |
| POST | `/api/img/resize` | 图片缩放 |
| POST | `/api/img/watermark` | 添加水印 |
| POST | `/api/img/convert` | 格式转换 |
| POST | `/api/img/batch` | 批量处理 |
| GET | `/api/img/download/:filename` | 下载文件 |

### 4. 网页数据采集
| 方法 | URL | 说明 |
|------|-----|------|
| GET | `/tools/scraper` | 爬虫页面 |
| POST | `/api/scraper/fetch` | 简单抓取 |
| POST | `/api/scraper/fetch-list` | 列表抓取 |
| POST | `/api/scraper/export` | 导出 Excel/CSV |
| GET | `/api/scraper/download/:filename` | 下载文件 |

### 5. OCR 文字识别
| 方法 | URL | 说明 |
|------|-----|------|
| GET | `/tools/ocr` | OCR 页面 |
| POST | `/api/ocr/pdf` | PDF 文字提取 |
| POST | `/api/ocr/image` | 图片上传（前端 Tesseract.js 处理） |

## 阶段三任务：第一笔收入（第4-5周）

### 已完成
- [x] Excel 处理工具（08-excel-tools → 整合到本项目的 Excel 模块）
- [x] 图片批量处理工具（09-image-tools → 整合到本项目的图片模块）
- [x] 爬虫/数据采集工具（10-scraper → 整合到本项目的爬虫模块）
- [x] OCR 识别工具（11-ocr → 整合到本项目的 OCR 模块）
- [x] 统一工具箱入口（server.js，5 个模块整合到一个项目）

### 待完成
- [ ] 注册闲鱼账号，上架服务（搜"闲鱼 代做 自动化"参考同行写法）
- [ ] 第一个客户（定价：200-500 元，不嫌钱少，先跑通流程）

### 变现渠道优先级

#### 国内（优先）
1. **闲鱼** — 门槛最低，适合零基础起步
2. **小红书** — 发作品展示能力，引流到微信成交
3. **微信社群** — 本地商家群、创业者群、技术群
4. **猪八戒/一品威客** — 大平台但竞争激烈
5. **淘宝店合作** — 找商家接私活

#### 国外（后期）
6. **Fiverr** — 适合自动化脚本/小工具（需翻墙+PayPal）
7. **Upwork** — 项目大但竞争激烈（需翻墙）

## 收获

- Node.js 运行时和 npm 包管理
- Express 框架：中间件、路由、静态文件服务
- RESTful API 设计
- SQLite 数据库操作（sql.js）
- 文件上传处理（multer）
- fetch API 前端调用后端
- 前后端分离架构
- 多模块统一入口整合
- 爬虫技术（undici + cheerio）
- 图片处理（sharp）
- Excel 数据处理（xlsx）

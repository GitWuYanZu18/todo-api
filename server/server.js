// server.js - 启动服务器的入口文件
// 把所有组件组装起来：中间件 + 路由 + 静态文件

const express = require('express');
const path = require('path');

// 创建 Express 应用实例（你的 Web 服务器）
const app = express();

// =============================
// 中间件配置
// =============================

// express.json() 中间件：自动把 JSON 格式的请求体解析为 JavaScript 对象
// 前端发 POST/PUT 请求时需要这个
app.use(express.json());

// express.static() 中间件：提供静态文件服务
// 访问 / 时会自动找 public/index.html
// 访问 style.css、app.js 也能直接找到
// 注意：先注册 API 路由，再服务静态文件，避免 "/" 路径被 static 拦截

// 先导入并挂载 API 路由
const apiRouter = require('./api');
app.use('/api', apiRouter);

// 再服务静态文件
app.use(express.static(path.join(__dirname, 'public')));

// =============================
// 启动服务器
// =============================
// 端口号：部署时用环境变量 PORT，本地开发用 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log('========================================');
    console.log('服务器已启动！');
    console.log('本地访问：http://localhost:' + PORT);
    console.log('========================================');
});

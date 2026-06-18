// server_root.js - 启动服务器的入口文件（用于 Railway 部署）
// 所有文件都在根目录下，方便 Railway 直接运行

const express = require('express');
const path = require('path');

// 创建 Express 应用实例（你的 Web 服务器）
const app = express();

// =============================
// 中间件配置
// =============================

// express.json() 中间件：自动把 JSON 格式的请求体解析为 JavaScript 对象
app.use(express.json());

// =============================
// 导入并挂载 API 路由
// =============================
const apiRouter = require('./api');
app.use('/api', apiRouter);

// express.static() 中间件：提供静态文件服务
// 访问 / 时会自动找 public/index.html
app.use(express.static(path.join(__dirname, 'public')));

// =============================
// 启动服务器
// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log('========================================');
    console.log('服务器已启动！');
    console.log('本地访问：http://localhost:' + PORT);
    console.log('========================================');
});

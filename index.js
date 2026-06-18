// index.js - Railway 入口文件
// Railway Railpack 自动寻找 index.js 作为主入口
// 直接创建 Express 应用并启动

const express = require('express');
const path = require('path');

const app = express();

// 解析 JSON 请求体
app.use(express.json());

// 挂载 API 路由
const apiRouter = require('./api');
app.use('/api', apiRouter);

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log('========================================');
    console.log('服务器已启动！');
    console.log('本地访问：http://localhost:' + PORT);
    console.log('========================================');
});

// 导出供 Railway 检测
module.exports = app;

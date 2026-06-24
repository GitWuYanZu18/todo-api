// server.js - 统一 Express 服务器
// 整合：待办事项 + Excel + 图片 + 爬虫 + OCR

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// =============================
// 共享目录
// =============================
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const EXPORT_DIR = path.join(__dirname, '..', 'exports');
[UPLOAD_DIR, EXPORT_DIR].forEach(function (dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// =============================
// 共享 multer 配置
// =============================
const multer = require('multer');
const upload = multer({ dest: UPLOAD_DIR, limits: { fileSize: 20 * 1024 * 1024 } });

// =============================
// 待办事项 API（内嵌，不再依赖 server/api.js）
// =============================

function getTodoRows() {
    const rows = db.all('SELECT * FROM todos');
    for (let i = 0; i < rows.length; i++) {
        rows[i].done = rows[i].done === 1;
    }
    return rows;
}

app.get('/api/todos', function (req, res) {
    res.json(getTodoRows());
});

app.post('/api/todos', function (req, res) {
    const text = req.body.text;
    if (!text || text.trim() === '') {
        return res.status(400).json({ error: '文字不能为空' });
    }
    const result = db.run('INSERT INTO todos (text, done) VALUES (?, ?)', [text.trim(), 0]);
    res.json({ id: result.lastInsertRowid, text: text.trim(), done: false });
});

app.put('/api/todos/:id', function (req, res) {
    const id = req.params.id;
    const todo = db.get('SELECT * FROM todos WHERE id = ?', [id]);
    if (!todo) {
        return res.status(404).json({ error: '没有找到该待办' });
    }
    const newDone = todo.done ? 0 : 1;
    db.run('UPDATE todos SET done = ? WHERE id = ?', [newDone, id]);
    res.json({ id: todo.id, text: todo.text, done: newDone });
});

app.put('/api/todos/:id/text', function (req, res) {
    const id = req.params.id;
    const text = req.body.text;
    if (!text || text.trim() === '') {
        return res.status(400).json({ error: '文字不能为空' });
    }
    const todo = db.get('SELECT * FROM todos WHERE id = ?', [id]);
    if (!todo) {
        return res.status(404).json({ error: '没有找到该待办' });
    }
    db.run('UPDATE todos SET text = ? WHERE id = ?', [text.trim(), id]);
    res.json({ id: todo.id, text: text.trim(), done: todo.done });
});

app.delete('/api/todos/:id', function (req, res) {
    db.run('DELETE FROM todos WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
});

app.post('/api/todos/clear-done', function (req, res) {
    db.run('DELETE FROM todos WHERE done = ?', [1]);
    res.json({ ok: true });
});

app.post('/api/todos/clear-all', function (req, res) {
    db.run('DELETE FROM todos');
    res.json({ ok: true });
});

// =============================
// 挂载第三方 API 路由
// =============================
app.use('/api/excel', require('./server/excel/router')(upload));
app.use('/api/img', require('./server/image/router')(upload));
app.use('/api/scraper', require('./server/scraper/router'));
app.use('/api/ocr', require('./server/ocr/router')(upload));

// =============================
// 前端路由
// =============================
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});
app.get('/todo', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'todo', 'index.html'));
});
app.get('/tools/excel', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'excel', 'index.html'));
});
app.get('/tools/image', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'image', 'index.html'));
});
app.get('/tools/scraper', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'scraper', 'index.html'));
});
app.get('/tools/ocr', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'public', 'ocr', 'index.html'));
});

// 静态资源
app.use(express.static(path.join(__dirname, '..', 'public')));

// =============================
// 启动
// =============================
const PORT = process.env.PORT || 3000;

// 延迟加载 db（需要先初始化数据库）
const db = require('./server/db');

db.init().then(function () {
    app.listen(PORT, function () {
        console.log('========================================');
        console.log('统一工具箱已启动！');
        console.log('首页：http://localhost:' + PORT + '/');
        console.log('========================================');
    });
}).catch(function (err) {
    console.error('数据库初始化失败：', err);
    process.exit(1);
});

module.exports = app;

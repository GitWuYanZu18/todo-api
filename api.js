// api.js - 待办事项的所有 API 接口
// 每个函数处理一个 HTTP 请求
// 遵循 RESTful 规范：GET=读，POST=创建，PUT=更新，DELETE=删除

const express = require('express');
const router = express.Router(); // 创建路由控制器

// 导入数据库
const db = require('./db');

// =============================
// GET /api/todos - 获取所有待办
// =============================
router.get('/todos', function (req, res) {
    // 从数据库查询所有待办
    // .all() 返回所有行
    const todos = db.prepare('SELECT * FROM todos').all();

    // 把 done 从 0/1 转为 false/true，方便前端使用
    for (let i = 0; i < todos.length; i++) {
        todos[i].done = todos[i].done === 1;
    }

    // 返回 JSON 数据
    res.json(todos);
});

// =============================
// POST /api/todos - 添加待办
// =============================
router.post('/todos', function (req, res) {
    // req.body 是前端传来的数据
    const text = req.body.text;

    // 简单验证：不能为空
    if (!text || text.trim() === '') {
        return res.status(400).json({ error: '文字不能为空' });
    }

    // 插入数据库
    // .run() 返回受影响行数，包含 lastInsertRowid（新记录的 ID）
    // 使用 ? 占位符防止 SQL 注入
    const result = db.prepare(
        'INSERT INTO todos (text, done) VALUES (?, ?)'
    ).run(text.trim(), 0);

    // 返回新创建的待办项
    res.json({
        id: result.lastInsertRowid,
        text: text.trim(),
        done: false
    });
});

// =============================
// PUT /api/todos/:id - 切换完成状态
// =============================
router.put('/todos/:id', function (req, res) {
    const id = req.params.id; // 从 URL 路径中提取 id

    // 先查这条记录是否存在
    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);

    if (!todo) {
        return res.status(404).json({ error: '没有找到该待办' });
    }

    // 切换 done 状态：0->1, 1->0
    const newDone = todo.done === 0 ? 1 : 0;

    // 更新数据库
    db.prepare('UPDATE todos SET done = ? WHERE id = ?').run(newDone, id);

    // 返回更新后的数据
    res.json({
        id: todo.id,
        text: todo.text,
        done: newDone === 1
    });
});

// =============================
// PUT /api/todos/:id/text - 修改文字
// =============================
router.put('/todos/:id/text', function (req, res) {
    const id = req.params.id;
    const text = req.body.text;

    if (!text || text.trim() === '') {
        return res.status(400).json({ error: '文字不能为空' });
    }

    // 检查是否存在
    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    if (!todo) {
        return res.status(404).json({ error: '没有找到该待办' });
    }

    // 更新文字
    db.prepare('UPDATE todos SET text = ? WHERE id = ?').run(text.trim(), id);

    // 返回更新后的数据
    res.json({
        id: todo.id,
        text: text.trim(),
        done: todo.done === 1
    });
});

// =============================
// DELETE /api/todos/:id - 删除待办
// =============================
router.delete('/todos/:id', function (req, res) {
    const id = req.params.id;

    // 删除
    db.prepare('DELETE FROM todos WHERE id = ?').run(id);

    res.json({ ok: true });
});

// =============================
// POST /api/todos/clear-done - 清除已完成
// =============================
router.post('/todos/clear-done', function (req, res) {
    // 清除 done=1（已完成）的记录
    db.prepare('DELETE FROM todos WHERE done = ?').run(1);
    res.json({ ok: true });
});

// =============================
// POST /api/todos/clear-all - 清除全部
// =============================
router.post('/todos/clear-all', function (req, res) {
    // 清空所有记录
    db.prepare('DELETE FROM todos').run();
    res.json({ ok: true });
});

// 导出路由器
module.exports = router;

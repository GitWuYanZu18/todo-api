// db.js - SQLite 数据库初始化
// 这个文件负责：1) 创建数据库文件 2) 创建数据表
// 数据库文件会保存在 server 目录下，名为 todos.db

const Database = require('better-sqlite3');
const path = require('path');

// 创建或打开数据库文件（会自动创建 todos.db 文件）
const db = new Database(path.join(__dirname, 'todos.db'));

// 创建数据表（如果不存在）
// id = 自动增长的编号（主键）
// text = 待办文字
// done = 是否完成（0=未完成，1=已完成）
// 注意：SQLite 没有原生 boolean 类型，用 0/1 代替
db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY,
        text TEXT NOT NULL,
        done INTEGER DEFAULT 0
    )
`);

// 导出 db 对象，其他文件可以 require 它来使用数据库
module.exports = db;

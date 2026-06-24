// server/db.js - SQLite 数据库（使用 sql.js，纯 JS 无需编译）
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// 数据库文件放在 server/ 同级目录下（和根目录一致）
const DB_FILE = path.join(__dirname, '..', 'todos.db');
let db = null;

// 初始化数据库，创建 todos 表
async function init() {
    const SQL = await initSqlJs();
    let rawData = null;
    if (fs.existsSync(DB_FILE)) {
        rawData = fs.readFileSync(DB_FILE);
    }
    db = new SQL.Database(rawData);
    db.run(`
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            done INTEGER DEFAULT 0
        )
    `);
    save();
}

// 将数据库内容保存到文件
function save() {
    if (!db) return;
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
}

// 执行 SELECT，返回对象数组
function query(sql, params) {
    const result = db.exec(sql, params);
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map(function (vals) {
        const obj = {};
        columns.forEach(function (col, i) { obj[col] = vals[i]; });
        return obj;
    });
}

// SELECT * FROM ...
function all(sql, params) {
    return query(sql, params);
}

// SELECT 第一条
function get(sql, params) {
    const rows = query(sql, params);
    return rows.length > 0 ? rows[0] : undefined;
}

// INSERT / UPDATE / DELETE
function run(sql, params) {
    db.run(sql, params || []);
    save();
    const result = db.exec('SELECT last_insert_rowid()');
    return { lastInsertRowid: result[0].values[0][0] };
}

module.exports = {
    init: init,
    all: all,
    get: get,
    run: run
};

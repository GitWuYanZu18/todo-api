// server/excel/router.js - Excel 数据处理 API

const express = require('express');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

module.exports = function (uploadInstance) {
    // 上传目录
    const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

    // 1. 读取 Excel（需要上传）
    router.post('/read', uploadInstance.single('file'), function (req, res) {
        try {
            const file = req.file;
            if (!file) return res.status(400).json({ error: '请上传 Excel 文件' });
            const workbook = xlsx.readFile(file.path);
            const result = {};
            workbook.SheetNames.forEach(function (name) {
                result[name] = xlsx.utils.sheet_to_json(workbook.Sheets[name]);
            });
            res.json({ sheets: workbook.SheetNames, data: result });
        } catch (err) {
            res.status(500).json({ error: '读取失败：' + err.message });
        }
    });

    // 2. 合并
    router.post('/merge', function (req, res) {
        try {
            const { sheets, outputName } = req.body;
            if (!sheets || !Array.isArray(sheets) || sheets.length === 0) {
                return res.status(400).json({ error: '请提供要合并的数据' });
            }
            const workbook = xlsx.utils.book_new();
            sheets.forEach(function (sheet) {
                const ws = xlsx.utils.json_to_sheet(sheet.data || []);
                xlsx.utils.book_append_sheet(workbook, ws, sheet.name || 'Sheet');
            });
            const filename = (outputName || '合并结果') + '.xlsx';
            const filePath = path.join(UPLOAD_DIR, uuidv4() + '-' + filename);
            xlsx.writeFile(workbook, filePath);
            res.json({ filename: filename, downloadUrl: '/api/excel/download/' + filePath });
        } catch (err) {
            res.status(500).json({ error: '合并失败：' + err.message });
        }
    });

    // 3. 筛选
    router.post('/filter', function (req, res) {
        try {
            const { data, column, condition, value } = req.body;
            if (!data || !Array.isArray(data)) return res.status(400).json({ error: '请提供数据' });
            let filtered;
            switch (condition) {
                case 'gt':
                    filtered = data.filter(function (row) { return Number(row[column]) > Number(value); }); break;
                case 'lt':
                    filtered = data.filter(function (row) { return Number(row[column]) < Number(value); }); break;
                case 'eq':
                    filtered = data.filter(function (row) { return row[column] === value; }); break;
                case 'contains':
                    filtered = data.filter(function (row) { return String(row[column]).includes(String(value)); }); break;
                default:
                    return res.status(400).json({ error: '不支持的筛选条件' });
            }
            res.json(filtered);
        } catch (err) {
            res.status(500).json({ error: '筛选失败：' + err.message });
        }
    });

    // 4. 排序
    router.post('/sort', function (req, res) {
        try {
            const { data, column, order } = req.body;
            if (!data || !Array.isArray(data)) return res.status(400).json({ error: '请提供数据' });
            const sorted = data.slice().sort(function (a, b) {
                const va = Number(a[column]) || a[column] || '';
                const vb = Number(b[column]) || b[column] || '';
                if (typeof va === 'number' && typeof vb === 'number') {
                    return order === 'asc' ? va - vb : vb - va;
                }
                return order === 'asc'
                    ? String(va).localeCompare(String(vb), 'zh')
                    : String(vb).localeCompare(String(va), 'zh');
            });
            res.json(sorted);
        } catch (err) {
            res.status(500).json({ error: '排序失败：' + err.message });
        }
    });

    // 5. 去重
    router.post('/deduplicate', function (req, res) {
        try {
            const { data, keyColumn } = req.body;
            if (!data || !Array.isArray(data)) return res.status(400).json({ error: '请提供数据' });
            const seen = new Set();
            const unique = data.filter(function (row) {
                const key = String(row[keyColumn]);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            res.json({ originalCount: data.length, uniqueCount: unique.length, removedCount: data.length - unique.length, data: unique });
        } catch (err) {
            res.status(500).json({ error: '去重失败：' + err.message });
        }
    });

    // 6. 下载
    router.get('/download/:filename', function (req, res) {
        try {
            const filePath = path.join(UPLOAD_DIR, req.params.filename);
            if (!filePath.startsWith(UPLOAD_DIR)) return res.status(403).json({ error: '非法请求' });
            if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
            res.download(filePath);
        } catch (err) {
            res.status(500).json({ error: '下载失败：' + err.message });
        }
    });

    // 7. CSV 导出
    router.post('/export-csv', function (req, res) {
        try {
            const { sheetName, data } = req.body;
            if (!data || !Array.isArray(data)) return res.status(400).json({ error: '请提供数据' });
            const ws = xlsx.utils.json_to_sheet(data);
            const csv = xlsx.utils.sheet_to_csv(ws);
            const filename = (sheetName || 'data') + '.csv';
            const bom = '﻿';
            const filePath = path.join(UPLOAD_DIR, uuidv4() + '-' + filename);
            fs.writeFileSync(filePath, bom + csv, 'utf8');
            res.json({ filename: filename, downloadUrl: '/api/excel/download/' + filePath });
        } catch (err) {
            res.status(500).json({ error: '导出失败：' + err.message });
        }
    });

    return router;
};

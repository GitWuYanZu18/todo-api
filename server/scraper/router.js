// server/scraper/router.js - 网页抓取 API

const express = require('express');
const { fetch } = require('undici');
const cheerio = require('cheerio');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const EXPORT_DIR = path.join(__dirname, '..', '..', 'exports');

// 确保导出目录存在
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

// =============================
// 1. 简单抓取
// =============================
router.post('/fetch', async function (req, res) {
    const { url, selectors } = req.body;
    if (!url) return res.status(400).json({ error: '请输入网址' });
    if (!selectors || !Array.isArray(selectors)) {
        return res.status(400).json({ error: '请至少指定一个 CSS 选择器' });
    }

    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml'
            }
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        const results = [];
        selectors.forEach(function (sel) {
            const items = [];
            $(sel).each(function (i, el) {
                items.push({
                    text: $(el).text().trim(),
                    attributes: el.attribs || {}
                });
            });
            results.push({ selector: sel, count: items.length, items: items });
        });

        res.json({ url: targetUrl, results: results });
    } catch (err) {
        res.status(500).json({ error: '抓取失败：' + err.message });
    }
});

// =============================
// 2. 列表抓取
// =============================
router.post('/fetch-list', async function (req, res) {
    const { url, itemSelector, fields } = req.body;
    if (!url || !itemSelector || !fields) {
        return res.status(400).json({ error: '请填写所有必填项' });
    }

    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;

    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        const items = [];
        $(itemSelector).each(function (i, itemEl) {
            const record = {};
            fields.forEach(function (field) {
                const target = field.selector ? $(itemEl).find(field.selector) : $(itemEl);
                record[field.name] = target.text().trim();
            });
            items.push(record);
        });

        res.json({ url: targetUrl, itemCount: items.length, data: items });
    } catch (err) {
        res.status(500).json({ error: '抓取失败：' + err.message });
    }
});

// =============================
// 3. 导出
// =============================
router.post('/export', function (req, res) {
    try {
        const { filename, data, format } = req.body;
        const fmt = format || 'xlsx';
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: '请提供数据' });
        }

        if (fmt === 'csv') {
            const ws = xlsx.utils.json_to_sheet(data);
            const csv = xlsx.utils.sheet_to_csv(ws);
            const bom = '﻿';
            const filePath = path.join(EXPORT_DIR, (filename || 'data') + '.csv');
            fs.writeFileSync(filePath, bom + csv, 'utf8');
            res.json({ downloadUrl: '/api/scraper/download/' + encodeURIComponent(filename || 'data') + '.csv' });
        } else {
            const ws = xlsx.utils.json_to_sheet(data);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, '数据');
            const filePath = path.join(EXPORT_DIR, (filename || 'data') + '.xlsx');
            xlsx.writeFile(wb, filePath);
            res.json({ downloadUrl: '/api/scraper/download/' + encodeURIComponent(filename || 'data') + '.xlsx' });
        }
    } catch (err) {
        res.status(500).json({ error: '导出失败：' + err.message });
    }
});

// =============================
// 4. 下载
// =============================
router.get('/download/:filename', function (req, res) {
    try {
        const fileName = Buffer.from(req.params.filename, 'latin1').toString('utf8');
        const filePath = path.join(EXPORT_DIR, fileName);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
        res.download(filePath);
    } catch (err) {
        res.status(500).json({ error: '下载失败：' + err.message });
    }
});

module.exports = router;

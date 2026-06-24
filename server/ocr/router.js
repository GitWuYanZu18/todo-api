// server/ocr/router.js - OCR 文字识别 API

const express = require('express');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

module.exports = function (uploadInstance) {
    const router = express.Router();
    const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    // 1. PDF 文字提取
    router.post('/pdf', uploadInstance.single('file'), async function (req, res) {
        if (!req.file) return res.status(400).json({ error: '请上传 PDF 文件' });
        try {
            const dataBuffer = fs.readFileSync(req.file.path);
            const data = await pdfParse(dataBuffer);
            fs.unlinkSync(req.file.path);
            res.json({ text: data.text, pages: data.numpages });
        } catch (err) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            res.status(500).json({ error: 'PDF 解析失败：' + err.message });
        }
    });

    // 2. 图片上传（前端用 Tesseract.js 处理）
    router.post('/image', uploadInstance.single('image'), function (req, res) {
        if (!req.file) return res.status(400).json({ error: '请上传图片文件' });

        if (req.file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(req.file.path);
            pdfParse(dataBuffer).then(function (data) {
                fs.unlinkSync(req.file.path);
                res.json({ text: data.text, pages: data.numpages });
            }).catch(function (err) {
                fs.unlinkSync(req.file.path);
                res.status(500).json({ error: 'PDF 解析失败：' + err.message });
            });
        } else {
            const ext = path.extname(req.file.originalname);
            const savePath = path.join(UPLOAD_DIR, 'ocr_' + Date.now() + ext);
            fs.renameSync(req.file.path, savePath);
            res.json({ path: savePath, message: '图片已上传，请前端运行 OCR' });
        }
    });

    return router;
};

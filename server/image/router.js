// server/image/router.js - 图片处理 API

const express = require('express');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

module.exports = function (uploadInstance) {
    const router = express.Router();
    const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

    // 辅助函数
    function processImage(file, buildPipeline) {
        return new Promise(function (resolve, reject) {
            const pipeline = buildPipeline(file.path);
            pipeline.toFile(file.path + '.out').then(resolve).catch(reject);
        });
    }

    // 1. 压缩
    router.post('/compress', uploadInstance.single('file'), async function (req, res) {
        try {
            const file = req.file;
            if (!file) return res.status(400).json({ error: '请上传图片' });
            const q = parseInt(req.body.quality) || 80;
            const fmt = req.body.format || 'jpeg';
            const outPath = file.path + '.out.' + fmt;
            await sharp(file.path)[fmt === 'png' ? 'png({quality:' + q + '})' : fmt === 'webp' ? 'webp({quality:' + q + '})' : 'jpeg({quality:' + q + '})']().toFile(outPath);
            // 注意：上面链式调用写法不适用于 sharp，需要用正确方式
            const output = sharp(file.path);
            if (fmt === 'png') output.png({ quality: q });
            else if (fmt === 'webp') output.webp({ quality: q });
            else output.jpeg({ quality: q });
            await output.toFile(outPath);
            const origSize = fs.statSync(file.path).size;
            const newSize = fs.statSync(outPath).size;
            const ratio = ((1 - newSize / origSize) * 100).toFixed(1);
            res.json({ downloadUrl: '/api/img/download/' + path.basename(outPath), originalSize: origSize, compressedSize: newSize, ratio: ratio + '%' });
        } catch (err) {
            res.status(500).json({ error: '压缩失败：' + err.message });
        }
    });

    // 2. 缩放
    router.post('/resize', uploadInstance.single('file'), async function (req, res) {
        try {
            const file = req.file;
            if (!file) return res.status(400).json({ error: '请上传图片' });
            const w = parseInt(req.body.width) || null;
            const h = parseInt(req.body.height) || null;
            const fmt = req.body.format || 'jpeg';
            const outPath = file.path + '.out.' + fmt;
            const output = sharp(file.path).resize(w, h, { fit: 'inside', withoutEnlargement: true });
            if (fmt === 'png') output.png();
            else if (fmt === 'webp') output.webp();
            else output.jpeg();
            await output.toFile(outPath);
            res.json({ downloadUrl: '/api/img/download/' + path.basename(outPath) });
        } catch (err) {
            res.status(500).json({ error: '缩放失败：' + err.message });
        }
    });

    // 3. 水印
    router.post('/watermark', uploadInstance.single('file'), async function (req, res) {
        try {
            const file = req.file;
            if (!file) return res.status(400).json({ error: '请上传图片' });
            const waterText = req.body.text || '水印';
            const waterSize = parseInt(req.body.size) || 40;
            const waterOpacity = parseFloat(req.body.opacity) || 0.3;
            const metadata = await sharp(file.path).metadata();
            const { width, height } = metadata;
            const waterData = Buffer.from(
                '<svg width="' + width + '" height="' + height + '">' +
                '<text x="50%" y="50%" font-size="' + waterSize + '" fill="white" opacity="' + waterOpacity + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(-30, ' + (width / 2) + ', ' + (height / 2) + ')">' +
                waterText + '</text></svg>'
            );
            const ext = path.extname(file.originalname).replace('.', '') || 'jpeg';
            const outPath = file.path + '.out.' + ext;
            await sharp(file.path).composite([{ input: waterData, opacity: 1 }]).toFile(outPath);
            res.json({ downloadUrl: '/api/img/download/' + path.basename(outPath) });
        } catch (err) {
            res.status(500).json({ error: '水印失败：' + err.message });
        }
    });

    // 4. 格式转换
    router.post('/convert', uploadInstance.single('file'), async function (req, res) {
        try {
            const file = req.file;
            if (!file) return res.status(400).json({ error: '请上传图片' });
            const fmt = req.body.toFormat || 'jpeg';
            const outPath = file.path + '.out.' + fmt;
            const output = sharp(file.path);
            if (fmt === 'png') output.png();
            else if (fmt === 'webp') output.webp();
            else output.jpeg();
            await output.toFile(outPath);
            res.json({ downloadUrl: '/api/img/download/' + path.basename(outPath) });
        } catch (err) {
            res.status(500).json({ error: '转换失败：' + err.message });
        }
    });

    // 5. 批量处理
    router.post('/batch', uploadInstance.array('files', 20), async function (req, res) {
        try {
            const files = req.files;
            if (!files || files.length === 0) return res.status(400).json({ error: '请上传图片文件' });
            const operation = req.body.operation;
            const results = [];
            for (const file of files) {
                try {
                    if (operation === 'compress' || operation === 'resize' || operation === 'convert') {
                        let outPath = file.path + '.out';
                        if (operation === 'compress') {
                            const q = parseInt(req.body.quality) || 80;
                            const fmt = req.body.format || 'jpeg';
                            outPath += '.' + fmt;
                            const output = sharp(file.path);
                            if (fmt === 'png') output.png({ quality: q });
                            else if (fmt === 'webp') output.webp({ quality: q });
                            else output.jpeg({ quality: q });
                            await output.toFile(outPath);
                        } else if (operation === 'resize') {
                            const w = parseInt(req.body.width) || null;
                            const h = parseInt(req.body.height) || null;
                            const fmt = req.body.format || 'jpeg';
                            outPath += '.' + fmt;
                            const output = sharp(file.path).resize(w, h, { fit: 'inside', withoutEnlargement: true });
                            if (fmt === 'png') output.png();
                            else if (fmt === 'webp') output.webp();
                            else output.jpeg();
                            await output.toFile(outPath);
                        } else {
                            const fmt = req.body.format || 'jpeg';
                            outPath += '.' + fmt;
                            const output = sharp(file.path);
                            if (fmt === 'png') output.png();
                            else if (fmt === 'webp') output.webp();
                            else output.jpeg();
                            await output.toFile(outPath);
                        }
                        results.push({ name: file.originalname, downloadUrl: '/api/img/download/' + path.basename(outPath) });
                    }
                } catch (err) {
                    results.push({ name: file.originalname, error: err.message });
                }
            }
            res.json({ results: results });
        } catch (err) {
            res.status(500).json({ error: '批量处理失败：' + err.message });
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

    return router;
};

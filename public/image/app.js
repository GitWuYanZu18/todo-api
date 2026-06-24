// 09-image-tools - 前端交互逻辑（纯浏览器 Canvas 实现）

const API = '/api/img';
let files = [];       // 用户上传的文件数组
let currentFunc = 'compress';

// DOM
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const previewGrid = document.getElementById('previewGrid');
const fileCount = document.getElementById('fileCount');
const loading = document.getElementById('loading');
const resultArea = document.getElementById('resultArea');
const resultList = document.getElementById('resultList');

// =============================
// 标签页切换
// =============================

document.querySelectorAll('.func-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
        // 更新高亮
        document.querySelectorAll('.func-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentFunc = tab.dataset.func;

        // 切换面板
        document.querySelectorAll('.panel').forEach(function (p) { p.classList.add('hidden'); });
        document.getElementById('panel-' + currentFunc).classList.remove('hidden');
    });
});

// 质量滑块数值显示
document.getElementById('quality').addEventListener('input', function () {
    document.getElementById('qualityVal').textContent = this.value;
});
document.getElementById('wmSize').addEventListener('input', function () {
    document.getElementById('wmSizeVal').textContent = this.value;
});
document.getElementById('wmOpacity').addEventListener('input', function () {
    document.getElementById('wmOpacityVal').textContent = (this.value / 10).toFixed(1);
});

// =============================
// 文件选择
// =============================

fileInput.addEventListener('change', function () {
    files = Array.from(this.files);
    if (files.length === 0) return;

    fileCount.textContent = files.length;
    previewGrid.innerHTML = '';

    files.forEach(function (file, i) {
        const url = URL.createObjectURL(file);
        const img = document.createElement('img');
        img.src = url;
        img.className = 'preview-item';
        img.title = file.name;
        previewGrid.appendChild(img);
    });

    previewArea.classList.remove('hidden');
    resultArea.classList.add('hidden');
});

// =============================
// Canvas 工具函数
// =============================

function loadImage(file) {
    return new Promise(function (resolve, reject) {
        const img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

function canvasToBlob(canvas, mimeType, quality) {
    return new Promise(function (resolve) {
        canvas.toBlob(function (blob) { resolve(blob); }, mimeType, quality);
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// =============================
// 1. 压缩
// =============================

document.getElementById('btnCompress').addEventListener('click', async function () {
    if (files.length === 0) return alert('请先选择图片');

    showLoading();
    const quality = parseInt(document.getElementById('quality').value) / 100;
    const fmt = document.getElementById('compressFormat').value;
    const mimeType = 'image/' + fmt;
    const ext = fmt === 'jpeg' ? 'jpg' : fmt;

    for (let i = 0; i < files.length; i++) {
        try {
            const img = await loadImage(files[i]);
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');

            // JPEG 需要白色背景（处理透明 PNG）
            if (fmt === 'jpeg') {
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);

            const blob = await canvasToBlob(canvas, mimeType, quality);
            downloadBlob(blob, files[i].name.replace(/\.[^.]+$/, '') + '-compressed.' + ext);
        } catch (err) {
            console.error('压缩失败：', err);
        }
    }

    hideLoading();
    showResult('压缩完成！共处理 ' + files.length + ' 张图片', null);
});

// =============================
// 2. 缩放
// =============================

document.getElementById('btnResize').addEventListener('click', async function () {
    if (files.length === 0) return alert('请先选择图片');

    showLoading();
    const targetW = parseInt(document.getElementById('resizeWidth').value) || null;
    const targetH = parseInt(document.getElementById('resizeHeight').value) || null;
    const fmt = document.getElementById('resizeFormat').value;
    const mimeType = 'image/' + fmt;
    const ext = fmt === 'jpeg' ? 'jpg' : fmt;

    for (let i = 0; i < files.length; i++) {
        try {
            const img = await loadImage(files[i]);
            let w = img.naturalWidth;
            let h = img.naturalHeight;

            if (targetW && targetH) {
                w = targetW; h = targetH;
            } else if (targetW) {
                h = Math.round(h * targetW / w);
                w = targetW;
            } else if (targetH) {
                w = Math.round(w * targetH / h);
                h = targetH;
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (fmt === 'jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
            ctx.drawImage(img, 0, 0, w, h);

            const blob = await canvasToBlob(canvas, mimeType, 0.92);
            downloadBlob(blob, files[i].name.replace(/\.[^.]+$/, '') + '-' + w + 'x' + h + '.' + ext);
        } catch (err) {
            console.error('缩放失败：', err);
        }
    }

    hideLoading();
    showResult('缩放完成！共处理 ' + files.length + ' 张图片', null);
});

// =============================
// 3. 水印
// =============================

document.getElementById('btnWatermark').addEventListener('click', async function () {
    if (files.length === 0) return alert('请先选择图片');

    showLoading();
    const text = document.getElementById('watermarkText').value || '水印';
    const size = parseInt(document.getElementById('wmSize').value);
    const opacity = parseInt(document.getElementById('wmOpacity').value) / 10;

    for (let i = 0; i < files.length; i++) {
        try {
            const img = await loadImage(files[i]);
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // 画水印
            const fontSize = Math.max(12, Math.round(img.naturalWidth * size / 500));
            ctx.font = 'bold ' + fontSize + 'px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,' + opacity + ')';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-30 * Math.PI / 180);
            ctx.fillText(text, 0, 0);
            ctx.restore();

            const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
            downloadBlob(blob, files[i].name.replace(/\.[^.]+$/, '') + '-watermarked.jpg');
        } catch (err) {
            console.error('水印失败：', err);
        }
    }

    hideLoading();
    showResult('水印完成！共处理 ' + files.length + ' 张图片', null);
});

// =============================
// 4. 格式转换
// =============================

document.getElementById('btnConvert').addEventListener('click', async function () {
    if (files.length === 0) return alert('请先选择图片');

    showLoading();
    const toFmt = document.getElementById('convertTo').value;
    const mimeType = 'image/' + toFmt;
    const ext = toFmt === 'jpeg' ? 'jpg' : toFmt;

    for (let i = 0; i < files.length; i++) {
        try {
            const img = await loadImage(files[i]);
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (toFmt === 'jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
            ctx.drawImage(img, 0, 0);

            const blob = await canvasToBlob(canvas, mimeType, 0.92);
            downloadBlob(blob, files[i].name.replace(/\.[^.]+$/, '') + '.' + ext);
        } catch (err) {
            console.error('转换失败：', err);
        }
    }

    hideLoading();
    showResult('格式转换完成！共处理 ' + files.length + ' 张图片', null);
});

// =============================
// 5. 批量处理（调后端 API）
// =============================

document.getElementById('btnBatch').addEventListener('click', async function () {
    if (files.length === 0) return alert('请先选择图片');

    showLoading();
    const op = document.getElementById('batchOp').value;
    const formData = new FormData();

    files.forEach(function (file) { formData.append('files', file); });
    formData.append('operation', op);
    formData.append('quality', document.getElementById('quality').value);
    formData.append('format', document.getElementById('compressFormat').value);
    formData.append('width', document.getElementById('resizeWidth').value);
    formData.append('height', document.getElementById('resizeHeight').value);

    try {
        const resp = await fetch(API + '/batch', { method: 'POST', body: formData });
        const result = await resp.json();

        if (result.error) return alert(result.error);

        // 下载每个处理好的文件
        let downloaded = 0;
        result.results.forEach(function (item) {
            if (item.downloadUrl) {
                window.location.href = item.downloadUrl;
                downloaded++;
            }
        });

        hideLoading();
        showResult('批量处理完成！下载了 ' + downloaded + ' 个文件', null);
    } catch (err) {
        hideLoading();
        alert('批量处理失败：' + err.message);
    }
});

// =============================
// 工具函数
// =============================

function showLoading() { loading.classList.remove('hidden'); }
function hideLoading() { loading.classList.add('hidden'); }

function showResult(msg, images) {
    resultList.innerHTML = '<div class="result-item">' +
        '<span>' + msg + '</span></div>';
    resultArea.classList.remove('hidden');
}

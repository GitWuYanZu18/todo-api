// 11-ocr - 前端交互

const API = '/api/ocr';
const loading = document.getElementById('loading');
const resultArea = document.getElementById('resultArea');
const resultText = document.getElementById('resultText');

// 标签切换
document.querySelectorAll('.func-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
        document.querySelectorAll('.func-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        const func = tab.dataset.func;
        ['image', 'pdf', 'qr'].forEach(function (f) {
            document.getElementById('panel-' + f).classList.toggle('hidden', f !== func);
        });
    });
});

// =============================
// 图片 OCR
// =============================
const imgPreview = document.getElementById('imgPreview');
const imgFileInput = document.getElementById('imgFile');
let imgDataUrl = null;

imgFileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        imgDataUrl = ev.target.result;
        imgPreview.src = imgDataUrl;
        imgPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

document.getElementById('btnOcr').addEventListener('click', async function () {
    if (!imgDataUrl) return alert('请先选择图片');
    const lang = document.getElementById('ocrLang').value;
    const btn = this;
    btn.disabled = true;
    showLoading('正在初始化 OCR 引擎，请稍候...');

    try {
        // 使用 tesseract.js 在浏览器端运行 OCR
        const result = await Tesseract.recognize(imgDataUrl, lang, {
            logger: function (m) {
                if (m.status) {
                    const pct = m.progress ? Math.round(m.progress * 100) : 0;
                    updateLoading('识别中... ' + pct + '%（' + m.status + '）');
                }
            }
        });
        const text = result.data.text.trim();
        showResult(text);
        hideLoading();
    } catch (err) {
        alert('OCR 识别失败：' + err.message);
        hideLoading();
    }
    btn.disabled = false;
});

// =============================
// PDF 文字提取
// =============================
const pdfFileInput = document.getElementById('pdfFile');

pdfFileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    // 用 pdf.js 或后端解析显示页数
    fetch(API + '/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name })
    }).catch(function () {
        document.getElementById('pdfPageCount').textContent = '通过后端解析';
    });
});

document.getElementById('btnPdfExtract').addEventListener('click', async function () {
    const file = pdfFileInput.files[0];
    if (!file) return alert('请先选择 PDF 文件');
    const formData = new FormData();
    formData.append('file', file);
    const btn = this;
    btn.disabled = true;
    showLoading('正在提取文字...');

    try {
        const resp = await fetch(API + '/pdf', { method: 'POST', body: formData });
        const result = await resp.json();
        if (result.error) throw new Error(result.error);
        document.getElementById('pdfPageCount').textContent = result.pages || 1;
        showResult(result.text);
    } catch (err) {
        alert('PDF 提取失败：' + err.message);
    }
    btn.disabled = false;
    hideLoading();
});

// =============================
// 二维码识别
// =============================
const qrPreview = document.getElementById('qrPreview');
const qrFileInput = document.getElementById('qrFile');

qrFileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        qrDataUrl = ev.target.result;
        qrPreview.src = qrDataUrl;
        qrPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

let qrDataUrl = null;

document.getElementById('btnQrDecode').addEventListener('click', function () {
    if (!qrDataUrl) return alert('请先选择图片');
    showLoading('正在识别二维码...');

    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // jsQR 库
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
            showResult('发现二维码/条形码：\n\n' + code.data + '\n\n类型：' + code.type);
        } else {
            showResult('未检测到二维码/条形码');
        }
        hideLoading();
    };
    img.src = qrDataUrl;
});

// =============================
// 通用
// =============================
function showResult(text) {
    resultText.value = text;
    resultArea.classList.remove('hidden');
}

function showLoading(msg) { loading.textContent = msg || '处理中...'; loading.classList.remove('hidden'); }
function updateLoading(msg) { loading.textContent = msg; }
function hideLoading() { loading.classList.add('hidden'); }

document.getElementById('btnCopy').addEventListener('click', function () {
    resultText.select();
    document.execCommand('copy');
    this.textContent = '已复制！';
    setTimeout(function () { document.getElementById('btnCopy').textContent = '复制结果'; }, 1500);
});

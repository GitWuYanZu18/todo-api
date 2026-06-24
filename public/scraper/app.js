// 10-scraper - 前端交互

const API = '/api/scraper';
let lastResult = [];

const btnFetch = document.getElementById('btnFetch');
const btnFetchList = document.getElementById('btnFetchList');
const loading = document.getElementById('loading');
const resultArea = document.getElementById('resultArea');
const resultContent = document.getElementById('resultContent');

// 标签切换
document.querySelectorAll('.func-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
        document.querySelectorAll('.func-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        const func = tab.dataset.func;
        document.getElementById('panel-simple').classList.toggle('hidden', func !== 'simple');
        document.getElementById('panel-list').classList.toggle('hidden', func !== 'list');
    });
});

// 添加/删除选择器行
document.getElementById('btnAddSel').addEventListener('click', function () {
    const div = document.createElement('div');
    div.className = 'selector-row';
    div.innerHTML = '<input type="text" class="sel-input" placeholder="CSS 选择器">' +
        '<button class="btn-remove-sel">✕</button>';
    document.getElementById('selectors').appendChild(div);
});
document.getElementById('selectors').addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-remove-sel')) e.target.parentElement.remove();
});

// 添加/删除字段行
document.getElementById('btnAddField').addEventListener('click', function () {
    const div = document.createElement('div');
    div.className = 'field-row';
    div.innerHTML = '<input type="text" class="fname" placeholder="字段名">' +
        '<input type="text" class="fselector" placeholder="选择器">' +
        '<button class="btn-remove-field">✕</button>';
    document.getElementById('fields').appendChild(div);
});
document.getElementById('fields').addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-remove-field')) e.target.parentElement.remove();
});

// 简单抓取
btnFetch.addEventListener('click', async function () {
    const url = document.getElementById('url').value.trim();
    const selectors = [];
    document.querySelectorAll('.sel-input').forEach(function (input) {
        if (input.value.trim()) selectors.push(input.value.trim());
    });
    if (!url) return alert('请输入网址');
    if (selectors.length === 0) return alert('请至少添加一个选择器');

    showLoading('正在抓取 ' + url + ' ...');
    try {
        const resp = await fetch(API + '/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url, selectors: selectors })
        });
        const result = await resp.json();
        if (result.error) return alert(result.error);
        lastResult = [];
        renderSimpleResult(result);
    } catch (err) {
        alert('抓取失败：' + err.message);
    } finally {
        hideLoading();
    }
});

// 列表抓取
btnFetchList.addEventListener('click', async function () {
    const url = document.getElementById('url').value.trim();
    const itemSelector = document.getElementById('itemSel').value.trim();

    const fields = [];
    document.querySelectorAll('.field-row').forEach(function (row) {
        const name = row.querySelector('.fname').value.trim();
        const selector = row.querySelector('.fselector').value.trim();
        if (name) fields.push({ name: name, selector: selector || null });
    });

    if (!url) return alert('请输入网址');
    if (!itemSelector) return alert('请输入列表项选择器');
    if (fields.length === 0) return alert('请至少添加一个字段');

    showLoading('正在抓取 ' + url + ' ...');
    try {
        const resp = await fetch(API + '/fetch-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url, itemSelector: itemSelector, fields: fields })
        });
        const result = await resp.json();
        if (result.error) return alert(result.error);
        lastResult = result.data;
        renderListResult(result);
    } catch (err) {
        alert('抓取失败：' + err.message);
    } finally {
        hideLoading();
    }
});

// 渲染结果
function renderSimpleResult(result) {
    let html = '<p>网址：<strong>' + esc(result.url) + '</strong></p>';
    result.results.forEach(function (block) {
        html += '<div class="result-block">';
        html += '<div class="result-block-title">选择器：' + esc(block.selector) +
            ' — 找到 ' + block.count + ' 个元素</div>';
        if (block.error) {
            html += '<div style="padding:10px;color:#e74c3c;">' + block.error + '</div>';
        } else {
            html += '<table class="result-table"><thead><tr><th>#</th><th>文本</th></tr></thead><tbody>';
            block.items.forEach(function (item) {
                html += '<tr><td>' + item.index + '</td><td>' + esc(item.text) + '</td></tr>';
            });
            html += '</tbody></table>';
        }
        html += '</div>';
    });
    resultContent.innerHTML = html;
    resultArea.classList.remove('hidden');
}

function renderListResult(result) {
    if (result.data.length === 0) {
        resultContent.innerHTML = '<p>未找到列表项</p>';
        resultArea.classList.remove('hidden');
        return;
    }
    const cols = Object.keys(result.data[0]);
    let html = '<p>共找到 <strong>' + result.itemCount + '</strong> 条记录</p>';
    html += '<table class="result-table"><thead><tr><th>#</th>';
    cols.forEach(function (c) { html += '<th>' + esc(c) + '</th>'; });
    html += '</tr></thead><tbody>';
    result.data.forEach(function (row, i) {
        html += '<tr><td>' + (i + 1) + '</td>';
        cols.forEach(function (c) { html += '<td>' + esc(row[c] || '') + '</td>'; });
        html += '</tr>';
    });
    html += '</tbody></table>';
    resultContent.innerHTML = html;
    resultArea.classList.remove('hidden');
}

// 导出
document.getElementById('btnExportExcel').addEventListener('click', function () { exportData('xlsx'); });
document.getElementById('btnExportCsv').addEventListener('click', function () { exportData('csv'); });

function exportData(format) {
    if (lastResult.length === 0) return alert('没有可导出的数据');
    showLoading('正在导出...');
    fetch(API + '/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: '抓取结果', data: lastResult, format: format })
    }).then(function (r) { return r.json(); })
      .then(function (result) {
          if (result.error) return alert(result.error);
          window.location.href = result.downloadUrl;
      }).catch(function (err) { alert('导出失败：' + err.message); })
      .finally(function () { hideLoading(); });
}

function showLoading(msg) { loading.textContent = msg || '处理中...'; loading.classList.remove('hidden'); }
function hideLoading() { loading.classList.add('hidden'); }
function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

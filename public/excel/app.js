// 08-excel-tools - 前端交互逻辑

const API = '/api/excel';

// 存储所有 sheet 的数据
let allSheets = {};       // { sheetName: [row1, row2, ...] }
let activeSheet = '';     // 当前选中的 sheet 名
let currentData = [];     // 当前显示的数据（可能已筛选/排序）

// DOM 元素
const fileInput = document.getElementById('fileInput');
const btnRead = document.getElementById('btnRead');
const sheetTabs = document.getElementById('sheetTabs');
const dataArea = document.getElementById('dataArea');
const actionPanel = document.getElementById('actionPanel');
const loading = document.getElementById('loading');

// =============================
// 工具函数
// =============================

function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function show(msg) {
    alert(msg);
}

// =============================
// 读取文件
// =============================

btnRead.addEventListener('click', async function () {
    const file = fileInput.files[0];
    if (!file) return show('请先选择文件');

    showLoading();
    const formData = new FormData();
    formData.append('file', file);

    try {
        const resp = await fetch(API + '/read', { method: 'POST', body: formData });
        const result = await resp.json();

        if (result.error) return show(result.error);

        allSheets = result.data;
        activeSheet = result.sheets[0];
        currentData = allSheets[activeSheet] || [];

        renderSheetTabs(result.sheets);
        renderTable(activeSheet, currentData);
        populateSelectors(currentData);

        sheetTabs.classList.remove('hidden');
        dataArea.classList.remove('hidden');
        actionPanel.classList.remove('hidden');
    } catch (err) {
        show('读取失败：' + err.message);
    } finally {
        hideLoading();
    }
});

// =============================
// 渲染 Sheet 标签
// =============================

function renderSheetTabs(sheets) {
    sheetTabs.innerHTML = '';
    sheets.forEach(function (name) {
        const tab = document.createElement('div');
        tab.className = 'sheet-tab' + (name === activeSheet ? ' active' : '');
        tab.textContent = name;
        tab.addEventListener('click', function () {
            activeSheet = name;
            currentData = allSheets[name] || [];
            renderSheetTabs(sheets); // 更新高亮
            renderTable(name, currentData);
            populateSelectors(currentData);
        });
        sheetTabs.appendChild(tab);
    });
    document.getElementById('sheetName').textContent = activeSheet;
}

// =============================
// 渲染表格
// =============================

function renderTable(sheetName, data) {
    document.getElementById('sheetName').textContent = sheetName;
    document.getElementById('rowCount').textContent = data.length + ' 行';

    const thead = document.querySelector('#dataTable thead');
    const tbody = document.querySelector('#dataTable tbody');

    if (data.length === 0) {
        thead.innerHTML = '';
        tbody.innerHTML = '<tr><td>空数据</td></tr>';
        return;
    }

    // 列名
    const cols = Object.keys(data[0]);
    thead.innerHTML = '<tr>' + cols.map(function (c) {
        return '<th>' + escapeHtml(c) + '</th>';
    }).join('') + '</tr>';

    // 行数据（限制最多显示 200 行，避免页面卡死）
    const display = data.slice(0, 200);
    tbody.innerHTML = display.map(function (row) {
        return '<tr>' + cols.map(function (c) {
            return '<td>' + escapeHtml(row[c] != null ? row[c] : '') + '</td>';
        }).join('') + '</tr>';
    }).join('');

    if (data.length > 200) {
        tbody.innerHTML += '<tr><td colspan="' + cols.length + '">... 还有 ' + (data.length - 200) + ' 行未显示</td></tr>';
    }
}

// =============================
// 填充下拉框（列名）
// =============================

function populateSelectors(data) {
    if (data.length === 0) return;
    const cols = Object.keys(data[0]);
    const selectors = ['filterColumn', 'sortColumn', 'dedupColumn'];

    selectors.forEach(function (id) {
        const sel = document.getElementById(id);
        sel.innerHTML = cols.map(function (c) {
            return '<option value="' + c + '">' + escapeHtml(c) + '</option>';
        }).join('');
    });
}

// =============================
// 筛选
// =============================

document.getElementById('btnFilter').addEventListener('click', async function () {
    const column = document.getElementById('filterColumn').value;
    const condition = document.getElementById('filterCondition').value;
    const value = document.getElementById('filterValue').value;

    if (!column || value === '') return show('请选择列并输入值');

    showLoading();
    try {
        const resp = await fetch(API + '/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: allSheets[activeSheet], column: column, condition: condition, value: value })
        });
        const filtered = await resp.json();
        currentData = filtered;
        renderTable(activeSheet, filtered);
    } catch (err) {
        show('筛选失败：' + err.message);
    } finally {
        hideLoading();
    }
});

// =============================
// 排序
// =============================

document.getElementById('btnSort').addEventListener('click', async function () {
    const column = document.getElementById('sortColumn').value;
    const order = document.getElementById('sortOrder').value;

    if (!column) return show('请选择列');

    showLoading();
    try {
        const resp = await fetch(API + '/sort', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: allSheets[activeSheet], column: column, order: order })
        });
        const sorted = await resp.json();
        currentData = sorted;
        renderTable(activeSheet, sorted);
    } catch (err) {
        show('排序失败：' + err.message);
    } finally {
        hideLoading();
    }
});

// =============================
// 去重
// =============================

document.getElementById('btnDedup').addEventListener('click', async function () {
    const column = document.getElementById('dedupColumn').value;

    if (!column) return show('请选择列');

    showLoading();
    try {
        const resp = await fetch(API + '/deduplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: allSheets[activeSheet], keyColumn: column })
        });
        const result = await resp.json();

        if (result.error) return show(result.error);

        currentData = result.data;
        renderTable(activeSheet, result.data);
        allSheets[activeSheet] = result.data;
        show('去重完成！原始 ' + result.originalCount + ' 行 → 唯一 ' + result.uniqueCount + ' 行（删除 ' + result.removedCount + ' 行）');
    } catch (err) {
        show('去重失败：' + err.message);
    } finally {
        hideLoading();
    }
});

// =============================
// 合并（当前所有 sheet 合并为一个文件）
// =============================

document.getElementById('btnMerge').addEventListener('click', async function () {
    showLoading();
    try {
        const sheets = Object.keys(allSheets).map(function (name) {
            return { name: name, data: allSheets[name] };
        });

        const resp = await fetch(API + '/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheets: sheets, outputName: '合并结果' })
        });
        const result = await resp.json();

        if (result.error) return show(result.error);

        // 下载文件
        window.location.href = result.downloadUrl;
        show('合并完成！文件已下载');
    } catch (err) {
        show('合并失败：' + err.message);
    } finally {
        hideLoading();
    }
});

// =============================
// 导出 Excel
// =============================

document.getElementById('btnExportXlsx').addEventListener('click', async function () {
    showLoading();
    try {
        const resp = await fetch(API + '/export-csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheetName: activeSheet, data: currentData })
        });
        const result = await resp.json();
        if (result.error) return show(result.error);
        window.location.href = result.downloadUrl;
    } catch (err) {
        show('导出失败：' + err.message);
    } finally {
        hideLoading();
    }
});

// =============================
// 导出 CSV
// =============================

document.getElementById('btnExportCsv').addEventListener('click', async function () {
    showLoading();
    try {
        // 先转成 xlsx workbook 再提取 CSV
        const XLSX = await importXlsx();
        const ws = XLSX.utils.json_to_sheet(currentData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const bom = '﻿'; // BOM 头
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (activeSheet || 'data') + '.csv';
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        show('导出失败：' + err.message);
    } finally {
        hideLoading();
    }
});

// 动态加载 xlsx 库用于前端 CSV 导出
function importXlsx() {
    return new Promise(function (resolve, reject) {
        if (typeof XLSX !== 'undefined') return resolve(XLSX);
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        s.onload = function () { resolve(XLSX); };
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

// =============================
// HTML 转义（防 XSS）
// =============================

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

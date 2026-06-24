// =============================
// 待办事项 v3.0 - 后端 API 版本
// =============================
// 改造说明：
// - 删除了 localStorage 相关的函数（saveToStorage / loadFromStorage）
// - 增加了 loadFromApi / fetchApi 函数，统一处理 API 请求
// - 所有增删改查都改为调用后端 API
// - HTML 和 CSS 与 v2.0 完全相同

// =============================
// 1. 获取元素（和 v2.0 完全一样）
// =============================
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const doneCount = document.getElementById('doneCount');
const emptyMsg = document.getElementById('emptyMsg');
const clearDoneBtn = document.getElementById('clearDoneBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

// =============================
// 2. 数据与状态（不变）
// =============================
let todos = [];
let currentFilter = 'all'; // 'all' | 'active' | 'done'

// =============================
// 3. 初始化 - 改为从 API 加载
// =============================
loadFromApi();
todoInput.focus();

// =============================
// 4. 添加待办 - 改为调用 POST /api/todos
// =============================
addBtn.addEventListener('click', function () {
    let text = todoInput.value.trim();
    if (text === '') return;

    fetchApi('POST', '/api/todos', { text: text })
        .then(function (newTodo) {
            todos.push(newTodo);
            todoInput.value = '';
            renderList();
        })
        .catch(function (err) {
            alert('添加失败：' + err.message);
        });
});

todoInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        addBtn.click();
    }
});

// =============================
// 5. 筛选按钮（不变）
// =============================
for (let i = 0; i < filterBtns.length; i++) {
    filterBtns[i].addEventListener('click', function () {
        for (let j = 0; j < filterBtns.length; j++) {
            filterBtns[j].classList.remove('active');
        }
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter');
        renderList();
    });
}

// =============================
// 6. 渲染列表（数据调用改为 API）
// =============================
function renderList() {
    todoList.innerHTML = '';

    // 根据筛选条件过滤
    let filtered = todos;
    if (currentFilter === 'active') {
        filtered = todos.filter(function (todo) {
            return !todo.done;
        });
    } else if (currentFilter === 'done') {
        filtered = todos.filter(function (todo) {
            return todo.done;
        });
    }

    for (let i = 0; i < filtered.length; i++) {
        let todo = filtered[i];
        let originalIndex = todos.indexOf(todo);

        let li = document.createElement('li');
        li.className = 'todo-item' + (todo.done ? ' done' : '');

        li.innerHTML =
            '<input type="checkbox" ' + (todo.done ? 'checked' : '') + '>' +
            '<span class="todo-text">' + escapeHtml(todo.text) + '</span>' +
            '<button class="delete-btn">✕</button>';

        todoList.appendChild(li);

        // 复选框：切换完成状态 → 调用 PUT /api/todos/:id
        let checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function () {
            let todoId = todos[originalIndex].id;
            fetchApi('PUT', '/api/todos/' + todoId)
                .then(function (updatedTodo) {
                    todos[originalIndex].done = updatedTodo.done;
                    renderList();
                });
        });

        // 双击：进入编辑
        let textSpan = li.querySelector('.todo-text');
        textSpan.addEventListener('dblclick', function () {
            startEdit(li, originalIndex);
        });

        // 删除：调用 DELETE /api/todos/:id
        let deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function () {
            if (confirm('确定要删除 "' + todo.text + '" 吗？')) {
                let todoId = todos[originalIndex].id;
                fetchApi('DELETE', '/api/todos/' + todoId)
                    .then(function () {
                        todos.splice(originalIndex, 1);
                        renderList();
                    });
            }
        });
    }

    // 空状态
    if (filtered.length === 0) {
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
    }

    updateStats();
}

// =============================
// 7. 编辑功能（改为调用 API）
// =============================
function startEdit(li, index) {
    // 防止重复编辑
    if (li.querySelector('.edit-input')) {
        return;
    }

    let todoText = todos[index].text;
    let textSpan = li.querySelector('.todo-text');

    // 创建编辑输入框
    let editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-input';
    editInput.value = todoText;

    // 替换文字
    li.insertBefore(editInput, textSpan);
    li.removeChild(textSpan);
    editInput.focus();

    // 选择全部文字，方便直接修改
    editInput.select();

    // 回车确认
    editInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            let newText = editInput.value.trim();
            if (newText && newText !== todoText) {
                let todoId = todos[index].id;
                fetchApi('PUT', '/api/todos/' + todoId + '/text', { text: newText })
                    .then(function (updatedTodo) {
                        todos[index].text = updatedTodo.text;
                        renderList();
                    });
            }
            renderList();
        }
    });

    // ESC 取消
    editInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            renderList();
        }
    });

    // 点击其他地方也保存
    document.addEventListener('click', function saveEdit(e) {
        if (e.target !== editInput) {
            let newText = editInput.value.trim();
            if (newText && newText !== todoText) {
                let todoId = todos[index].id;
                fetchApi('PUT', '/api/todos/' + todoId + '/text', { text: newText })
                    .then(function (updatedTodo) {
                        todos[index].text = updatedTodo.text;
                        renderList();
                    });
            }
            document.removeEventListener('click', saveEdit);
            renderList();
        }
    });
}

// =============================
// 8. 更新统计（不变）
// =============================
function updateStats() {
    let total = todos.length;
    let done = 0;

    for (let i = 0; i < total; i++) {
        if (todos[i].done) {
            done++;
        }
    }

    totalCount.textContent = total;
    activeCount.textContent = total - done;
    doneCount.textContent = done;
}

// =============================
// 9. 清除操作（改为调用 API）
// =============================
clearDoneBtn.addEventListener('click', function () {
    fetchApi('POST', '/api/todos/clear-done')
        .then(function () {
            todos = todos.filter(function (todo) {
                return !todo.done;
            });
            renderList();
        });
});

clearAllBtn.addEventListener('click', function () {
    if (confirm('确定要清除所有待办吗？此操作不可撤销！')) {
        fetchApi('POST', '/api/todos/clear-all')
            .then(function () {
                todos = [];
                renderList();
            });
    }
});

// =============================
// 10. 新的核心：API 调用封装
// =============================

// loadFromApi - 页面加载时从后端获取所有待办
function loadFromApi() {
    fetch('/api/todos')
        .then(function (res) {
            return res.json();
        })
        .then(function (data) {
            todos = data;
            renderList();
        })
        .catch(function (err) {
            console.error('加载失败：', err);
        });
}

// fetchApi - 统一的 API 请求函数
// method: 'GET' | 'POST' | 'PUT' | 'DELETE'
// endpoint: '/api/todos' 等
// body: 可选，POST/PUT 时发送的请求体
function fetchApi(method, endpoint, body) {
    let options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // POST 和 PUT 需要带请求体
    if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
    }

    return fetch(endpoint, options)
        .then(function (res) {
            // 如果状态码不是 2xx，抛出错误
            if (!res.ok) {
                return res.json().then(function (err) {
                    throw new Error(err.error || '请求失败');
                });
            }
            return res.json();
        });
}

// =============================
// 11. 安全转义 HTML
// 防止用户输入恶意脚本（XSS 攻击）
// =============================
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const API_BASE = '/api/todos';

// State
let todos = [];

// DOM Elements
const todoForm = document.getElementById('todoForm');
const titleInput = document.getElementById('title');
const prioritySelect = document.getElementById('priority');
const todoList = document.getElementById('todoList');
const statsContainer = document.getElementById('stats');
const filterStatus = document.getElementById('filterStatus');
const filterPriority = document.getElementById('filterPriority');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTodos();
  loadStats();

  // Event listeners
  todoForm.addEventListener('submit', handleSubmit);
  filterStatus.addEventListener('change', loadTodos);
  filterPriority.addEventListener('change', loadTodos);
});

// API Functions
async function fetchApi(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  if (response.status === 204) return null;
  return response.json();
}

async function loadTodos() {
  const params = new URLSearchParams();

  if (filterStatus.value) params.append('status', filterStatus.value);
  if (filterPriority.value) params.append('priority', filterPriority.value);

  try {
    const result = await fetchApi(`${API_BASE}?${params}`);
    todos = result.todos;
    renderTodos();
  } catch (error) {
    console.error('Failed to load todos:', error);
  }
}

async function loadStats() {
  try {
    const stats = await fetchApi(`${API_BASE}/stats`);
    renderStats(stats);
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

async function createTodo(data) {
  try {
    await fetchApi(API_BASE, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    loadTodos();
    loadStats();
  } catch (error) {
    console.error('Failed to create todo:', error);
    alert('Failed to create todo');
  }
}

async function updateTodo(id, data) {
  try {
    await fetchApi(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    loadTodos();
    loadStats();
  } catch (error) {
    console.error('Failed to update todo:', error);
  }
}

async function deleteTodo(id) {
  try {
    await fetchApi(`${API_BASE}/${id}`, { method: 'DELETE' });
    loadTodos();
    loadStats();
  } catch (error) {
    console.error('Failed to delete todo:', error);
  }
}

// Event Handlers
function handleSubmit(e) {
  e.preventDefault();

  const title = titleInput.value.trim();
  if (!title) return;

  createTodo({
    title,
    priority: prioritySelect.value
  });

  titleInput.value = '';
  titleInput.focus();
}

function handleToggleComplete(id, currentStatus) {
  const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
  updateTodo(id, { status: newStatus });
}

function handleDelete(id) {
  if (confirm('Are you sure you want to delete this todo?')) {
    deleteTodo(id);
  }
}

// Render Functions
function renderStats(stats) {
  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="number">${stats.total}</div>
      <div class="label">Total</div>
    </div>
    <div class="stat-card">
      <div class="number">${stats.byStatus?.pending || 0}</div>
      <div class="label">Pending</div>
    </div>
    <div class="stat-card">
      <div class="number">${stats.byStatus?.completed || 0}</div>
      <div class="label">Completed</div>
    </div>
    <div class="stat-card">
      <div class="number">${stats.overdue || 0}</div>
      <div class="label">Overdue</div>
    </div>
  `;
}

function renderTodos() {
  if (todos.length === 0) {
    todoList.innerHTML = `
      <div class="empty-state">
        <p>No todos found. Add one above!</p>
      </div>
    `;
    return;
  }

  todoList.innerHTML = todos.map(todo => `
    <div class="todo-item ${todo.status === 'completed' ? 'completed' : ''}">
      <input
        type="checkbox"
        class="todo-checkbox"
        ${todo.status === 'completed' ? 'checked' : ''}
        onchange="handleToggleComplete('${todo.id}', '${todo.status}')"
      >
      <div class="todo-content">
        <div class="todo-title">${escapeHtml(todo.title)}</div>
        <div class="todo-meta">
          <span class="priority-badge priority-${todo.priority}">${todo.priority}</span>
          <span>${formatDate(todo.createdAt)}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="handleDelete('${todo.id}')">Delete</button>
    </div>
  `).join('');
}

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

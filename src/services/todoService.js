const Todo = require('../models/todo');
const config = require('../config');

// In-memory storage (would be replaced with database in production)
const todos = new Map();

class TodoService {
  static create(data) {
    const todo = new Todo(data);
    todos.set(todo.id, todo);
    return todo;
  }

  static getById(id) {
    return todos.get(id) || null;
  }

  static getAll(options = {}) {
    const {
      status,
      priority,
      tag,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = config.pagination.defaultLimit,
      offset = 0
    } = options;

    let results = Array.from(todos.values());

    // Filter by status
    if (status) {
      results = results.filter(todo => todo.status === status);
    }

    // Filter by priority
    if (priority) {
      results = results.filter(todo => todo.priority === priority);
    }

    // Filter by tag
    if (tag) {
      results = results.filter(todo => todo.tags.includes(tag));
    }

    // Search in title and description
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(todo =>
        todo.title.toLowerCase().includes(searchLower) ||
        todo.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort results
    results.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    // Calculate total before pagination
    const total = results.length;

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      todos: paginatedResults,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  static update(id, data) {
    const todo = todos.get(id);
    if (!todo) {
      return null;
    }

    todo.update(data);
    return todo;
  }

  static delete(id) {
    const todo = todos.get(id);
    if (!todo) {
      return false;
    }

    todos.delete(id);
    return true;
  }

  static getStats() {
    const allTodos = Array.from(todos.values());

    const stats = {
      total: allTodos.length,
      byStatus: {},
      byPriority: {},
      overdue: 0,
      completedToday: 0
    };

    const today = new Date().toDateString();

    for (const todo of allTodos) {
      // Count by status
      stats.byStatus[todo.status] = (stats.byStatus[todo.status] || 0) + 1;

      // Count by priority
      stats.byPriority[todo.priority] = (stats.byPriority[todo.priority] || 0) + 1;

      // Count overdue
      if (todo.isOverdue()) {
        stats.overdue++;
      }

      // Count completed today
      if (todo.completedAt && new Date(todo.completedAt).toDateString() === today) {
        stats.completedToday++;
      }
    }

    return stats;
  }

  // Bulk operations
  static bulkUpdateStatus(ids, status) {
    const updated = [];
    for (const id of ids) {
      const todo = this.update(id, { status });
      if (todo) {
        updated.push(todo);
      }
    }
    return updated;
  }

  static bulkDelete(ids) {
    let deletedCount = 0;
    for (const id of ids) {
      if (this.delete(id)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  // Clear all (for testing)
  static clear() {
    todos.clear();
  }
}

module.exports = TodoService;

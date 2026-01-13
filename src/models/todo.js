const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class Todo {
  constructor({ title, description = '', priority = 'medium', dueDate = null, tags = [] }) {
    this.id = uuidv4();
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.status = 'pending';
    this.dueDate = dueDate;
    this.tags = tags;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.completedAt = null;
  }

  update(data) {
    const allowedFields = ['title', 'description', 'priority', 'status', 'dueDate', 'tags'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        this[field] = data[field];
      }
    }

    this.updatedAt = new Date().toISOString();

    // Set completedAt when status changes to completed
    if (data.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date().toISOString();
    } else if (data.status && data.status !== 'completed') {
      this.completedAt = null;
    }

    return this;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      priority: this.priority,
      status: this.status,
      dueDate: this.dueDate,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt
    };
  }

  isOverdue() {
    if (!this.dueDate || this.status === 'completed') {
      return false;
    }
    return new Date(this.dueDate) < new Date();
  }
}

module.exports = Todo;

const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class Todo {
  constructor({ title, description = '', priority = 'medium', dueDate = null, tags = [], recurrence = null }) {
    this.id = uuidv4();
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.status = 'pending';
    this.dueDate = dueDate;
    this.tags = tags;
    this.recurrence = recurrence; // daily, weekly, biweekly, monthly, yearly
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.completedAt = null;
    this.lastRecurredAt = null;
  }

  update(data) {
    const allowedFields = ['title', 'description', 'priority', 'status', 'dueDate', 'tags', 'recurrence'];

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
      recurrence: this.recurrence,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
      lastRecurredAt: this.lastRecurredAt
    };
  }

  getNextDueDate() {
    if (!this.recurrence || !this.dueDate) return null;

    const currentDue = new Date(this.dueDate);
    const now = new Date();

    if (currentDue > now) return this.dueDate;

    let nextDate = new Date(currentDue);

    while (nextDate <= now) {
      switch (this.recurrence) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          return null;
      }
    }

    return nextDate.toISOString();
  }

  isOverdue() {
    if (!this.dueDate || this.status === 'completed') {
      return false;
    }
    return new Date(this.dueDate) < new Date();
  }
}

module.exports = Todo;

const config = require('../config');

const validators = {
  validateTodoInput(data, isUpdate = false) {
    const errors = [];

    // Title validation (required for create, optional for update)
    if (!isUpdate && !data.title) {
      errors.push('Title is required');
    }

    if (data.title !== undefined) {
      if (typeof data.title !== 'string') {
        errors.push('Title must be a string');
      } else if (data.title.trim().length === 0) {
        errors.push('Title cannot be empty');
      } else if (data.title.length > config.todo.maxTitleLength) {
        errors.push(`Title must be less than ${config.todo.maxTitleLength} characters`);
      }
    }

    // Description validation
    if (data.description !== undefined) {
      if (typeof data.description !== 'string') {
        errors.push('Description must be a string');
      } else if (data.description.length > config.todo.maxDescriptionLength) {
        errors.push(`Description must be less than ${config.todo.maxDescriptionLength} characters`);
      }
    }

    // Priority validation
    if (data.priority !== undefined) {
      if (!config.todo.priorities.includes(data.priority)) {
        errors.push(`Priority must be one of: ${config.todo.priorities.join(', ')}`);
      }
    }

    // Status validation
    if (data.status !== undefined) {
      if (!config.todo.statuses.includes(data.status)) {
        errors.push(`Status must be one of: ${config.todo.statuses.join(', ')}`);
      }
    }

    // Due date validation
    if (data.dueDate !== undefined && data.dueDate !== null) {
      const date = new Date(data.dueDate);
      if (isNaN(date.getTime())) {
        errors.push('Due date must be a valid date');
      }
    }

    // Tags validation
    if (data.tags !== undefined) {
      if (!Array.isArray(data.tags)) {
        errors.push('Tags must be an array');
      } else if (data.tags.some(tag => typeof tag !== 'string')) {
        errors.push('All tags must be strings');
      } else if (data.tags.length > 10) {
        errors.push('Maximum 10 tags allowed');
      }
    }

    // Recurrence validation
    if (data.recurrence !== undefined && data.recurrence !== null) {
      if (!config.todo.recurrencePatterns.includes(data.recurrence)) {
        errors.push(`Recurrence must be one of: ${config.todo.recurrencePatterns.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateId(id) {
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  },

  sanitizeString(str) {
    if (typeof str !== 'string') return str;

    return str
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Encode HTML entities
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      // Remove null bytes
      .replace(/\0/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ');
  },

  // Sanitize array of strings
  sanitizeStringArray(arr) {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => this.sanitizeString(item)).filter(Boolean);
  },

  validatePaginationParams(query) {
    let limit = parseInt(query.limit) || config.pagination.defaultLimit;
    let offset = parseInt(query.offset) || 0;

    // Enforce limits
    limit = Math.min(Math.max(1, limit), config.pagination.maxLimit);
    offset = Math.max(0, offset);

    return { limit, offset };
  }
};

module.exports = validators;

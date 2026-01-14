const express = require('express');
const TodoService = require('../services/todoService');
const validators = require('../utils/validators');

const router = express.Router();

// GET /api/todos - List all todos with filtering and pagination
router.get('/', (req, res) => {
  const { limit, offset } = validators.validatePaginationParams(req.query);

  const options = {
    status: req.query.status,
    priority: req.query.priority,
    tag: req.query.tag,
    search: req.query.search,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
    limit,
    offset
  };

  const result = TodoService.getAll(options);
  res.json(result);
});

// GET /api/todos/stats - Get todo statistics
router.get('/stats', (req, res) => {
  const stats = TodoService.getStats();
  res.json(stats);
});

// GET /api/todos/:id - Get a single todo
router.get('/:id', (req, res) => {
  const { id } = req.params;

  if (!validators.validateId(id)) {
    return res.status(400).json({ error: 'Invalid todo ID format' });
  }

  const todo = TodoService.getById(id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json(todo);
});

// POST /api/todos - Create a new todo
router.post('/', (req, res) => {
  const validation = validators.validateTodoInput(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors
    });
  }

  const todoData = {
    title: validators.sanitizeString(req.body.title),
    description: validators.sanitizeString(req.body.description || ''),
    priority: req.body.priority,
    dueDate: req.body.dueDate,
    tags: validators.sanitizeStringArray(req.body.tags || [])
  };

  const todo = TodoService.create(todoData);
  res.status(201).json(todo);
});

// PUT /api/todos/:id - Update a todo
router.put('/:id', (req, res) => {
  const { id } = req.params;

  if (!validators.validateId(id)) {
    return res.status(400).json({ error: 'Invalid todo ID format' });
  }

  const validation = validators.validateTodoInput(req.body, true);

  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors
    });
  }

  const updateData = {};
  if (req.body.title !== undefined) updateData.title = validators.sanitizeString(req.body.title);
  if (req.body.description !== undefined) updateData.description = validators.sanitizeString(req.body.description);
  if (req.body.priority !== undefined) updateData.priority = req.body.priority;
  if (req.body.status !== undefined) updateData.status = req.body.status;
  if (req.body.dueDate !== undefined) updateData.dueDate = req.body.dueDate;
  if (req.body.tags !== undefined) updateData.tags = validators.sanitizeStringArray(req.body.tags);

  const todo = TodoService.update(id, updateData);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json(todo);
});

// DELETE /api/todos/:id - Delete a todo
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (!validators.validateId(id)) {
    return res.status(400).json({ error: 'Invalid todo ID format' });
  }

  const deleted = TodoService.delete(id);

  if (!deleted) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.status(204).send();
});

// POST /api/todos/bulk/status - Bulk update status
router.post('/bulk/status', (req, res) => {
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const updated = TodoService.bulkUpdateStatus(ids, status);

  res.json({
    updated: updated.length,
    todos: updated
  });
});

// DELETE /api/todos/bulk - Bulk delete
router.delete('/bulk', (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }

  const deletedCount = TodoService.bulkDelete(ids);

  res.json({ deleted: deletedCount });
});

module.exports = router;

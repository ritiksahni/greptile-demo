const request = require('supertest');
const app = require('../src/index');
const TodoService = require('../src/services/todoService');

describe('Todo API', () => {
  beforeEach(() => {
    TodoService.clear();
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ title: 'Test todo', priority: 'high' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test todo');
      expect(res.body.priority).toBe('high');
      expect(res.body.status).toBe('pending');
    });

    it('should return 400 for missing title', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ priority: 'high' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid priority', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ title: 'Test', priority: 'super-urgent' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/todos', () => {
    beforeEach(async () => {
      await request(app).post('/api/todos').send({ title: 'Todo 1', priority: 'low' });
      await request(app).post('/api/todos').send({ title: 'Todo 2', priority: 'high' });
      await request(app).post('/api/todos').send({ title: 'Todo 3', priority: 'medium' });
    });

    it('should return all todos', async () => {
      const res = await request(app).get('/api/todos');

      expect(res.status).toBe(200);
      expect(res.body.todos).toHaveLength(3);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter by priority', async () => {
      const res = await request(app).get('/api/todos?priority=high');

      expect(res.status).toBe(200);
      expect(res.body.todos).toHaveLength(1);
      expect(res.body.todos[0].priority).toBe('high');
    });

    it('should search by title', async () => {
      const res = await request(app).get('/api/todos?search=Todo%201');

      expect(res.status).toBe(200);
      expect(res.body.todos).toHaveLength(1);
    });
  });

  describe('GET /api/todos/:id', () => {
    it('should return a single todo', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .send({ title: 'Test todo' });

      const res = await request(app).get(`/api/todos/${createRes.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Test todo');
    });

    it('should return 404 for non-existent todo', async () => {
      const res = await request(app).get('/api/todos/550e8400-e29b-41d4-a716-446655440000');

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const res = await request(app).get('/api/todos/invalid-id');

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('should update a todo', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .send({ title: 'Original title' });

      const res = await request(app)
        .put(`/api/todos/${createRes.body.id}`)
        .send({ title: 'Updated title', status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated title');
      expect(res.body.status).toBe('completed');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('should return 404 for non-existent todo', async () => {
      const res = await request(app)
        .put('/api/todos/550e8400-e29b-41d4-a716-446655440000')
        .send({ title: 'Updated' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should delete a todo', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .send({ title: 'To be deleted' });

      const res = await request(app).delete(`/api/todos/${createRes.body.id}`);

      expect(res.status).toBe(204);

      const getRes = await request(app).get(`/api/todos/${createRes.body.id}`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('GET /api/todos/stats', () => {
    it('should return statistics', async () => {
      await request(app).post('/api/todos').send({ title: 'Todo 1' });
      await request(app).post('/api/todos').send({ title: 'Todo 2' });

      const res = await request(app).get('/api/todos/stats');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.byStatus).toBeDefined();
      expect(res.body.byPriority).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});

const validators = require('../src/utils/validators');

describe('Validators', () => {
  describe('validateTodoInput', () => {
    it('should pass valid todo input', () => {
      const result = validators.validateTodoInput({
        title: 'Valid todo',
        description: 'A description',
        priority: 'high',
        tags: ['work', 'urgent']
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for missing title on create', () => {
      const result = validators.validateTodoInput({
        priority: 'high'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should pass for missing title on update', () => {
      const result = validators.validateTodoInput({
        priority: 'high'
      }, true);

      expect(result.isValid).toBe(true);
    });

    it('should fail for empty title', () => {
      const result = validators.validateTodoInput({
        title: '   '
      });

      expect(result.isValid).toBe(false);
    });

    it('should fail for title exceeding max length', () => {
      const result = validators.validateTodoInput({
        title: 'a'.repeat(250)
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('less than'))).toBe(true);
    });

    it('should fail for invalid priority', () => {
      const result = validators.validateTodoInput({
        title: 'Test',
        priority: 'super-high'
      });

      expect(result.isValid).toBe(false);
    });

    it('should fail for invalid status', () => {
      const result = validators.validateTodoInput({
        title: 'Test',
        status: 'done'
      });

      expect(result.isValid).toBe(false);
    });

    it('should fail for non-array tags', () => {
      const result = validators.validateTodoInput({
        title: 'Test',
        tags: 'not-an-array'
      });

      expect(result.isValid).toBe(false);
    });

    it('should fail for too many tags', () => {
      const result = validators.validateTodoInput({
        title: 'Test',
        tags: Array(15).fill('tag')
      });

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateId', () => {
    it('should pass valid UUID', () => {
      expect(validators.validateId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should fail invalid UUID', () => {
      expect(validators.validateId('not-a-uuid')).toBe(false);
      expect(validators.validateId('123')).toBe(false);
      expect(validators.validateId('')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(validators.sanitizeString('  hello  ')).toBe('hello');
    });

    it('should remove HTML tags', () => {
      expect(validators.sanitizeString('<script>alert("xss")</script>Hello')).toBe('Hello');
    });

    it('should handle non-string input', () => {
      expect(validators.sanitizeString(123)).toBe(123);
      expect(validators.sanitizeString(null)).toBe(null);
    });
  });

  describe('validatePaginationParams', () => {
    it('should return defaults for empty query', () => {
      const result = validators.validatePaginationParams({});
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should parse valid values', () => {
      const result = validators.validatePaginationParams({ limit: '50', offset: '10' });
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(10);
    });

    it('should enforce max limit', () => {
      const result = validators.validatePaginationParams({ limit: '500' });
      expect(result.limit).toBe(100);
    });

    it('should enforce min values', () => {
      const result = validators.validatePaginationParams({ limit: '-5', offset: '-10' });
      expect(result.limit).toBe(1);
      expect(result.offset).toBe(0);
    });
  });
});

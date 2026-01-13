# Todo API

A simple RESTful Todo API built with Express.js.

## Features

- Create, read, update, and delete todos
- Filter todos by status, priority, and tags
- Search todos by title/description
- Pagination support
- Bulk operations
- Statistics endpoint
- Simple web frontend

## Installation

```bash
npm install
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Running Tests

```bash
npm test
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/todos | List all todos |
| GET | /api/todos/:id | Get a single todo |
| POST | /api/todos | Create a new todo |
| PUT | /api/todos/:id | Update a todo |
| DELETE | /api/todos/:id | Delete a todo |
| GET | /api/todos/stats | Get statistics |
| POST | /api/todos/bulk/status | Bulk update status |
| DELETE | /api/todos/bulk | Bulk delete |
| GET | /api/health | Health check |

## Query Parameters

- `status` - Filter by status (pending, in_progress, completed, archived)
- `priority` - Filter by priority (low, medium, high, urgent)
- `tag` - Filter by tag
- `search` - Search in title and description
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order: asc or desc (default: desc)
- `limit` - Results per page (default: 20, max: 100)
- `offset` - Pagination offset

## Example Requests

### Create a Todo

```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "priority": "high", "tags": ["shopping"]}'
```

### Update a Todo

```bash
curl -X PUT http://localhost:3000/api/todos/{id} \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

## License

MIT

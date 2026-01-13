const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const todoRoutes = require('./routes/todos');
const errorHandler = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Apply rate limiting to API routes
app.use('/api', rateLimiter());

// Routes
app.use('/api/todos', todoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Todo API server running on port ${config.port}`);
    console.log(`Environment: ${config.env}`);
  });
}

module.exports = app;

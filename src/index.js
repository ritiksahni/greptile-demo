const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const todoRoutes = require('./routes/todos');
const errorHandler = require('./middleware/errorHandler');
const {
  securityHeaders,
  bodySizeLimiter,
  sqlInjectionDetector,
  noSqlInjectionDetector
} = require('./middleware/security');

const app = express();

// Security middleware (apply first)
app.use(securityHeaders);
app.use(bodySizeLimiter('100kb'));

// Standard middleware
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Injection detection for API routes
app.use('/api', sqlInjectionDetector);
app.use('/api', noSqlInjectionDetector);

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

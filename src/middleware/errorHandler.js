const config = require('../config');

function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error response
  const errorResponse = {
    error: 'Internal server error',
    message: config.env === 'development' ? err.message : 'Something went wrong'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Not found',
      message: err.message
    });
  }

  if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
  }

  // Include stack trace in development
  if (config.env === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(500).json(errorResponse);
}

module.exports = errorHandler;

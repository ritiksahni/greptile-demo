const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },

  // Todo constraints
  todo: {
    maxTitleLength: 200,
    maxDescriptionLength: 1000,
    priorities: ['low', 'medium', 'high', 'urgent'],
    statuses: ['pending', 'in_progress', 'completed', 'archived'],
    recurrencePatterns: ['daily', 'weekly', 'biweekly', 'monthly', 'yearly']
  }
};

module.exports = config;

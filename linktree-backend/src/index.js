require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Canary Deployment Test - Version 2.0
// Importar logger e middlewares
const logger = require('./utils/logger');
const httpLogger = require('./middleware/httpLogger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const linkRoutes = require('./routes/links');
const redirectRoutes = require('./routes/redirect');
const analyticsRoutes = require('./routes/analytics');
const socialIconRoutes = require('./routes/socialIcons');
const profileRoutes = require('./routes/profile');
const inviteCodeRoutes = require('./routes/inviteCodes');
const storageRoutes = require('./routes/storage');
const trackerRoutes = require('./routes/trackers');

// ... (existing code)

app.use('/api/invite-codes', inviteCodeRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api', trackerRoutes); // Montado na raiz da API pois as rotas já incluem o caminho completo

// 404 Handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource does not exist',
  });
});

// Error Handler (deve ser o último middleware)
app.use(errorHandler);

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 CORS enabled for: ${corsOrigin.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// console.log('test-deployment');

module.exports = app;
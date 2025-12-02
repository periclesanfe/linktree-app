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

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet());

// CORS configurável
const corsOrigin = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
app.use(cors({ 
  origin: corsOrigin,
  credentials: true 
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP logging
app.use(httpLogger);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: 'v2.3.0-GREEN',
    deployment: 'Testing Blue-Green Deployment',
    rolloutType: process.env.ROLLOUT_TYPE || 'blueGreen',
    message: 'GREEN version - Preview before promotion',
    color: 'GREEN',
  });
});

app.get('/api/helloWorld', (req, res) => {
  res.status(200).json({ 
    message: 'Hello, World!',
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API do Linktree está no ar!',
    version: '1.0.0',
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/r', redirectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/socials', socialIconRoutes);
app.use('/api/profile', profileRoutes);

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

console.log('test-deployment');

module.exports = app;
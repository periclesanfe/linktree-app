require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

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

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de segurança
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Configuração de CORS
const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:8080'];
app.use(cors({
  origin: function(origin, callback) {
    // Permitir requisições sem origin (como curl, apps mobile)
    if (!origin) return callback(null, true);
    
    if (corsOrigin.indexOf(origin) !== -1 || corsOrigin.includes('*')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Logger HTTP
app.use(httpLogger);

// Body parsing with increased limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: 'v2.3.0-GREEN',
    deployment: 'Testing Blue-Green Deployment',
    rolloutType: 'blueGreen',
    message: 'GREEN version - Preview before promotion',
    color: 'GREEN'
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/links', linkRoutes);
app.use('/r', redirectRoutes); // Redirecionamento curto
app.use('/api/analytics', analyticsRoutes);
app.use('/api/socials', socialIconRoutes);
app.use('/api/profile', profileRoutes);
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

module.exports = app;

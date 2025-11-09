const morgan = require('morgan');
const logger = require('../utils/logger');

// Formato customizado para Morgan
morgan.token('custom', (req, res) => {
  return JSON.stringify({
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    contentLength: res.get('content-length'),
    responseTime: res.get('X-Response-Time'),
    ip: req.ip,
  });
});

// Middleware Morgan configurado para usar Winston
const httpLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: logger.stream,
    skip: (req, res) => {
      // Não logar health checks em produção
      if (process.env.NODE_ENV === 'production' && req.url === '/api/health') {
        return true;
      }
      return false;
    },
  }
);

module.exports = httpLogger;

const logger = require('../utils/logger');

/**
 * Middleware untuk menangani route yang tidak ditemukan (404).
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    sukses: false,
    pesan: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
}

/**
 * Middleware global error handler.
 * Semua error yang dilempar (throw) atau diteruskan lewat next(err)
 * pada route/controller akan ditangkap di sini.
 */
function globalErrorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    sukses: false,
    pesan: err.message || 'Terjadi kesalahan pada server.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFoundHandler, globalErrorHandler };

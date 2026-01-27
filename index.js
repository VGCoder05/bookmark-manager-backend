const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = require('./src/server')

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Bookmark Manager API Server                          ║
║                                                            ║
║   → Local:    http://localhost:${PORT}                     ║
║   → API:      http://localhost:${PORT}/api/bookmarks,      ║
║               http://localhost:${PORT}/api/tags            ║
║   → Health:   http://localhost:${PORT}/api/health          ║
║   → Mode:     ${process.env.NODE_ENV || 'development'}     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
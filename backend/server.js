// backend/server.js - UPDATED VERSION
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - ALLOW BOTH PORTS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow both frontend ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (optional but helpful for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import Routes
const authRoutes = require('./src/routes/auth.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const adminRoutes = require('./src/routes/admin.routes');
const instituteRoutes = require('./src/routes/institute.routes');
const studentRoutes = require('./src/routes/student.routes');
const companyRoutes = require('./src/routes/company.routes');

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/company', companyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date(),
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Higher Education Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      upload: '/api/upload',
      admin: '/api/admin',
      institute: '/api/institute',
      student: '/api/student',
      company: '/api/company'
    }
  });
});

// 404 handler - MUST BE AFTER ALL ROUTES
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.path);
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware - MUST BE LAST
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 SERVER STARTED SUCCESSFULLY');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base: http://localhost:${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
  console.log('📋 Available Routes:');
  console.log('  - /api/auth         (Authentication)');
  console.log('  - /api/upload       (File Uploads)');
  console.log('  - /api/admin        (Admin Operations)');
  console.log('  - /api/institute    (Institute Operations)');
  console.log('  - /api/student      (Student Operations)');
  console.log('  - /api/company      (Company Operations)');
  console.log('='.repeat(50));
});

module.exports = app;
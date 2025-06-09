import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import { setupStaticServing } from './static-serve.js';
import devicesRouter from './routes/devices.js';
import usersRouter from './routes/users.js';
import profilesRouter from './routes/profiles.js';
import reportsRouter from './routes/reports.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import systemRouter from './routes/system.js';
import { requireAuth } from './middleware/auth.js';

dotenv.config();

const app = express();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Security middleware
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (before API routes)
app.get('/api/health', (req, res) => {
  try {
    console.log('Health check endpoint called');
    const dataDirectory = process.env.DATA_DIRECTORY || './data';
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: dataDirectory ? 'configured' : 'not configured',
      dataDirectory: dataDirectory,
      nodeEnv: process.env.NODE_ENV || 'development'
    });
    return;
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Database test endpoint (before API routes)
app.get('/api/db-test', async (req, res) => {
  try {
    const { db } = await import('./db/connection.js');
    console.log('Testing database connection...');
    
    // Simple test query
    const result = await db
      .selectFrom('devices')
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst();
    
    res.json({ 
      status: 'Database connection successful',
      deviceCount: result?.count || 0,
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      status: 'Database connection failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Auth routes (no authentication required)
app.use('/api/auth', authRouter);

// Protected API routes - require authentication
app.use('/api/devices', requireAuth, devicesRouter);
app.use('/api/users', requireAuth, usersRouter);
app.use('/api/profiles', requireAuth, profilesRouter);
app.use('/api/reports', requireAuth, reportsRouter);
app.use('/api/admin', requireAuth, adminRouter);
app.use('/api/system', requireAuth, systemRouter);

// 404 handler for API routes - use middleware instead of wildcards
app.use('/api', (req, res, next) => {
  // If we reach here, no API route matched
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
  return;
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', err);
  
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }
  
  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request entity too large' });
    return;
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
  return;
});

// Export a function to start the server
export async function startServer(port: number) {
  try {
    // Test database connection on startup
    console.log('Testing database connection...');
    const { db } = await import('./db/connection.js');
    
    // Verify database schema
    try {
      const tables = await db.introspection.getTables();
      console.log('Database tables found:', tables.map(t => t.name));
    } catch (dbError) {
      console.error('Database introspection failed:', dbError);
      console.log('Continuing anyway - database might need initialization');
    }
    
    // Setup static serving for production (AFTER all API routes)
    if (process.env.NODE_ENV === 'production') {
      setupStaticServing(app);
      console.log('Static serving configured for production');
    }
    
    const server = app.listen(port, () => {
      console.log(`✅ API Server running on port ${port}`);
      console.log(`📁 Data directory: ${process.env.DATA_DIRECTORY || './data'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${port}/api/health`);
      console.log(`🔐 Default login: admin / admin123`);
      console.log(`📊 System monitor: Available at /api/system/stats`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal: string) => {
      console.log(`${signal} received, shutting down gracefully`);
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (err: any) {
    console.error('❌ Failed to start server:', err);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  }
}

// Start the server directly if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting server...');
  startServer(parseInt(process.env.PORT || '3001'));
}

import express from 'express';
import dotenv from 'dotenv';
import { setupStaticServing } from './static-serve.js';
import devicesRouter from './routes/devices.js';
import usersRouter from './routes/users.js';
import profilesRouter from './routes/profiles.js';
import reportsRouter from './routes/reports.js';

dotenv.config();

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/devices', devicesRouter);
app.use('/api/users', usersRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/reports', reportsRouter);

// Test endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: process.env.DATA_DIRECTORY ? 'configured' : 'not configured'
  });
});

// Export a function to start the server
export async function startServer(port) {
  try {
    if (process.env.NODE_ENV === 'production') {
      setupStaticServing(app);
    }
    app.listen(port, () => {
      console.log(`API Server running on port ${port}`);
      console.log(`Data directory: ${process.env.DATA_DIRECTORY || './data'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server directly if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting server...');
  startServer(process.env.PORT || 3001);
}

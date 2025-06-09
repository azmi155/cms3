import path from 'path';
import express from 'express';

/**
 * Sets up static file serving for the Express app
 * @param app Express application instance
 */
export function setupStaticServing(app: express.Application) {
  // Serve static files from the public directory
  app.use(express.static(path.join(process.cwd(), 'public')));

  // For any non-API routes, serve the index.html file (SPA fallback)
  // Use a middleware approach instead of a wildcard route
  app.use((req, res, next) => {
    // Skip API routes and static files
    if (req.path.startsWith('/api/') || 
        req.path.includes('.') || 
        req.method !== 'GET') {
      return next();
    }
    
    console.log('Serving SPA fallback for path:', req.path);
    
    try {
      const indexPath = path.join(process.cwd(), 'public', 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error serving index.html:', err);
          res.status(500).send('Internal Server Error');
        }
      });
    } catch (error) {
      console.error('Error serving index.html:', error);
      res.status(500).send('Internal Server Error');
    }
  });
}

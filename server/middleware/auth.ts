import { Request, Response, NextFunction } from 'express';
import { db } from '../db/connection.js';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string | null;
    role: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.session?.userId;
    
    if (!sessionId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Verify user exists and is active
    const user = await db
      .selectFrom('admin_users')
      .select(['id', 'username', 'email', 'role', 'status'])
      .where('id', '=', sessionId)
      .where('status', '=', 'active')
      .executeTakeFirst();

    if (!user) {
      req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
      });
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
    return;
  }
};

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

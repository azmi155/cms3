import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    console.log('Login attempt for username:', username);

    // Get user from database
    const user = await db
      .selectFrom('admin_users')
      .selectAll()
      .where('username', '=', username.trim())
      .where('status', '=', 'active')
      .executeTakeFirst();

    if (!user) {
      console.log('User not found or inactive:', username);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    console.log('Found user:', user.username, 'checking password...');

    // For debugging - temporarily log hashed password (remove in production)
    console.log('Stored password hash:', user.password);
    console.log('Input password:', password);

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', passwordMatch);

    if (!passwordMatch) {
      console.log('Password mismatch for user:', username);
      
      // If it's the default admin user and password doesn't match, try to rehash
      if (username === 'admin' && password === 'admin123') {
        console.log('Attempting to rehash default admin password...');
        try {
          const newHashedPassword = await bcrypt.hash('admin123', 10);
          await db
            .updateTable('admin_users')
            .set({
              password: newHashedPassword,
              updated_at: new Date().toISOString()
            })
            .where('username', '=', 'admin')
            .execute();
          
          console.log('Admin password rehashed successfully');
          res.status(401).json({ error: 'Password reset. Please try logging in again.' });
          return;
        } catch (rehashError) {
          console.error('Failed to rehash admin password:', rehashError);
        }
      }
      
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last login
    await db
      .updateTable('admin_users')
      .set({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .where('id', '=', user.id)
      .execute();

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;

    console.log('Login successful for user:', username);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    return;
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
    return;
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Logout failed' });
        return;
      }
      
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully' });
      return;
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
    return;
  }
});

// Check authentication status
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
    return;
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Authentication check failed' });
    return;
  }
});

// Change password
router.put('/change-password', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    // Get current user with password
    const user = await db
      .selectFrom('admin_users')
      .selectAll()
      .where('id', '=', req.user!.id)
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db
      .updateTable('admin_users')
      .set({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', req.user!.id)
      .execute();

    console.log('Password changed for user:', req.user!.username);

    res.json({ success: true, message: 'Password changed successfully' });
    return;
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
    return;
  }
});

// Debug endpoint to check admin user (remove in production)
router.get('/debug-admin', async (req, res) => {
  try {
    const adminUser = await db
      .selectFrom('admin_users')
      .select(['id', 'username', 'email', 'role', 'status', 'created_at'])
      .where('username', '=', 'admin')
      .executeTakeFirst();

    res.json({
      adminUser,
      message: 'Admin user info (remove this endpoint in production)'
    });
    return;
  } catch (error) {
    console.error('Debug admin error:', error);
    res.status(500).json({ error: 'Debug failed' });
    return;
  }
});

export default router;

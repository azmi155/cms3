import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db/connection.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all admin users
router.get('/users', requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const users = await db
      .selectFrom('admin_users')
      .select(['id', 'username', 'email', 'role', 'status', 'last_login', 'created_at'])
      .orderBy('created_at', 'desc')
      .execute();

    console.log('Fetched admin users:', users.length);
    res.json(users);
    return;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
    return;
  }
});

// Add new admin user
router.post('/users', requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { username, password, email, role } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    if (!['admin', 'user'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be admin or user' });
      return;
    }

    // Check if username already exists
    const existingUser = await db
      .selectFrom('admin_users')
      .select('id')
      .where('username', '=', username.trim())
      .executeTakeFirst();

    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const now = new Date().toISOString();

    // Insert new user
    const newUser = await db
      .insertInto('admin_users')
      .values({
        username: username.trim(),
        password: hashedPassword,
        email: email?.trim() || null,
        role: role,
        status: 'active',
        created_at: now,
        updated_at: now
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    console.log('New admin user created:', newUser.username);

    // Return user without password
    const responseUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      created_at: newUser.created_at
    };

    res.status(201).json(responseUser);
    return;
  } catch (error) {
    console.error('Error creating admin user:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to create user' });
    return;
  }
});

// Update admin user
router.put('/users/:id', requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, status, password } = req.body;

    const userId = parseInt(id);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Prevent user from deactivating themselves
    if (userId === req.user!.id && status === 'disabled') {
      res.status(400).json({ error: 'Cannot deactivate your own account' });
      return;
    }

    // Check if user exists
    const existingUser = await db
      .selectFrom('admin_users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (username && username.trim() !== existingUser.username) {
      // Check if new username already exists
      const usernameExists = await db
        .selectFrom('admin_users')
        .select('id')
        .where('username', '=', username.trim())
        .where('id', '!=', userId)
        .executeTakeFirst();

      if (usernameExists) {
        res.status(400).json({ error: 'Username already exists' });
        return;
      }

      updateData.username = username.trim();
    }

    if (email !== undefined) {
      updateData.email = email?.trim() || null;
    }

    if (role && ['admin', 'user'].includes(role)) {
      updateData.role = role;
    }

    if (status && ['active', 'disabled'].includes(status)) {
      updateData.status = status;
    }

    if (password && password.trim()) {
      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await db
      .updateTable('admin_users')
      .set(updateData)
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    console.log('Admin user updated:', updatedUser.username);

    // Return user without password
    const responseUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      last_login: updatedUser.last_login,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };

    res.json(responseUser);
    return;
  } catch (error) {
    console.error('Error updating admin user:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to update user' });
    return;
  }
});

// Delete admin user
router.delete('/users/:id', requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const userId = parseInt(id);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Prevent user from deleting themselves
    if (userId === req.user!.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    // Check if user exists
    const existingUser = await db
      .selectFrom('admin_users')
      .select(['id', 'username'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete user
    await db
      .deleteFrom('admin_users')
      .where('id', '=', userId)
      .execute();

    console.log('Admin user deleted:', existingUser.username);

    res.json({ 
      success: true, 
      message: 'User deleted successfully',
      deletedUser: existingUser
    });
    return;
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
    return;
  }
});

export default router;

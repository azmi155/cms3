import express from 'express';
import { db } from '../db/connection.js';

const router = express.Router();

// Generate monthly report for PPPoE users
router.get('/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    console.log('Generating monthly report for:', year, month);
    
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();
    
    console.log('Date range:', startDate, 'to', endDate);
    
    const report = await db
      .selectFrom('user_sessions')
      .innerJoin('pppoe_users', 'user_sessions.username', 'pppoe_users.username')
      .select([
        'user_sessions.username',
        'pppoe_users.profile',
        'user_sessions.ip_address',
        'user_sessions.data_usage_bytes',
        'user_sessions.session_start',
        'user_sessions.session_end',
        'user_sessions.status'
      ])
      .where('user_sessions.user_type', '=', 'pppoe')
      .where('user_sessions.session_start', '>=', startDate)
      .where('user_sessions.session_start', '<=', endDate)
      .execute();
    
    // Aggregate data by user
    const userStats = {};
    
    for (const session of report) {
      const username = session.username;
      if (!userStats[username]) {
        userStats[username] = {
          username,
          profile: session.profile,
          totalSessions: 0,
          dataUsage: 0,
          status: 'inactive',
          lastActive: null
        };
      }
      
      userStats[username].totalSessions++;
      userStats[username].dataUsage += session.data_usage_bytes || 0;
      
      if (session.status === 'active') {
        userStats[username].status = 'active';
      }
      
      if (!userStats[username].lastActive || session.session_start > userStats[username].lastActive) {
        userStats[username].lastActive = session.session_start;
      }
    }
    
    // Convert to array and format data
    const reportData = Object.values(userStats).map(user => ({
      ...user,
      dataUsage: (user.dataUsage / (1024 * 1024 * 1024)).toFixed(2), // Convert to GB
      lastActive: user.lastActive ? new Date(user.lastActive).toISOString().split('T')[0] : 'Never'
    }));
    
    console.log('Generated report with', reportData.length, 'users');
    res.json(reportData);
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('Fetching dashboard statistics...');
    
    const [deviceStats, userStats, sessionStats] = await Promise.all([
      // Device statistics
      db
        .selectFrom('devices')
        .select(['status'])
        .execute(),
      
      // User statistics
      Promise.all([
        db.selectFrom('hotspot_users').select(db.fn.count('id').as('count')).executeTakeFirst(),
        db.selectFrom('pppoe_users').select(db.fn.count('id').as('count')).executeTakeFirst()
      ]),
      
      // Active session statistics
      db
        .selectFrom('user_sessions')
        .select(db.fn.count('id').as('count'))
        .where('status', '=', 'active')
        .executeTakeFirst()
    ]);
    
    const onlineDevices = deviceStats.filter(d => d.status === 'online').length;
    const totalDevices = deviceStats.length;
    const totalUsers = (userStats[0]?.count || 0) + (userStats[1]?.count || 0);
    const activeSessions = sessionStats?.count || 0;
    
    const stats = {
      devices: {
        total: totalDevices,
        online: onlineDevices,
        offline: totalDevices - onlineDevices
      },
      users: {
        total: Number(totalUsers),
        hotspot: Number(userStats[0]?.count || 0),
        pppoe: Number(userStats[1]?.count || 0)
      },
      sessions: {
        active: Number(activeSessions)
      }
    };
    
    console.log('Dashboard statistics:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;

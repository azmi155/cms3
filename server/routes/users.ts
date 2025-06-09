import express from 'express';
import { db } from '../db/connection.js';
import { createMikroTikService } from '../services/mikrotik.js';

const router = express.Router();

// Get hotspot users for a device
router.get('/hotspot/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    console.log('Fetching hotspot users for device:', deviceId);
    
    const users = await db
      .selectFrom('hotspot_users')
      .selectAll()
      .where('device_id', '=', parseInt(deviceId))
      .execute();
    
    console.log('Found hotspot users:', users.length);
    res.json(users);
  } catch (error) {
    console.error('Error fetching hotspot users:', error);
    res.status(500).json({ error: 'Failed to fetch hotspot users' });
  }
});

// Add hotspot user
router.post('/hotspot', async (req, res) => {
  try {
    const { device_id, username, password, profile } = req.body;
    
    console.log('Adding hotspot user:', { device_id, username, profile });

    // Get device information
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', parseInt(device_id))
      .executeTakeFirst();

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Add user to MikroTik if it's online and is a MikroTik device
    if (device.type.toLowerCase() === 'mikrotik' && device.status === 'online') {
      try {
        const mikrotikService = createMikroTikService({
          host: device.ip_address,
          username: device.username,
          password: device.password
        });

        await mikrotikService.addHotspotUser({
          name: username,
          password: password,
          profile: profile,
          comment: `Added via Dashboard - ${new Date().toISOString()}`
        });

        console.log('User added to MikroTik successfully');
      } catch (mikrotikError) {
        console.error('Failed to add user to MikroTik:', mikrotikError);
        res.status(500).json({ error: 'Failed to add user to MikroTik: ' + mikrotikError.message });
        return;
      }
    }
    
    const now = new Date().toISOString();
    
    const user = await db
      .insertInto('hotspot_users')
      .values({
        device_id: parseInt(device_id),
        username,
        password,
        profile,
        status: 'active',
        created_at: now,
        updated_at: now
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('Hotspot user added successfully:', user);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error adding hotspot user:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'User already exists on this device' });
      return;
    }
    res.status(500).json({ error: 'Failed to add hotspot user' });
  }
});

// Update hotspot user
router.put('/hotspot/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, profile, status } = req.body;
    
    console.log('Updating hotspot user:', id);

    // Get user and device information
    const user = await db
      .selectFrom('hotspot_users')
      .innerJoin('devices', 'devices.id', 'hotspot_users.device_id')
      .selectAll()
      .where('hotspot_users.id', '=', parseInt(id))
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update in MikroTik if it's online and is a MikroTik device
    if (user.type.toLowerCase() === 'mikrotik' && user.status === 'online') {
      try {
        const mikrotikService = createMikroTikService({
          host: user.ip_address,
          username: user.username,
          password: user.password
        });

        // For now, we'll just log that we would update in MikroTik
        console.log('Would update user in MikroTik:', { username, profile, status });
      } catch (mikrotikError) {
        console.error('Failed to update user in MikroTik:', mikrotikError);
        // Continue with database update even if MikroTik update fails
      }
    }
    
    const updatedUser = await db
      .updateTable('hotspot_users')
      .set({
        username,
        password,
        profile,
        status,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('Hotspot user updated successfully');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating hotspot user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get PPPoE users for a device
router.get('/pppoe/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    console.log('Fetching PPPoE users for device:', deviceId);
    
    const users = await db
      .selectFrom('pppoe_users')
      .selectAll()
      .where('device_id', '=', parseInt(deviceId))
      .execute();
    
    console.log('Found PPPoE users:', users.length);
    res.json(users);
  } catch (error) {
    console.error('Error fetching PPPoE users:', error);
    res.status(500).json({ error: 'Failed to fetch PPPoE users' });
  }
});

// Add PPPoE user
router.post('/pppoe', async (req, res) => {
  try {
    const { 
      device_id, 
      username, 
      password, 
      profile, 
      service, 
      ip_address,
      real_name,
      address,
      whatsapp_contact,
      remote_device,
      service_cost
    } = req.body;
    
    console.log('Adding PPPoE user:', { device_id, username, profile, service });

    // Get device information
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', parseInt(device_id))
      .executeTakeFirst();

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Add user to MikroTik if it's online and is a MikroTik device
    if (device.type.toLowerCase() === 'mikrotik' && device.status === 'online') {
      try {
        const mikrotikService = createMikroTikService({
          host: device.ip_address,
          username: device.username,
          password: device.password
        });

        await mikrotikService.addPPPoEUser({
          name: username,
          password: password,
          profile: profile,
          service: service,
          comment: `Added via Dashboard - ${new Date().toISOString()}`,
          remoteAddress: ip_address
        });

        console.log('PPPoE user added to MikroTik successfully');
      } catch (mikrotikError) {
        console.error('Failed to add PPPoE user to MikroTik:', mikrotikError);
        res.status(500).json({ error: 'Failed to add user to MikroTik: ' + mikrotikError.message });
        return;
      }
    }
    
    const now = new Date().toISOString();
    
    const user = await db
      .insertInto('pppoe_users')
      .values({
        device_id: parseInt(device_id),
        username,
        password,
        profile,
        service,
        ip_address,
        real_name,
        address,
        whatsapp_contact,
        remote_device,
        service_cost: service_cost ? parseFloat(service_cost) : null,
        status: 'active',
        created_at: now,
        updated_at: now
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('PPPoE user added successfully:', user);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error adding PPPoE user:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'User already exists on this device' });
      return;
    }
    res.status(500).json({ error: 'Failed to add PPPoE user' });
  }
});

// Update PPPoE user
router.put('/pppoe/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      username, 
      password, 
      profile, 
      service, 
      status,
      ip_address,
      real_name,
      address,
      whatsapp_contact,
      remote_device,
      service_cost
    } = req.body;
    
    console.log('Updating PPPoE user:', id);

    // Get user and device information
    const user = await db
      .selectFrom('pppoe_users')
      .innerJoin('devices', 'devices.id', 'pppoe_users.device_id')
      .selectAll()
      .where('pppoe_users.id', '=', parseInt(id))
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update in MikroTik if it's online and is a MikroTik device
    if (user.type.toLowerCase() === 'mikrotik' && user.status === 'online') {
      try {
        const mikrotikService = createMikroTikService({
          host: user.ip_address,
          username: user.username,
          password: user.password
        });

        // For now, we'll just log that we would update in MikroTik
        console.log('Would update PPPoE user in MikroTik:', { username, profile, service, status });
      } catch (mikrotikError) {
        console.error('Failed to update PPPoE user in MikroTik:', mikrotikError);
        // Continue with database update even if MikroTik update fails
      }
    }
    
    const updatedUser = await db
      .updateTable('pppoe_users')
      .set({
        username,
        password,
        profile,
        service,
        status,
        ip_address,
        real_name,
        address,
        whatsapp_contact,
        remote_device,
        service_cost: service_cost ? parseFloat(service_cost) : null,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('PPPoE user updated successfully');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating PPPoE user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete hotspot user
router.delete('/hotspot/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting hotspot user:', id);

    // Get user and device information
    const user = await db
      .selectFrom('hotspot_users')
      .innerJoin('devices', 'devices.id', 'hotspot_users.device_id')
      .selectAll()
      .where('hotspot_users.id', '=', parseInt(id))
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete from MikroTik if it's online and is a MikroTik device
    if (user.type.toLowerCase() === 'mikrotik' && user.status === 'online') {
      try {
        const mikrotikService = createMikroTikService({
          host: user.ip_address,
          username: user.username,
          password: user.password
        });

        // First, get the user ID from MikroTik
        const mikrotikUsers = await mikrotikService.getHotspotUsers();
        const mikrotikUser = mikrotikUsers.find(u => u.name === user.username);
        
        if (mikrotikUser) {
          await mikrotikService.deleteHotspotUser(mikrotikUser['.id']);
          console.log('User deleted from MikroTik successfully');
        }
      } catch (mikrotikError) {
        console.error('Failed to delete user from MikroTik:', mikrotikError);
        // Continue with database deletion even if MikroTik deletion fails
      }
    }
    
    await db
      .deleteFrom('hotspot_users')
      .where('id', '=', parseInt(id))
      .executeTakeFirst();
    
    console.log('Hotspot user deleted successfully');
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting hotspot user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Delete PPPoE user
router.delete('/pppoe/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting PPPoE user:', id);

    // Get user and device information
    const user = await db
      .selectFrom('pppoe_users')
      .innerJoin('devices', 'devices.id', 'pppoe_users.device_id')
      .selectAll()
      .where('pppoe_users.id', '=', parseInt(id))
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete from MikroTik if it's online and is a MikroTik device
    if (user.type.toLowerCase() === 'mikrotik' && user.status === 'online') {
      try {
        const mikrotikService = createMikroTikService({
          host: user.ip_address,
          username: user.username,
          password: user.password
        });

        // First, get the user ID from MikroTik
        const mikrotikUsers = await mikrotikService.getPPPoEUsers();
        const mikrotikUser = mikrotikUsers.find(u => u.name === user.username);
        
        if (mikrotikUser) {
          await mikrotikService.deletePPPoEUser(mikrotikUser['.id']);
          console.log('PPPoE user deleted from MikroTik successfully');
        }
      } catch (mikrotikError) {
        console.error('Failed to delete PPPoE user from MikroTik:', mikrotikError);
        // Continue with database deletion even if MikroTik deletion fails
      }
    }
    
    await db
      .deleteFrom('pppoe_users')
      .where('id', '=', parseInt(id))
      .executeTakeFirst();
    
    console.log('PPPoE user deleted successfully');
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting PPPoE user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Sync users from MikroTik device
router.post('/sync/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { userType } = req.body; // 'hotspot' or 'pppoe' or 'all'
    
    console.log('Syncing users from device:', deviceId, 'type:', userType);
    
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', parseInt(deviceId))
      .executeTakeFirst();
    
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    if (device.type.toLowerCase() !== 'mikrotik') {
      res.status(400).json({ error: 'User sync only available for MikroTik devices' });
      return;
    }

    if (device.status !== 'online') {
      res.status(400).json({ error: 'Device is offline' });
      return;
    }

    const mikrotikService = createMikroTikService({
      host: device.ip_address,
      username: device.username,
      password: device.password
    });

    let hotspotAdded = 0;
    let pppoeAdded = 0;
    const now = new Date().toISOString();

    // Sync Hotspot Users
    if (userType === 'hotspot' || userType === 'all' || !userType) {
      try {
        console.log('Syncing hotspot users...');
        const mikrotikHotspotUsers = await mikrotikService.getHotspotUsers();
        
        for (const mtUser of mikrotikHotspotUsers) {
          if (!mtUser.name) continue;
          
          try {
            await db
              .insertInto('hotspot_users')
              .values({
                device_id: parseInt(deviceId),
                username: mtUser.name,
                password: mtUser.password || '',
                profile: mtUser.profile || 'default',
                status: mtUser.disabled === 'true' ? 'disabled' : 'active',
                created_at: now,
                updated_at: now
              })
              .execute();
            hotspotAdded++;
          } catch (error) {
            if (error.code !== 'SQLITE_CONSTRAINT_UNIQUE') {
              console.error('Error adding synced hotspot user:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error syncing hotspot users:', error);
      }
    }

    // Sync PPPoE Users  
    if (userType === 'pppoe' || userType === 'all' || !userType) {
      try {
        console.log('Syncing PPPoE users...');
        const mikrotikPPPoEUsers = await mikrotikService.getPPPoEUsers();
        
        for (const mtUser of mikrotikPPPoEUsers) {
          if (!mtUser.name) continue;
          
          try {
            await db
              .insertInto('pppoe_users')
              .values({
                device_id: parseInt(deviceId),
                username: mtUser.name,
                password: mtUser.password || '',
                profile: mtUser.profile || 'default',
                service: 'pppoe',
                status: mtUser.disabled === 'true' ? 'disabled' : 'active',
                created_at: now,
                updated_at: now
              })
              .execute();
            pppoeAdded++;
          } catch (error) {
            if (error.code !== 'SQLITE_CONSTRAINT_UNIQUE') {
              console.error('Error adding synced PPPoE user:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error syncing PPPoE users:', error);
      }
    }
    
    const message = `Sync completed. Added ${hotspotAdded} hotspot users and ${pppoeAdded} PPPoE users.`;
    console.log(message);
    res.json({ 
      message,
      hotspotAdded,
      pppoeAdded,
      totalAdded: hotspotAdded + pppoeAdded
    });
  } catch (error) {
    console.error('Error syncing users:', error);
    res.status(500).json({ error: 'Failed to sync users: ' + error.message });
  }
});

// Get active sessions from MikroTik
router.get('/sessions/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { type } = req.query; // 'hotspot' or 'pppoe'
    
    console.log('Fetching active sessions for device:', deviceId, 'type:', type);
    
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', parseInt(deviceId))
      .executeTakeFirst();
    
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    if (device.type.toLowerCase() !== 'mikrotik') {
      res.status(400).json({ error: 'Active sessions only available for MikroTik devices' });
      return;
    }

    if (device.status !== 'online') {
      res.status(400).json({ error: 'Device is offline' });
      return;
    }

    const mikrotikService = createMikroTikService({
      host: device.ip_address,
      username: device.username,
      password: device.password
    });

    let sessions = [];

    if (type === 'hotspot' || !type) {
      const hotspotSessions = await mikrotikService.getActiveHotspotSessions();
      sessions = sessions.concat(hotspotSessions.map(s => ({ ...s, type: 'hotspot' })));
    }

    if (type === 'pppoe' || !type) {
      const pppoeSessions = await mikrotikService.getActivePPPoESessions();
      sessions = sessions.concat(pppoeSessions.map(s => ({ ...s, type: 'pppoe' })));
    }
    
    console.log(`Found ${sessions.length} active sessions`);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions: ' + error.message });
  }
});

export default router;

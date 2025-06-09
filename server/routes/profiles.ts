import express from 'express';
import { db } from '../db/connection.js';
import { createMikroTikService } from '../services/mikrotik.js';

const router = express.Router();

// Get hotspot profiles for a device
router.get('/hotspot/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    console.log('Fetching hotspot profiles for device:', deviceId);
    
    const profiles = await db
      .selectFrom('hotspot_profiles')
      .selectAll()
      .where('device_id', '=', parseInt(deviceId))
      .execute();
    
    console.log('Found hotspot profiles:', profiles.length);
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching hotspot profiles:', error);
    res.status(500).json({ error: 'Failed to fetch hotspot profiles' });
  }
});

// Get PPPoE profiles for a device
router.get('/pppoe/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    console.log('Fetching PPPoE profiles for device:', deviceId);
    
    const profiles = await db
      .selectFrom('pppoe_profiles')
      .selectAll()
      .where('device_id', '=', parseInt(deviceId))
      .execute();
    
    console.log('Found PPPoE profiles:', profiles.length);
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching PPPoE profiles:', error);
    res.status(500).json({ error: 'Failed to fetch PPPoE profiles' });
  }
});

// Sync profiles from MikroTik device
router.post('/sync/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { profileType } = req.body; // 'hotspot' or 'pppoe' or 'all'
    
    console.log('Syncing profiles from device:', deviceId, 'type:', profileType);
    
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
      res.status(400).json({ error: 'Profile sync only available for MikroTik devices' });
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

    // Sync Hotspot Profiles
    if (profileType === 'hotspot' || profileType === 'all' || !profileType) {
      try {
        console.log('Syncing hotspot profiles...');
        const mikrotikHotspotProfiles = await mikrotikService.getHotspotProfiles();
        
        for (const mtProfile of mikrotikHotspotProfiles) {
          if (!mtProfile.name) continue;
          
          try {
            await db
              .insertInto('hotspot_profiles')
              .values({
                device_id: parseInt(deviceId),
                name: mtProfile.name,
                rate_limit: mtProfile['rate-limit'] || null,
                session_timeout: mtProfile['session-timeout'] || null,
                shared_users: parseInt(mtProfile['shared-users']) || 1,
                status: 'active',
                created_at: now
              })
              .execute();
            hotspotAdded++;
          } catch (error) {
            if (error.code !== 'SQLITE_CONSTRAINT_UNIQUE') {
              console.error('Error adding synced hotspot profile:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error syncing hotspot profiles:', error);
      }
    }

    // Sync PPPoE Profiles
    if (profileType === 'pppoe' || profileType === 'all' || !profileType) {
      try {
        console.log('Syncing PPPoE profiles...');
        const mikrotikPPPoEProfiles = await mikrotikService.getPPPoEProfiles();
        
        for (const mtProfile of mikrotikPPPoEProfiles) {
          if (!mtProfile.name) continue;
          
          try {
            await db
              .insertInto('pppoe_profiles')
              .values({
                device_id: parseInt(deviceId),
                name: mtProfile.name,
                local_address: mtProfile['local-address'] || null,
                remote_address: mtProfile['remote-address'] || null,
                rate_limit: mtProfile['rate-limit'] || null,
                status: 'active',
                created_at: now
              })
              .execute();
            pppoeAdded++;
          } catch (error) {
            if (error.code !== 'SQLITE_CONSTRAINT_UNIQUE') {
              console.error('Error adding synced PPPoE profile:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error syncing PPPoE profiles:', error);
      }
    }
    
    const message = `Profile sync completed. Added ${hotspotAdded} hotspot profiles and ${pppoeAdded} PPPoE profiles.`;
    console.log(message);
    res.json({ 
      message,
      hotspotAdded,
      pppoeAdded,
      totalAdded: hotspotAdded + pppoeAdded
    });
  } catch (error) {
    console.error('Error syncing profiles:', error);
    res.status(500).json({ error: 'Failed to sync profiles: ' + error.message });
  }
});

// Get profiles from MikroTik (live data)
router.get('/mikrotik/:deviceId/:type', async (req, res) => {
  try {
    const { deviceId, type } = req.params;
    
    console.log('Fetching live profiles from MikroTik device:', deviceId, 'type:', type);
    
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
      res.status(400).json({ error: 'Live profiles only available for MikroTik devices' });
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

    let profiles = [];

    if (type === 'hotspot') {
      profiles = await mikrotikService.getHotspotProfiles();
    } else if (type === 'pppoe') {
      profiles = await mikrotikService.getPPPoEProfiles();
    } else {
      res.status(400).json({ error: 'Invalid profile type. Use "hotspot" or "pppoe"' });
      return;
    }
    
    console.log(`Found ${profiles.length} live ${type} profiles`);
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching live profiles:', error);
    res.status(500).json({ error: 'Failed to fetch live profiles: ' + error.message });
  }
});

// Add hotspot profile
router.post('/hotspot', async (req, res) => {
  try {
    const { device_id, name, rate_limit, session_timeout, shared_users } = req.body;
    
    console.log('Adding hotspot profile:', { device_id, name, rate_limit });
    
    const profile = await db
      .insertInto('hotspot_profiles')
      .values({
        device_id: parseInt(device_id),
        name,
        rate_limit,
        session_timeout,
        shared_users: shared_users || 1,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('Hotspot profile added successfully:', profile);
    res.status(201).json(profile);
  } catch (error) {
    console.error('Error adding hotspot profile:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Profile with this name already exists on this device' });
      return;
    }
    res.status(500).json({ error: 'Failed to add hotspot profile' });
  }
});

// Add PPPoE profile
router.post('/pppoe', async (req, res) => {
  try {
    const { device_id, name, local_address, remote_address, rate_limit } = req.body;
    
    console.log('Adding PPPoE profile:', { device_id, name, rate_limit });
    
    const profile = await db
      .insertInto('pppoe_profiles')
      .values({
        device_id: parseInt(device_id),
        name,
        local_address,
        remote_address,
        rate_limit,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('PPPoE profile added successfully:', profile);
    res.status(201).json(profile);
  } catch (error) {
    console.error('Error adding PPPoE profile:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Profile with this name already exists on this device' });
      return;
    }
    res.status(500).json({ error: 'Failed to add PPPoE profile' });
  }
});

export default router;

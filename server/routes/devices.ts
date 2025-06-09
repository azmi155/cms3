import express from 'express';
import { db } from '../db/connection.js';
import { createMikroTikService } from '../services/mikrotik.js';

const router = express.Router();

// Get all devices
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all devices...');
    const devices = await db
      .selectFrom('devices')
      .selectAll()
      .execute();
    
    console.log('Found devices:', devices.length);
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Add new device
router.post('/', async (req, res) => {
  try {
    const { name, type, ip_address, username, password } = req.body;
    
    console.log('Adding new device:', { name, type, ip_address, username });
    
    const now = new Date().toISOString();
    
    const device = await db
      .insertInto('devices')
      .values({
        name,
        type,
        ip_address,
        username,
        password,
        status: 'offline',
        created_at: now,
        updated_at: now
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('Device added successfully:', device);
    res.status(201).json(device);
  } catch (error) {
    console.error('Error adding device:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Device with this IP address already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to add device' });
  }
});

// Update device
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, ip_address, username, password, status } = req.body;
    
    console.log('Updating device:', id, req.body);
    
    const device = await db
      .updateTable('devices')
      .set({
        name,
        type,
        ip_address,
        username,
        password,
        status,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();
    
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    
    console.log('Device updated successfully:', device);
    res.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Delete device
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting device:', id);
    
    const result = await db
      .deleteFrom('devices')
      .where('id', '=', parseInt(id))
      .executeTakeFirst();
    
    if (result.numDeletedRows === 0n) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    
    console.log('Device deleted successfully');
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// Test MikroTik connection and sync device status
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Syncing device status:', id);
    
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', parseInt(id))
      .executeTakeFirst();
    
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    let status = 'offline';
    let systemInfo = null;

    // Test MikroTik connection for MikroTik devices
    if (device.type.toLowerCase() === 'mikrotik') {
      try {
        console.log(`Testing MikroTik connection to ${device.ip_address}...`);
        const mikrotikService = createMikroTikService({
          host: device.ip_address,
          username: device.username,
          password: device.password
        });

        const connectionResult = await mikrotikService.testConnection();
        if (connectionResult.success) {
          status = 'online';
          console.log(`MikroTik ${device.ip_address} is online, version: ${connectionResult.version}`);
          
          // Get additional system information
          try {
            systemInfo = await mikrotikService.getSystemInfo();
          } catch (infoError) {
            console.log('Could not fetch system info, but device is online');
          }
        } else {
          console.log(`MikroTik ${device.ip_address} is offline: ${connectionResult.error}`);
        }
      } catch (error) {
        console.log(`MikroTik ${device.ip_address} connection failed:`, error.message);
      }
    } else {
      // For non-MikroTik devices, do a simple ping simulation
      status = Math.random() > 0.3 ? 'online' : 'offline';
    }
    
    const updatedDevice = await db
      .updateTable('devices')
      .set({
        status,
        last_seen: status === 'online' ? new Date().toISOString() : device.last_seen,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('Device sync completed:', updatedDevice);
    res.json({
      ...updatedDevice,
      systemInfo: systemInfo
    });
  } catch (error) {
    console.error('Error syncing device:', error);
    res.status(500).json({ error: 'Failed to sync device' });
  }
});

// Get device system information (for MikroTik devices)
router.get('/:id/info', async (req, res) => {
  try {
    const { id } = req.params;
    
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', parseInt(id))
      .executeTakeFirst();
    
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    if (device.type.toLowerCase() !== 'mikrotik') {
      res.status(400).json({ error: 'System info only available for MikroTik devices' });
      return;
    }

    if (device.status !== 'online') {
      res.status(400).json({ error: 'Device is offline' });
      return;
    }

    try {
      const mikrotikService = createMikroTikService({
        host: device.ip_address,
        username: device.username,
        password: device.password
      });

      const systemInfo = await mikrotikService.getSystemInfo();
      res.json(systemInfo);
    } catch (error) {
      console.error('Error fetching device info:', error);
      res.status(500).json({ error: 'Failed to fetch device information' });
    }
  } catch (error) {
    console.error('Error in device info endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

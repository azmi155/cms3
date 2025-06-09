import express from 'express';
import { db } from '../db/connection.js';
import { createMikroTikService } from '../services/mikrotik.js';

const router = express.Router();

// Validation helper functions
const validateRequiredFields = (fields, body) => {
  const missing = fields.filter(field => !body[field] || (typeof body[field] === 'string' && !body[field].trim()));
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
};

const validateIPAddress = (ip) => {
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (!ipRegex.test(ip)) {
    throw new Error('Invalid IP address format');
  }
  
  // Additional validation for IP address ranges
  const parts = ip.split('.');
  for (const part of parts) {
    const num = parseInt(part);
    if (num < 0 || num > 255) {
      throw new Error('Invalid IP address: octets must be between 0-255');
    }
  }
};

// Get all devices
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all devices...');
    const devices = await db
      .selectFrom('devices')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
    
    console.log(`✅ Found ${devices.length} devices`);
    res.json(devices);
    return;
  } catch (error) {
    console.error('❌ Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices: ' + error.message });
    return;
  }
});

// Add new device
router.post('/', async (req, res) => {
  try {
    console.log('📥 Raw request body:', req.body);
    
    const { name, type, ip_address, username, password } = req.body;
    
    console.log('➕ Adding new device:', { name, type, ip_address, username });
    
    // Validate required fields
    try {
      validateRequiredFields(['name', 'type', 'ip_address', 'username', 'password'], req.body);
    } catch (validationError) {
      console.log('❌ Validation error:', validationError.message);
      res.status(400).json({ error: validationError.message });
      return;
    }

    // Validate and sanitize inputs
    try {
      validateIPAddress(ip_address);
    } catch (ipError) {
      console.log('❌ IP validation error:', ipError.message);
      res.status(400).json({ error: ipError.message });
      return;
    }
    
    const sanitizedName = name.trim();
    const sanitizedType = type.toLowerCase().trim();
    const sanitizedIP = ip_address.trim();
    const sanitizedUsername = username.trim();
    
    if (sanitizedName.length < 1 || sanitizedName.length > 100) {
      res.status(400).json({ error: 'Device name must be between 1 and 100 characters' });
      return;
    }
    
    if (!['mikrotik', 'ruijie', 'olt', 'other'].includes(sanitizedType)) {
      res.status(400).json({ error: 'Invalid device type. Must be one of: mikrotik, ruijie, olt, other' });
      return;
    }

    // Check if device with same IP already exists
    console.log('🔍 Checking for existing device with IP:', sanitizedIP);
    const existingDevice = await db
      .selectFrom('devices')
      .select(['id', 'name'])
      .where('ip_address', '=', sanitizedIP)
      .executeTakeFirst();

    if (existingDevice) {
      console.log('⚠️  Device with IP already exists:', existingDevice);
      res.status(400).json({ 
        error: `Device with IP address ${sanitizedIP} already exists (${existingDevice.name})` 
      });
      return;
    }
    
    const now = new Date().toISOString();
    
    console.log('💾 Inserting device into database...');
    
    const insertData = {
      name: sanitizedName,
      type: sanitizedType,
      ip_address: sanitizedIP,
      username: sanitizedUsername,
      password: password,
      status: 'offline',
      created_at: now,
      updated_at: now
    };
    
    console.log('📋 Insert data:', { ...insertData, password: '[HIDDEN]' });
    
    const device = await db
      .insertInto('devices')
      .values(insertData)
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('✅ Device added successfully:', { id: device.id, name: device.name, ip: device.ip_address });
    
    // Don't return password in response
    const responseDevice = { ...device };
    delete responseDevice.password;
    
    res.status(201).json(responseDevice);
    return;
  } catch (error) {
    console.error('❌ Error adding device:', error);
    console.error('❌ Full error stack:', error.stack);
    
    // Handle specific database errors
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      if (error.message.includes('ip_address')) {
        res.status(400).json({ error: 'Device with this IP address already exists' });
      } else {
        res.status(400).json({ error: 'Device with this configuration already exists' });
      }
      return;
    }
    
    if (error.message && error.message.includes('NOT NULL constraint failed')) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    if (error.message.includes('Missing required fields') || error.message.includes('Invalid')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ error: 'Failed to add device: ' + error.message });
    return;
  }
});

// Update device
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, ip_address, username, password, status } = req.body;
    
    console.log('✏️  Updating device:', id);
    
    // Validate device ID
    const deviceId = parseInt(id);
    if (isNaN(deviceId) || deviceId <= 0) {
      res.status(400).json({ error: 'Invalid device ID' });
      return;
    }

    // Check if device exists
    const existingDevice = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', deviceId)
      .executeTakeFirst();

    if (!existingDevice) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Validate required fields
    validateRequiredFields(['name', 'type', 'ip_address', 'username', 'password'], req.body);

    // Validate and sanitize inputs
    validateIPAddress(ip_address);
    
    const sanitizedName = name.trim();
    const sanitizedType = type.toLowerCase().trim();
    const sanitizedIP = ip_address.trim();
    const sanitizedUsername = username.trim();
    
    if (sanitizedName.length < 1 || sanitizedName.length > 100) {
      res.status(400).json({ error: 'Device name must be between 1 and 100 characters' });
      return;
    }
    
    if (!['mikrotik', 'ruijie', 'olt', 'other'].includes(sanitizedType)) {
      res.status(400).json({ error: 'Invalid device type. Must be one of: mikrotik, ruijie, olt, other' });
      return;
    }

    // Check if another device with same IP exists (excluding current device)
    if (sanitizedIP !== existingDevice.ip_address) {
      const duplicateDevice = await db
        .selectFrom('devices')
        .select(['id', 'name'])
        .where('ip_address', '=', sanitizedIP)
        .where('id', '!=', deviceId)
        .executeTakeFirst();

      if (duplicateDevice) {
        res.status(400).json({ 
          error: `Another device with IP address ${sanitizedIP} already exists (${duplicateDevice.name})` 
        });
        return;
      }
    }
    
    console.log('💾 Updating device in database...');
    const device = await db
      .updateTable('devices')
      .set({
        name: sanitizedName,
        type: sanitizedType,
        ip_address: sanitizedIP,
        username: sanitizedUsername,
        password: password,
        status: status || existingDevice.status,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', deviceId)
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('✅ Device updated successfully:', { id: device.id, name: device.name });
    
    // Don't return password in response
    const responseDevice = { ...device };
    delete responseDevice.password;
    
    res.json(responseDevice);
    return;
  } catch (error) {
    console.error('❌ Error updating device:', error);
    
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Device with this IP address already exists' });
      return;
    }
    
    if (error.message.includes('Missing required fields') || error.message.includes('Invalid')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ error: 'Failed to update device: ' + error.message });
    return;
  }
});

// Delete device
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️  Deleting device:', id);
    
    const deviceId = parseInt(id);
    if (isNaN(deviceId) || deviceId <= 0) {
      res.status(400).json({ error: 'Invalid device ID' });
      return;
    }
    
    // Check if device exists before deleting
    const existingDevice = await db
      .selectFrom('devices')
      .select(['id', 'name'])
      .where('id', '=', deviceId)
      .executeTakeFirst();

    if (!existingDevice) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    
    await db
      .deleteFrom('devices')
      .where('id', '=', deviceId)
      .executeTakeFirst();
    
    console.log('✅ Device deleted successfully:', existingDevice.name);
    res.json({ 
      message: 'Device deleted successfully',
      device: { id: existingDevice.id, name: existingDevice.name }
    });
    return;
  } catch (error) {
    console.error('❌ Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device: ' + error.message });
    return;
  }
});

// Test MikroTik connection and sync device status
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔄 Syncing device status:', id);
    
    const deviceId = parseInt(id);
    if (isNaN(deviceId) || deviceId <= 0) {
      res.status(400).json({ error: 'Invalid device ID' });
      return;
    }
    
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', deviceId)
      .executeTakeFirst();
    
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    let status = 'offline';
    let systemInfo = null;
    let errorMessage = null;

    // Test MikroTik connection for MikroTik devices
    if (device.type.toLowerCase() === 'mikrotik') {
      try {
        console.log(`🔌 Testing MikroTik connection to ${device.ip_address}...`);
        const mikrotikService = createMikroTikService({
          host: device.ip_address,
          username: device.username,
          password: device.password
        });

        const connectionResult = await mikrotikService.testConnection();
        if (connectionResult.success) {
          status = 'online';
          console.log(`✅ MikroTik ${device.ip_address} is online, version: ${connectionResult.version}`);
          
          // Get additional system information
          try {
            systemInfo = await mikrotikService.getSystemInfo();
          } catch (infoError) {
            console.log('⚠️  Could not fetch system info, but device is online');
          }
        } else {
          console.log(`❌ MikroTik ${device.ip_address} is offline: ${connectionResult.error}`);
          errorMessage = connectionResult.error;
        }
      } catch (error) {
        console.log(`❌ MikroTik ${device.ip_address} connection failed:`, error.message);
        errorMessage = error.message;
      }
    } else {
      // For non-MikroTik devices, do a simple ping simulation
      status = Math.random() > 0.3 ? 'online' : 'offline';
      console.log(`🎲 Simulated status check for ${device.type} device: ${status}`);
    }
    
    const updatedDevice = await db
      .updateTable('devices')
      .set({
        status,
        last_seen: status === 'online' ? new Date().toISOString() : device.last_seen,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', deviceId)
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('✅ Device sync completed:', updatedDevice.name, 'status:', status);
    
    // Don't return password in response
    const responseDevice = { ...updatedDevice };
    delete responseDevice.password;
    
    const response = {
      ...responseDevice,
      systemInfo: systemInfo
    };

    if (errorMessage) {
      response.error = errorMessage;
    }

    res.json(response);
    return;
  } catch (error) {
    console.error('❌ Error syncing device:', error);
    res.status(500).json({ error: 'Failed to sync device: ' + error.message });
    return;
  }
});

// Get device system information (for MikroTik devices)
router.get('/:id/info', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deviceId = parseInt(id);
    if (isNaN(deviceId) || deviceId <= 0) {
      res.status(400).json({ error: 'Invalid device ID' });
      return;
    }
    
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', deviceId)
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
      return;
    } catch (error) {
      console.error('❌ Error fetching device info:', error);
      res.status(500).json({ error: 'Failed to fetch device information: ' + error.message });
      return;
    }
  } catch (error) {
    console.error('❌ Error in device info endpoint:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
    return;
  }
});

export default router;

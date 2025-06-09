import express from 'express';
import { systemMonitor } from '../services/system-monitor.js';

const router = express.Router();

// Get current system statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('Fetching system statistics...');
    
    const stats = await systemMonitor.getSystemStats();
    
    console.log('System stats retrieved:', {
      cpu: `${stats.cpu.usage.toFixed(1)}%`,
      memory: `${stats.memory.percentage.toFixed(1)}%`,
      disk: `${stats.disk.percentage.toFixed(1)}%`,
      uptime: systemMonitor.formatUptime(stats.uptime)
    });
    
    res.json(stats);
    return;
  } catch (error) {
    console.error('Error fetching system statistics:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics: ' + error.message });
    return;
  }
});

// Get formatted system information
router.get('/info', async (req, res) => {
  try {
    console.log('Fetching system information...');
    
    const stats = await systemMonitor.getSystemStats();
    
    const formattedInfo = {
      platform: {
        os: stats.platform,
        arch: stats.arch,
        node: stats.nodeVersion
      },
      cpu: {
        model: stats.cpu.model,
        cores: stats.cpu.cores,
        speed: `${(stats.cpu.speed / 1000).toFixed(2)} GHz`,
        usage: `${stats.cpu.usage.toFixed(1)}%`
      },
      memory: {
        total: systemMonitor.formatBytes(stats.memory.total),
        used: systemMonitor.formatBytes(stats.memory.used),
        free: systemMonitor.formatBytes(stats.memory.free),
        percentage: `${stats.memory.percentage.toFixed(1)}%`
      },
      disk: {
        total: systemMonitor.formatBytes(stats.disk.total),
        used: systemMonitor.formatBytes(stats.disk.used),
        free: systemMonitor.formatBytes(stats.disk.free),
        percentage: `${stats.disk.percentage.toFixed(1)}%`
      },
      uptime: {
        system: systemMonitor.formatUptime(stats.uptime),
        process: systemMonitor.formatUptime(stats.processUptime)
      },
      network: {
        interfaces: stats.network.interfaces.filter(iface => !iface.internal)
      }
    };
    
    console.log('System info formatted successfully');
    res.json(formattedInfo);
    return;
  } catch (error) {
    console.error('Error fetching system information:', error);
    res.status(500).json({ error: 'Failed to fetch system information: ' + error.message });
    return;
  }
});

// Get process information
router.get('/process', (req, res) => {
  try {
    console.log('Fetching process information...');
    
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const processInfo = {
      pid: process.pid,
      ppid: process.ppid,
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      versions: process.versions,
      uptime: systemMonitor.formatUptime(process.uptime()),
      memory: {
        rss: systemMonitor.formatBytes(memUsage.rss),
        heapTotal: systemMonitor.formatBytes(memUsage.heapTotal),
        heapUsed: systemMonitor.formatBytes(memUsage.heapUsed),
        external: systemMonitor.formatBytes(memUsage.external)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      env: {
        nodeEnv: process.env.NODE_ENV || 'development',
        dataDirectory: process.env.DATA_DIRECTORY || './data',
        port: process.env.PORT || '3001'
      }
    };
    
    console.log('Process info retrieved successfully');
    res.json(processInfo);
    return;
  } catch (error) {
    console.error('Error fetching process information:', error);
    res.status(500).json({ error: 'Failed to fetch process information: ' + error.message });
    return;
  }
});

export default router;

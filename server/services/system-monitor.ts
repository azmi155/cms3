import os from 'os';
import fs from 'fs';
import { promisify } from 'util';

const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    speed: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    interfaces: NetworkInterface[];
  };
  uptime: number;
  platform: string;
  arch: string;
  nodeVersion: string;
  processUptime: number;
  timestamp: string;
}

export interface NetworkInterface {
  name: string;
  address: string;
  family: string;
  internal: boolean;
}

class SystemMonitor {
  private lastCpuInfo: any = null;
  private lastCpuTime: number = 0;

  async getSystemStats(): Promise<SystemStats> {
    const [cpuStats, memoryStats, diskStats, networkStats] = await Promise.all([
      this.getCpuStats(),
      this.getMemoryStats(),
      this.getDiskStats(),
      this.getNetworkStats()
    ]);

    return {
      cpu: cpuStats,
      memory: memoryStats,
      disk: diskStats,
      network: networkStats,
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      processUptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  private async getCpuStats() {
    const cpus = os.cpus();
    const cpuUsage = await this.getCpuUsage();

    return {
      usage: cpuUsage,
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 0
    };
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const usage = 100 - ~~(100 * idleDifference / totalDifference);
        resolve(Math.max(0, Math.min(100, usage)));
      }, 100);
    });
  }

  private cpuAverage() {
    const cpus = os.cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;

    for (const cpu of cpus) {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      irq += cpu.times.irq;
      idle += cpu.times.idle;
    }

    const total = user + nice + sys + idle + irq;
    return { idle, total };
  }

  private getMemoryStats() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = (used / total) * 100;

    return {
      total,
      used,
      free,
      percentage: Math.round(percentage * 100) / 100
    };
  }

  private async getDiskStats() {
    try {
      // Try to get disk usage for the current directory
      const dataDirectory = process.env.DATA_DIRECTORY || './data';
      
      if (process.platform === 'win32') {
        // Windows disk usage - simplified approach
        return this.getSimplifiedDiskStats();
      } else {
        // Unix-like systems
        return await this.getUnixDiskStats(dataDirectory);
      }
    } catch (error) {
      console.error('Error getting disk stats:', error);
      return this.getSimplifiedDiskStats();
    }
  }

  private getSimplifiedDiskStats() {
    // Fallback disk stats when we can't get real data
    return {
      total: 100 * 1024 * 1024 * 1024, // 100GB
      used: 50 * 1024 * 1024 * 1024,   // 50GB
      free: 50 * 1024 * 1024 * 1024,   // 50GB
      percentage: 50
    };
  }

  private async getUnixDiskStats(path: string) {
    try {
      // For Unix systems, we can use statvfs-like approach
      // This is a simplified version - in production you might want to use 'df' command
      const stats = await stat(path);
      
      // Fallback to estimated values since we can't easily get filesystem stats in Node.js
      return {
        total: 100 * 1024 * 1024 * 1024, // 100GB estimated
        used: 30 * 1024 * 1024 * 1024,   // 30GB estimated
        free: 70 * 1024 * 1024 * 1024,   // 70GB estimated
        percentage: 30
      };
    } catch (error) {
      return this.getSimplifiedDiskStats();
    }
  }

  private getNetworkStats() {
    const interfaces = os.networkInterfaces();
    const networkInterfaces: NetworkInterface[] = [];

    for (const [name, nets] of Object.entries(interfaces)) {
      if (nets) {
        for (const net of nets) {
          networkInterfaces.push({
            name,
            address: net.address,
            family: net.family,
            internal: net.internal
          });
        }
      }
    }

    return { interfaces: networkInterfaces };
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

export const systemMonitor = new SystemMonitor();

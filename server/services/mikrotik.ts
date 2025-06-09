import { RouterOSClient } from 'routeros-client';

export interface MikroTikConfig {
  host: string;
  username: string;
  password: string;
  port?: number;
}

export interface MikroTikUser {
  '.id': string;
  name: string;
  password?: string;
  profile?: string;
  'rate-limit'?: string;
  'time-left'?: string;
  disabled?: string;
  comment?: string;
}

export interface MikroTikProfile {
  '.id': string;
  name: string;
  'rate-limit'?: string;
  'session-timeout'?: string;
  'shared-users'?: string;
  'idle-timeout'?: string;
  'keepalive-timeout'?: string;
}

export interface MikroTikActiveUser {
  '.id': string;
  user: string;
  'caller-id': string;
  address: string;
  'mac-address': string;
  'session-time': string;
  'bytes-in': string;
  'bytes-out': string;
  radius?: string;
}

export class MikroTikService {
  private config: MikroTikConfig;

  constructor(config: MikroTikConfig) {
    this.config = config;
  }

  private async connect(): Promise<RouterOSClient> {
    const client = new RouterOSClient({
      host: this.config.host,
      user: this.config.username,
      password: this.config.password,
      port: this.config.port || 8728,
      timeout: 10000
    });

    try {
      console.log(`Connecting to MikroTik ${this.config.host}...`);
      await client.connect();
      console.log(`Connected to MikroTik ${this.config.host}`);
      return client;
    } catch (error) {
      console.error(`Failed to connect to MikroTik ${this.config.host}:`, error);
      throw new Error(`MikroTik connection failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; version?: string; error?: string }> {
    let client: RouterOSClient | null = null;
    try {
      client = await this.connect();
      const identity = await client.write('/system/identity/print');
      const version = await client.write('/system/resource/print');
      
      return {
        success: true,
        version: version[0]?.version || 'Unknown'
      };
    } catch (error) {
      console.error('MikroTik connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      if (client) {
        try {
          await client.close();
        } catch (e) {
          console.error('Error closing MikroTik connection:', e);
        }
      }
    }
  }

  // Hotspot Users Management
  async getHotspotUsers(): Promise<MikroTikUser[]> {
    let client: RouterOSClient | null = null;
    try {
      client = await this.connect();
      console.log('Fetching hotspot users from MikroTik...');
      const users = await client.write('/ip/hotspot/user/print');
      console.log(`Found ${users.length} hotspot users on MikroTik`);
      return users as MikroTikUser[];
    } catch (error) {
      console.error('Error fetching hotspot users:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async addHotspotUser(user: { name: string; password: string; profile?: string; comment?: string }): Promise<boolean> {
    let client: RouterOSClient | null = null;
    try {
      client = await this.connect();
      console.log('Adding hotspot user to MikroTik:', user.name);
      
      const command = ['/ip/hotspot/user/add'];
      const params: any = {
        name: user.name,
        password: user.password
      };

      if (user.profile) params.profile = user.profile;
      if (user.comment) params.comment = user.comment;

      await client.write(command, params);
      console.log(`Hotspot user ${user.name} added successfully`);
      return true;
    } catch (error) {
      console.error('Error adding hotspot user:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async deleteHotspotUser(userId: string): Promise<boolean> {
    let client: RouterOSClient | null = null;
    try {
      client = await this.connect();
      console.log('Deleting hotspot user from MikroTik:', userId);
      
      await client.write(['/ip/hotspot/user/remove'], { '.id': userId });
      console.log(`Hotspot user ${userId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting hotspot user:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // PPPoE Users Management
  async getPPPoEUsers(): Promise<MikroTikUser[]> {
    let client: RouterOSClient | null = null;
    try {
      client = await this.connect();
      console.log('Fetching PPPoE users from MikroTik...');
      const users = await client.write('/ppp/secret/print');
      console.log(`Found ${users.length} PPPoE users on MikroTik`);
      return users as MikroTikUser[];
    } catch (error) {
      console.error('Error fetching PPPoE users:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async addPPPoEUser(user: { name: string; password: string; profile?: string; service?: string; comment?: string }): Promise<boolean> {
    let client: RouterOSClient | null = null;
    try {
      client = await this.connect();
      console.log('Adding PPPoE user to MikroTik:', user.name);
      
      const command = ['/ppp/secret/add'];
      const params: any = {
        name: user.name,
        password: user.password
      };

      if (user.profile) params.profile = user.profile;
      if (user.service) params.service = user.service;
      if (user.comment) params.comment = user.comment;

      await client.write(command, params);
      console.log(`PPPoE user ${user.name} added successfully`);
      return true;
    } catch (error) {
      console.error('Error adding PPPoE user:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async deletePPPoEUser(userId: string): Promise<boolean> {
    let client: RouterOSClient | null = null;
    try {
      client = await this.connect();
      console.log('Deleting PPPoE user from MikroTik:', userId);
      
      await client.write(['/ppp/secret/remove'], { '.id': userId });
      console.log(`PPPoE user ${userId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting PPPoE user:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // Profiles Management
  async getHotspotProfiles(): Promise<MikroTikProfile[]> {
    let client: RouterOSClient | null = null;
    try {
      client = await this.connect();
      console.log('Fetching hotspot profiles from MikroTik...');
      const profiles = await client.write('/ip/hotspot/user/profile/print');
      console.log(`Found ${profiles.length} hotspot profiles on MikroTik`);
      return profiles as MikroTikProfile[];
    } catch (error) {
      console.error('Error fetching hotspot profiles:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async getPPPoEProfiles(): Promise<MikroTikProfile[]> {
    let client: RouterOSClient | null = null;
    try {
      client = await this.connect();
      console.log('Fetching PPPoE profiles from MikroTik...');
      const profiles = await client.write('/ppp/profile/print');
      console.log(`Found ${profiles.length} PPPoE profiles on MikroTik`);
      return profiles as MikroTikProfile[];
    } catch (error) {
      console.error('Error fetching PPPoE profiles:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // Active Sessions
  async getActiveHotspotSessions(): Promise<MikroTikActiveUser[]> {
    let client: RouterOSClient | null = null;
    try {
      client = await this.connect();
      console.log('Fetching active hotspot sessions from MikroTik...');
      const sessions = await client.write('/ip/hotspot/active/print');
      console.log(`Found ${sessions.length} active hotspot sessions on MikroTik`);
      return sessions as MikroTikActiveUser[];
    } catch (error) {
      console.error('Error fetching active hotspot sessions:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async getActivePPPoESessions(): Promise<MikroTikActiveUser[]> {
    let client: RouterOSClient | null = null;
    try {
      client = await this.connect();
      console.log('Fetching active PPPoE sessions from MikroTik...');
      const sessions = await client.write('/ppp/active/print');
      console.log(`Found ${sessions.length} active PPPoE sessions on MikroTik`);
      return sessions as MikroTikActiveUser[];
    } catch (error) {
      console.error('Error fetching active PPPoE sessions:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // System Information
  async getSystemInfo(): Promise<any> {
    let client: RouterOSClient | null = null;
    try {
      client = await this.connect();
      const [identity, resource] = await Promise.all([
        client.write('/system/identity/print'),
        client.write('/system/resource/print')
      ]);

      return {
        identity: identity[0],
        resource: resource[0]
      };
    } catch (error) {
      console.error('Error fetching system info:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }
}

export function createMikroTikService(config: MikroTikConfig): MikroTikService {
  return new MikroTikService(config);
}

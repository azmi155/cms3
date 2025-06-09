import { RouterOSAPI } from 'node-routeros';

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
  'local-address'?: string;
  'remote-address'?: string;
}

export interface MikroTikActiveUser {
  '.id': string;
  user?: string;
  name?: string;
  'caller-id'?: string;
  address?: string;
  'mac-address'?: string;
  'session-time'?: string;
  'uptime'?: string;
  'bytes-in'?: string;
  'bytes-out'?: string;
  radius?: string;
}

export class MikroTikService {
  private config: MikroTikConfig;
  private conn: RouterOSAPI | null = null;

  constructor(config: MikroTikConfig) {
    this.config = config;
  }

  private async connect(): Promise<RouterOSAPI> {
    if (this.conn) {
      return this.conn;
    }

    try {
      console.log(`🔌 Connecting to MikroTik ${this.config.host}:${this.config.port || 8728}...`);
      
      this.conn = new RouterOSAPI({
        host: this.config.host,
        user: this.config.username,
        password: this.config.password,
        port: this.config.port || 8728,
        timeout: 10
      });

      await this.conn.connect();
      
      console.log(`✅ Connected to MikroTik ${this.config.host}`);
      return this.conn;
    } catch (error) {
      console.error(`❌ Failed to connect to MikroTik ${this.config.host}:`, error);
      this.conn = null;
      throw new Error(`MikroTik connection failed: ${error.message}`);
    }
  }

  private async disconnect(): Promise<void> {
    if (this.conn) {
      try {
        await this.conn.close();
        this.conn = null;
        console.log('🔌 MikroTik connection closed');
      } catch (error) {
        console.error('Error closing MikroTik connection:', error);
      }
    }
  }

  async testConnection(): Promise<{ success: boolean; version?: string; error?: string }> {
    try {
      const conn = await this.connect();
      
      const systemResource = await conn.write('/system/resource/print');
      const version = systemResource[0]?.version || 'Unknown';
      
      console.log('🔍 MikroTik connection test successful, version:', version);
      await this.disconnect();
      
      return {
        success: true,
        version: `RouterOS ${version}`
      };
    } catch (error) {
      console.error('❌ MikroTik connection test failed:', error);
      await this.disconnect();
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Hotspot Users Management
  async getHotspotUsers(): Promise<MikroTikUser[]> {
    try {
      const conn = await this.connect();
      console.log('📋 Fetching hotspot users from MikroTik...');
      
      const users = await conn.write('/ip/hotspot/user/print');
      
      console.log(`✅ Fetched ${users.length} hotspot users from MikroTik`);
      await this.disconnect();
      return users as MikroTikUser[];
    } catch (error) {
      console.error('❌ Error fetching hotspot users:', error);
      await this.disconnect();
      throw new Error(`Failed to fetch hotspot users: ${error.message}`);
    }
  }

  async addHotspotUser(user: { name: string; password: string; profile?: string; comment?: string }): Promise<boolean> {
    try {
      const conn = await this.connect();
      console.log('➕ Adding hotspot user to MikroTik:', user.name);
      
      const params = [
        '/ip/hotspot/user/add',
        `=name=${user.name}`,
        `=password=${user.password}`,
        `=profile=${user.profile || 'default'}`
      ];

      if (user.comment) {
        params.push(`=comment=${user.comment}`);
      }

      await conn.write(params);
      
      console.log(`✅ Hotspot user ${user.name} added successfully`);
      await this.disconnect();
      return true;
    } catch (error) {
      console.error('❌ Error adding hotspot user:', error);
      await this.disconnect();
      throw new Error(`Failed to add hotspot user: ${error.message}`);
    }
  }

  async deleteHotspotUser(userId: string): Promise<boolean> {
    try {
      const conn = await this.connect();
      console.log('🗑️ Deleting hotspot user from MikroTik:', userId);
      
      await conn.write(['/ip/hotspot/user/remove', `=.id=${userId}`]);
      
      console.log(`✅ Hotspot user ${userId} deleted successfully`);
      await this.disconnect();
      return true;
    } catch (error) {
      console.error('❌ Error deleting hotspot user:', error);
      await this.disconnect();
      throw new Error(`Failed to delete hotspot user: ${error.message}`);
    }
  }

  // PPPoE Users Management  
  async getPPPoEUsers(): Promise<MikroTikUser[]> {
    try {
      const conn = await this.connect();
      console.log('📋 Fetching PPPoE users from MikroTik...');
      
      const users = await conn.write('/ppp/secret/print');
      
      console.log(`✅ Fetched ${users.length} PPPoE users from MikroTik`);
      await this.disconnect();
      return users as MikroTikUser[];
    } catch (error) {
      console.error('❌ Error fetching PPPoE users:', error);
      await this.disconnect();
      throw new Error(`Failed to fetch PPPoE users: ${error.message}`);
    }
  }

  async addPPPoEUser(user: { name: string; password: string; profile?: string; service?: string; comment?: string; localAddress?: string; remoteAddress?: string }): Promise<boolean> {
    try {
      const conn = await this.connect();
      console.log('➕ Adding PPPoE user to MikroTik:', user.name);
      
      const params = [
        '/ppp/secret/add',
        `=name=${user.name}`,
        `=password=${user.password}`,
        `=profile=${user.profile || 'default'}`,
        `=service=${user.service || 'pppoe'}`
      ];

      if (user.comment) {
        params.push(`=comment=${user.comment}`);
      }

      if (user.localAddress) {
        params.push(`=local-address=${user.localAddress}`);
      }

      if (user.remoteAddress) {
        params.push(`=remote-address=${user.remoteAddress}`);
      }

      await conn.write(params);
      
      console.log(`✅ PPPoE user ${user.name} added successfully`);
      await this.disconnect();
      return true;
    } catch (error) {
      console.error('❌ Error adding PPPoE user:', error);
      await this.disconnect();
      throw new Error(`Failed to add PPPoE user: ${error.message}`);
    }
  }

  async deletePPPoEUser(userId: string): Promise<boolean> {
    try {
      const conn = await this.connect();
      console.log('🗑️ Deleting PPPoE user from MikroTik:', userId);
      
      await conn.write(['/ppp/secret/remove', `=.id=${userId}`]);
      
      console.log(`✅ PPPoE user ${userId} deleted successfully`);
      await this.disconnect();
      return true;
    } catch (error) {
      console.error('❌ Error deleting PPPoE user:', error);
      await this.disconnect();
      throw new Error(`Failed to delete PPPoE user: ${error.message}`);
    }
  }

  // Profiles Management
  async getHotspotProfiles(): Promise<MikroTikProfile[]> {
    try {
      const conn = await this.connect();
      console.log('📋 Fetching hotspot profiles from MikroTik...');
      
      const profiles = await conn.write('/ip/hotspot/user/profile/print');
      
      console.log(`✅ Fetched ${profiles.length} hotspot profiles from MikroTik`);
      await this.disconnect();
      return profiles as MikroTikProfile[];
    } catch (error) {
      console.error('❌ Error fetching hotspot profiles:', error);
      await this.disconnect();
      throw new Error(`Failed to fetch hotspot profiles: ${error.message}`);
    }
  }

  async addHotspotProfile(profile: { name: string; rateLimit?: string; sessionTimeout?: string; sharedUsers?: number }): Promise<boolean> {
    try {
      const conn = await this.connect();
      console.log('➕ Adding hotspot profile to MikroTik:', profile.name);
      
      const params = ['/ip/hotspot/user/profile/add', `=name=${profile.name}`];

      if (profile.rateLimit) {
        params.push(`=rate-limit=${profile.rateLimit}`);
      }

      if (profile.sessionTimeout) {
        params.push(`=session-timeout=${profile.sessionTimeout}`);
      }

      if (profile.sharedUsers) {
        params.push(`=shared-users=${profile.sharedUsers}`);
      }

      await conn.write(params);
      
      console.log(`✅ Hotspot profile ${profile.name} added successfully`);
      await this.disconnect();
      return true;
    } catch (error) {
      console.error('❌ Error adding hotspot profile:', error);
      await this.disconnect();
      throw new Error(`Failed to add hotspot profile: ${error.message}`);
    }
  }

  async deleteHotspotProfile(profileId: string): Promise<boolean> {
    try {
      const conn = await this.connect();
      console.log('🗑️ Deleting hotspot profile from MikroTik:', profileId);
      
      await conn.write(['/ip/hotspot/user/profile/remove', `=.id=${profileId}`]);
      
      console.log(`✅ Hotspot profile ${profileId} deleted successfully`);
      await this.disconnect();
      return true;
    } catch (error) {
      console.error('❌ Error deleting hotspot profile:', error);
      await this.disconnect();
      throw new Error(`Failed to delete hotspot profile: ${error.message}`);
    }
  }

  async getPPPoEProfiles(): Promise<MikroTikProfile[]> {
    try {
      const conn = await this.connect();
      console.log('📋 Fetching PPPoE profiles from MikroTik...');
      
      const profiles = await conn.write('/ppp/profile/print');
      
      console.log(`✅ Fetched ${profiles.length} PPPoE profiles from MikroTik`);
      await this.disconnect();
      return profiles as MikroTikProfile[];
    } catch (error) {
      console.error('❌ Error fetching PPPoE profiles:', error);
      await this.disconnect();
      throw new Error(`Failed to fetch PPPoE profiles: ${error.message}`);
    }
  }

  async addPPPoEProfile(profile: { name: string; localAddress?: string; remoteAddress?: string; rateLimit?: string }): Promise<boolean> {
    try {
      const conn = await this.connect();
      console.log('➕ Adding PPPoE profile to MikroTik:', profile.name);
      
      const params = ['/ppp/profile/add', `=name=${profile.name}`];

      if (profile.localAddress) {
        params.push(`=local-address=${profile.localAddress}`);
      }

      if (profile.remoteAddress) {
        params.push(`=remote-address=${profile.remoteAddress}`);
      }

      if (profile.rateLimit) {
        params.push(`=rate-limit=${profile.rateLimit}`);
      }

      await conn.write(params);
      
      console.log(`✅ PPPoE profile ${profile.name} added successfully`);
      await this.disconnect();
      return true;
    } catch (error) {
      console.error('❌ Error adding PPPoE profile:', error);
      await this.disconnect();
      throw new Error(`Failed to add PPPoE profile: ${error.message}`);
    }
  }

  async deletePPPoEProfile(profileId: string): Promise<boolean> {
    try {
      const conn = await this.connect();
      console.log('🗑️ Deleting PPPoE profile from MikroTik:', profileId);
      
      await conn.write(['/ppp/profile/remove', `=.id=${profileId}`]);
      
      console.log(`✅ PPPoE profile ${profileId} deleted successfully`);
      await this.disconnect();
      return true;
    } catch (error) {
      console.error('❌ Error deleting PPPoE profile:', error);
      await this.disconnect();
      throw new Error(`Failed to delete PPPoE profile: ${error.message}`);
    }
  }

  // Active Sessions
  async getActiveHotspotSessions(): Promise<MikroTikActiveUser[]> {
    try {
      const conn = await this.connect();
      console.log('📋 Fetching active hotspot sessions from MikroTik...');
      
      const sessions = await conn.write('/ip/hotspot/active/print');
      
      console.log(`✅ Fetched ${sessions.length} active hotspot sessions from MikroTik`);
      await this.disconnect();
      return sessions as MikroTikActiveUser[];
    } catch (error) {
      console.error('❌ Error fetching active hotspot sessions:', error);
      await this.disconnect();
      throw new Error(`Failed to fetch active hotspot sessions: ${error.message}`);
    }
  }

  async getActivePPPoESessions(): Promise<MikroTikActiveUser[]> {
    try {
      const conn = await this.connect();
      console.log('📋 Fetching active PPPoE sessions from MikroTik...');
      
      const sessions = await conn.write('/ppp/active/print');
      
      console.log(`✅ Fetched ${sessions.length} active PPPoE sessions from MikroTik`);
      await this.disconnect();
      return sessions as MikroTikActiveUser[];
    } catch (error) {
      console.error('❌ Error fetching active PPPoE sessions:', error);
      await this.disconnect();
      throw new Error(`Failed to fetch active PPPoE sessions: ${error.message}`);
    }
  }

  // System Information
  async getSystemInfo(): Promise<any> {
    try {
      const conn = await this.connect();
      
      const [identity, resource] = await Promise.all([
        conn.write('/system/identity/print'),
        conn.write('/system/resource/print')
      ]);
      
      await this.disconnect();
      
      return {
        identity: identity[0] || {},
        resource: resource[0] || {}
      };
    } catch (error) {
      console.error('❌ Error fetching system info:', error);
      await this.disconnect();
      throw new Error(`Failed to fetch system info: ${error.message}`);
    }
  }
}

export function createMikroTikService(config: MikroTikConfig): MikroTikService {
  return new MikroTikService(config);
}

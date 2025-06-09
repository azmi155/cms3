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

  constructor(config: MikroTikConfig) {
    this.config = config;
  }

  private async connect(): Promise<RouterOSAPI> {
    const conn = new RouterOSAPI({
      host: this.config.host,
      user: this.config.username,
      password: this.config.password,
      port: this.config.port || 8728,
      timeout: 15000
    });

    try {
      console.log(`🔌 Connecting to MikroTik ${this.config.host}:${this.config.port || 8728}...`);
      await conn.connect();
      console.log(`✅ Connected to MikroTik ${this.config.host}`);
      return conn;
    } catch (error) {
      console.error(`❌ Failed to connect to MikroTik ${this.config.host}:`, error);
      throw new Error(`MikroTik connection failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; version?: string; error?: string }> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      
      // Test basic connectivity with system identity
      const identity = await conn.write('/system/identity/print');
      const resource = await conn.write('/system/resource/print');
      
      console.log('🔍 MikroTik connection test successful');
      return {
        success: true,
        version: resource[0]?.version || 'Unknown'
      };
    } catch (error) {
      console.error('❌ MikroTik connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      if (conn) {
        try {
          conn.close();
        } catch (e) {
          console.error('Error closing MikroTik connection:', e);
        }
      }
    }
  }

  // Hotspot Users Management
  async getHotspotUsers(): Promise<MikroTikUser[]> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('📋 Fetching hotspot users from MikroTik...');
      const users = await conn.write('/ip/hotspot/user/print');
      console.log(`✅ Found ${users.length} hotspot users on MikroTik`);
      return users as MikroTikUser[];
    } catch (error) {
      console.error('❌ Error fetching hotspot users:', error);
      throw new Error(`Failed to fetch hotspot users: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  async addHotspotUser(user: { name: string; password: string; profile?: string; comment?: string }): Promise<boolean> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('➕ Adding hotspot user to MikroTik:', user.name);
      
      const params: any = {
        name: user.name,
        password: user.password
      };

      if (user.profile) params.profile = user.profile;
      if (user.comment) params.comment = user.comment;

      await conn.write('/ip/hotspot/user/add', params);
      console.log(`✅ Hotspot user ${user.name} added successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error adding hotspot user:', error);
      throw new Error(`Failed to add hotspot user: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  async deleteHotspotUser(userId: string): Promise<boolean> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('🗑️ Deleting hotspot user from MikroTik:', userId);
      
      await conn.write('/ip/hotspot/user/remove', { '.id': userId });
      console.log(`✅ Hotspot user ${userId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting hotspot user:', error);
      throw new Error(`Failed to delete hotspot user: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  // PPPoE Users Management
  async getPPPoEUsers(): Promise<MikroTikUser[]> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('📋 Fetching PPPoE users from MikroTik...');
      const users = await conn.write('/ppp/secret/print');
      console.log(`✅ Found ${users.length} PPPoE users on MikroTik`);
      return users as MikroTikUser[];
    } catch (error) {
      console.error('❌ Error fetching PPPoE users:', error);
      throw new Error(`Failed to fetch PPPoE users: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  async addPPPoEUser(user: { name: string; password: string; profile?: string; service?: string; comment?: string }): Promise<boolean> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('➕ Adding PPPoE user to MikroTik:', user.name);
      
      const params: any = {
        name: user.name,
        password: user.password
      };

      if (user.profile) params.profile = user.profile;
      if (user.service) params.service = user.service;
      if (user.comment) params.comment = user.comment;

      await conn.write('/ppp/secret/add', params);
      console.log(`✅ PPPoE user ${user.name} added successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error adding PPPoE user:', error);
      throw new Error(`Failed to add PPPoE user: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  async deletePPPoEUser(userId: string): Promise<boolean> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('🗑️ Deleting PPPoE user from MikroTik:', userId);
      
      await conn.write('/ppp/secret/remove', { '.id': userId });
      console.log(`✅ PPPoE user ${userId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting PPPoE user:', error);
      throw new Error(`Failed to delete PPPoE user: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  // Profiles Management
  async getHotspotProfiles(): Promise<MikroTikProfile[]> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('📋 Fetching hotspot profiles from MikroTik...');
      const profiles = await conn.write('/ip/hotspot/user/profile/print');
      console.log(`✅ Found ${profiles.length} hotspot profiles on MikroTik`);
      return profiles as MikroTikProfile[];
    } catch (error) {
      console.error('❌ Error fetching hotspot profiles:', error);
      throw new Error(`Failed to fetch hotspot profiles: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  async addHotspotProfile(profile: { name: string; rateLimit?: string; sessionTimeout?: string; sharedUsers?: number }): Promise<boolean> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('➕ Adding hotspot profile to MikroTik:', profile.name);
      
      const params: any = {
        name: profile.name
      };

      if (profile.rateLimit) params['rate-limit'] = profile.rateLimit;
      if (profile.sessionTimeout) params['session-timeout'] = profile.sessionTimeout;
      if (profile.sharedUsers) params['shared-users'] = profile.sharedUsers.toString();

      await conn.write('/ip/hotspot/user/profile/add', params);
      console.log(`✅ Hotspot profile ${profile.name} added successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error adding hotspot profile:', error);
      throw new Error(`Failed to add hotspot profile: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  async deleteHotspotProfile(profileId: string): Promise<boolean> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('🗑️ Deleting hotspot profile from MikroTik:', profileId);
      
      await conn.write('/ip/hotspot/user/profile/remove', { '.id': profileId });
      console.log(`✅ Hotspot profile ${profileId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting hotspot profile:', error);
      throw new Error(`Failed to delete hotspot profile: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  async getPPPoEProfiles(): Promise<MikroTikProfile[]> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('📋 Fetching PPPoE profiles from MikroTik...');
      const profiles = await conn.write('/ppp/profile/print');
      console.log(`✅ Found ${profiles.length} PPPoE profiles on MikroTik`);
      return profiles as MikroTikProfile[];
    } catch (error) {
      console.error('❌ Error fetching PPPoE profiles:', error);
      throw new Error(`Failed to fetch PPPoE profiles: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  async addPPPoEProfile(profile: { name: string; localAddress?: string; remoteAddress?: string; rateLimit?: string }): Promise<boolean> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('➕ Adding PPPoE profile to MikroTik:', profile.name);
      
      const params: any = {
        name: profile.name
      };

      if (profile.localAddress) params['local-address'] = profile.localAddress;
      if (profile.remoteAddress) params['remote-address'] = profile.remoteAddress;
      if (profile.rateLimit) params['rate-limit'] = profile.rateLimit;

      await conn.write('/ppp/profile/add', params);
      console.log(`✅ PPPoE profile ${profile.name} added successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error adding PPPoE profile:', error);
      throw new Error(`Failed to add PPPoE profile: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  async deletePPPoEProfile(profileId: string): Promise<boolean> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('🗑️ Deleting PPPoE profile from MikroTik:', profileId);
      
      await conn.write('/ppp/profile/remove', { '.id': profileId });
      console.log(`✅ PPPoE profile ${profileId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting PPPoE profile:', error);
      throw new Error(`Failed to delete PPPoE profile: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  // Active Sessions
  async getActiveHotspotSessions(): Promise<MikroTikActiveUser[]> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('📋 Fetching active hotspot sessions from MikroTik...');
      const sessions = await conn.write('/ip/hotspot/active/print');
      console.log(`✅ Found ${sessions.length} active hotspot sessions on MikroTik`);
      return sessions as MikroTikActiveUser[];
    } catch (error) {
      console.error('❌ Error fetching active hotspot sessions:', error);
      throw new Error(`Failed to fetch active hotspot sessions: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  async getActivePPPoESessions(): Promise<MikroTikActiveUser[]> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      console.log('📋 Fetching active PPPoE sessions from MikroTik...');
      const sessions = await conn.write('/ppp/active/print');
      console.log(`✅ Found ${sessions.length} active PPPoE sessions on MikroTik`);
      return sessions as MikroTikActiveUser[];
    } catch (error) {
      console.error('❌ Error fetching active PPPoE sessions:', error);
      throw new Error(`Failed to fetch active PPPoE sessions: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }

  // System Information
  async getSystemInfo(): Promise<any> {
    let conn: RouterOSAPI | null = null;
    try {
      conn = await this.connect();
      const [identity, resource] = await Promise.all([
        conn.write('/system/identity/print'),
        conn.write('/system/resource/print')
      ]);

      return {
        identity: identity[0],
        resource: resource[0]
      };
    } catch (error) {
      console.error('❌ Error fetching system info:', error);
      throw new Error(`Failed to fetch system info: ${error.message}`);
    } finally {
      if (conn) {
        conn.close();
      }
    }
  }
}

export function createMikroTikService(config: MikroTikConfig): MikroTikService {
  return new MikroTikService(config);
}

export interface Database {
  devices: DeviceTable;
  hotspot_users: HotspotUserTable;
  pppoe_users: PPPoEUserTable;
  hotspot_profiles: HotspotProfileTable;
  pppoe_profiles: PPPoEProfileTable;
  user_sessions: UserSessionTable;
  admin_users: AdminUserTable;
  user_auth_sessions: AuthSessionTable;
}

export interface DeviceTable {
  id: number;
  name: string;
  type: string;
  ip_address: string;
  username: string;
  password: string;
  status: 'online' | 'offline';
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface HotspotUserTable {
  id: number;
  device_id: number;
  username: string;
  password: string;
  profile: string;
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface PPPoEUserTable {
  id: number;
  device_id: number;
  username: string;
  password: string;
  profile: string;
  service: string;
  ip_address: string | null;
  status: 'active' | 'disabled';
  real_name: string | null;
  address: string | null;
  whatsapp_contact: string | null;
  remote_device: string | null;
  service_cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface HotspotProfileTable {
  id: number;
  device_id: number;
  name: string;
  rate_limit: string | null;
  session_timeout: string | null;
  shared_users: number;
  status: 'active' | 'disabled';
  created_at: string;
}

export interface PPPoEProfileTable {
  id: number;
  device_id: number;
  name: string;
  local_address: string | null;
  remote_address: string | null;
  rate_limit: string | null;
  status: 'active' | 'disabled';
  created_at: string;
}

export interface UserSessionTable {
  id: number;
  device_id: number;
  username: string;
  user_type: 'hotspot' | 'pppoe';
  ip_address: string | null;
  data_usage_bytes: number;
  session_start: string;
  session_end: string | null;
  status: 'active' | 'ended';
}

export interface AdminUserTable {
  id: number;
  username: string;
  password: string;
  email: string | null;
  role: string;
  status: 'active' | 'disabled';
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthSessionTable {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

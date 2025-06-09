import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { NetworkTopology } from './NetworkTopology';
import { Wifi, Users, Activity, CheckCircle, AlertCircle, RefreshCw, Server, Globe, Database, Clock, UserPlus, Cpu, MemoryStick, HardDrive, Monitor } from 'lucide-react';

interface NetworkOverviewProps {
  onNavigateToTab?: (tab: string) => void;
}

export const NetworkOverview = ({ onNavigateToTab }: NetworkOverviewProps) => {
  const [stats, setStats] = React.useState({
    devices: { total: 0, online: 0, offline: 0 },
    users: { total: 0, hotspot: 0, pppoe: 0 },
    sessions: { active: 0 }
  });
  const [systemStats, setSystemStats] = React.useState({
    cpu: { usage: 0, cores: 0 },
    memory: { percentage: 0, total: 0, used: 0 },
    disk: { percentage: 0 },
    uptime: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState(new Date());

  const fetchStats = async () => {
    try {
      console.log('Fetching dashboard statistics...');
      const response = await fetch('/api/reports/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdate(new Date());
        console.log('Statistics loaded:', data);
      } else {
        console.error('Failed to fetch statistics:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      console.log('Fetching system statistics...');
      const response = await fetch('/api/system/stats');
      if (response.ok) {
        const data = await response.json();
        setSystemStats(data);
        console.log('System statistics loaded');
      } else {
        console.error('Failed to fetch system statistics:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching system statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchSystemStats()]);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchAllData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
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
  };

  const getDeviceStatusInfo = () => {
    if (stats.devices.total === 0) {
      return {
        title: 'No Devices',
        subtitle: 'Configure your first device',
        icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
        badge: <Badge variant="secondary">Not Configured</Badge>,
        description: 'Use "Add Device" to register new devices',
        progress: 0,
        color: 'text-muted-foreground'
      };
    }

    const onlinePercentage = (stats.devices.online / stats.devices.total) * 100;

    if (stats.devices.online > 0) {
      return {
        title: `${stats.devices.online} Device${stats.devices.online > 1 ? 's' : ''} Online`,
        subtitle: `${onlinePercentage.toFixed(0)}% Network Availability`,
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        badge: <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>,
        description: `${stats.devices.offline} offline, ${stats.devices.total} total`,
        progress: onlinePercentage,
        color: 'text-green-600'
      };
    }

    return {
      title: 'All Devices Offline',
      subtitle: 'Network Connectivity Issues',
      icon: <AlertCircle className="h-4 w-4 text-destructive" />,
      badge: <Badge variant="destructive">Offline</Badge>,
      description: `${stats.devices.total} device${stats.devices.total > 1 ? 's' : ''} registered`,
      progress: 0,
      color: 'text-destructive'
    };
  };

  const getUserDistribution = () => {
    if (stats.users.total === 0) return { hotspot: 0, pppoe: 0 };
    return {
      hotspot: (stats.users.hotspot / stats.users.total) * 100,
      pppoe: (stats.users.pppoe / stats.users.total) * 100
    };
  };

  const handleQuickAction = (action: string) => {
    console.log('Quick action clicked:', action);
    
    switch (action) {
      case 'add-device':
        if (onNavigateToTab) {
          onNavigateToTab('devices');
        }
        break;
      case 'manage-users':
        if (onNavigateToTab) {
          onNavigateToTab('users');
        }
        break;
      case 'view-sessions':
        if (onNavigateToTab) {
          onNavigateToTab('users');
        }
        break;
      case 'sync-devices':
        handleSyncAllDevices();
        break;
      case 'add-hotspot-user':
        if (onNavigateToTab) {
          onNavigateToTab('users');
        }
        break;
      case 'add-pppoe-user':
        if (onNavigateToTab) {
          onNavigateToTab('users');
        }
        break;
      case 'sync-all-users':
        handleSyncAllUsers();
        break;
      case 'view-monitor':
        if (onNavigateToTab) {
          onNavigateToTab('monitor');
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleSyncAllDevices = async () => {
    try {
      console.log('Syncing all devices...');
      const devicesResponse = await fetch('/api/devices');
      if (devicesResponse.ok) {
        const devices = await devicesResponse.json();
        const onlineDevices = devices.filter(d => d.type.toLowerCase() === 'mikrotik');
        
        if (onlineDevices.length === 0) {
          alert('No MikroTik devices found to sync');
          return;
        }

        const syncPromises = onlineDevices.map(device => 
          fetch(`/api/devices/${device.id}/sync`, { method: 'POST' })
        );

        await Promise.all(syncPromises);
        await fetchStats();
        alert(`Synced ${onlineDevices.length} device(s) successfully`);
      }
    } catch (error) {
      console.error('Error syncing devices:', error);
      alert('Error syncing devices');
    }
  };

  const handleSyncAllUsers = async () => {
    try {
      console.log('Syncing all users...');
      const devicesResponse = await fetch('/api/devices');
      if (devicesResponse.ok) {
        const devices = await devicesResponse.json();
        const onlineDevices = devices.filter(d => 
          d.type.toLowerCase() === 'mikrotik' && d.status === 'online'
        );
        
        if (onlineDevices.length === 0) {
          alert('No online MikroTik devices found to sync users');
          return;
        }

        const syncPromises = onlineDevices.map(device => 
          fetch(`/api/users/sync/${device.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userType: 'all' })
          })
        );

        await Promise.all(syncPromises);
        await fetchStats();
        alert(`Synced users from ${onlineDevices.length} device(s) successfully`);
      }
    } catch (error) {
      console.error('Error syncing users:', error);
      alert('Error syncing users');
    }
  };

  const deviceStatus = getDeviceStatusInfo();
  const userDistribution = getUserDistribution();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Network Overview</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Device Status Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">{deviceStatus.title}</div>
                <p className={`text-sm ${deviceStatus.color}`}>{deviceStatus.subtitle}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Network Health</span>
                  <span className="text-xs font-medium">{deviceStatus.progress.toFixed(0)}%</span>
                </div>
                <Progress value={deviceStatus.progress} className="h-2" />
              </div>

              <div className="flex items-center space-x-2">
                {deviceStatus.icon}
                {deviceStatus.badge}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {deviceStatus.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Statistics Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Management</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">{stats.users.total}</div>
                <p className="text-sm text-muted-foreground">Total Users Configured</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Hotspot Users</span>
                  <span className="text-xs font-medium">{stats.users.hotspot}</span>
                </div>
                <Progress value={userDistribution.hotspot} className="h-1" />
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">PPPoE Users</span>
                  <span className="text-xs font-medium">{stats.users.pppoe}</span>
                </div>
                <Progress value={userDistribution.pppoe} className="h-1" />
              </div>

              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Wifi className="h-3 w-3 mr-1" />
                  {stats.users.hotspot} Hotspot
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  {stats.users.pppoe} PPPoE
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">{stats.sessions.active}</div>
                <p className="text-sm text-muted-foreground">Users Currently Connected</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Session Utilization</span>
                  <span className="text-xs font-medium">
                    {stats.users.total > 0 ? ((stats.sessions.active / stats.users.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <Progress 
                  value={stats.users.total > 0 ? (stats.sessions.active / stats.users.total) * 100 : 0} 
                  className="h-2" 
                />
              </div>

              {stats.sessions.active > 0 ? (
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  <Activity className="h-3 w-3 mr-1" />
                  Active Network
                </Badge>
              ) : (
                <Badge variant="secondary">
                  No Active Sessions
                </Badge>
              )}

              <p className="text-xs text-muted-foreground">
                Real-time connection monitoring
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">Running</div>
                <p className="text-sm text-green-600">Server Online</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">CPU Usage</span>
                  <Badge variant="secondary" className={systemStats.cpu.usage > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {systemStats.cpu.usage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Memory</span>
                  <Badge variant="secondary" className={systemStats.memory.percentage > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {systemStats.memory.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Disk Usage</span>
                  <Badge variant="secondary" className={systemStats.disk.percentage > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {systemStats.disk.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Uptime: {formatUptime(systemStats.uptime)}
                </Badge>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleQuickAction('view-monitor')}
              >
                <Monitor className="h-3 w-3 mr-1" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System Performance Summary</CardTitle>
            <CardDescription>Server hardware utilization and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Cpu className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{systemStats.cpu.usage.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">CPU Usage</div>
                <div className="text-xs text-muted-foreground">{systemStats.cpu.cores} cores</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <MemoryStick className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{systemStats.memory.percentage.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Memory</div>
                <div className="text-xs text-muted-foreground">{formatBytes(systemStats.memory.used)} used</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <HardDrive className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{systemStats.disk.percentage.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Disk Usage</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{formatUptime(systemStats.uptime)}</div>
                <div className="text-sm text-muted-foreground">System Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common network management tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('add-device')}
            >
              <Server className="h-4 w-4 mr-2" />
              Add New Device
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('manage-users')}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('view-sessions')}
            >
              <Activity className="h-4 w-4 mr-2" />
              View Sessions
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('view-monitor')}
            >
              <Monitor className="h-4 w-4 mr-2" />
              System Monitor
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleQuickAction('sync-devices')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All Devices
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Management Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>User Management Quick Actions</CardTitle>
          <CardDescription>Quickly manage user accounts across all devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => handleQuickAction('add-hotspot-user')}
            >
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="font-medium">Add Hotspot User</span>
                </div>
                <span className="text-xs text-muted-foreground">Create new hotspot account</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => handleQuickAction('add-pppoe-user')}
            >
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="font-medium">Add PPPoE User</span>
                </div>
                <span className="text-xs text-muted-foreground">Create new PPPoE account</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => handleQuickAction('sync-all-users')}
            >
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span className="font-medium">Sync All Users</span>
                </div>
                <span className="text-xs text-muted-foreground">Sync from MikroTik devices</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Monitoring</CardTitle>
          <CardDescription>Monitor network traffic in real-time and analyze specific ports</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.sessions.active > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-lg font-semibold">Real-time Data</div>
                  <div className="text-sm text-muted-foreground">Live traffic monitoring available</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Globe className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-lg font-semibold">Port Analysis</div>
                  <div className="text-sm text-muted-foreground">Detailed port-specific data</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Database className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-lg font-semibold">Data Logging</div>
                  <div className="text-sm text-muted-foreground">Historical traffic records</div>
                </div>
              </div>
              <Button className="w-full">
                <Activity className="h-4 w-4 mr-2" />
                Open Traffic Monitor
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No active sessions for traffic monitoring</p>
              <p className="text-sm text-muted-foreground">
                Connect devices and establish user sessions to view traffic data
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Topology */}
      <Card>
        <CardHeader>
          <CardTitle>Network Topology</CardTitle>
          <CardDescription>Visual representation of your network infrastructure and device connections</CardDescription>
        </CardHeader>
        <CardContent>
          <NetworkTopology devices={stats.devices} />
        </CardContent>
      </Card>
    </div>
  );
};

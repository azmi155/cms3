import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { NetworkTopology } from './NetworkTopology';
import { Wifi, Users, Activity, CheckCircle, AlertCircle, RefreshCw, Server, Globe, Database, Clock } from 'lucide-react';

export const NetworkOverview = () => {
  const [stats, setStats] = React.useState({
    devices: { total: 0, online: 0, offline: 0 },
    users: { total: 0, hotspot: 0, pppoe: 0 },
    sessions: { active: 0 }
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
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

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
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
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
                <div className="text-2xl font-bold">Operational</div>
                <p className="text-sm text-green-600">All Systems Running</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Database</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">API Services</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">MikroTik Integration</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Ready</Badge>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  System Healthy
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Dashboard running smoothly
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Network Performance Summary</CardTitle>
            <CardDescription>Key metrics and performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.devices.total}</div>
                <div className="text-sm text-muted-foreground">Total Devices</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.devices.online}</div>
                <div className="text-sm text-muted-foreground">Online Devices</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.users.total}</div>
                <div className="text-sm text-muted-foreground">Configured Users</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.sessions.active}</div>
                <div className="text-sm text-muted-foreground">Active Sessions</div>
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
            <Button className="w-full justify-start" variant="outline">
              <Server className="h-4 w-4 mr-2" />
              Add New Device
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              View Sessions
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All Devices
            </Button>
          </CardContent>
        </Card>
      </div>

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

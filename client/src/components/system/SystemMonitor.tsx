import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Network, 
  RefreshCw, 
  Server, 
  Monitor,
  Clock,
  Zap,
  Activity
} from 'lucide-react';

interface SystemStats {
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
    interfaces: Array<{
      name: string;
      address: string;
      family: string;
      internal: boolean;
    }>;
  };
  uptime: number;
  platform: string;
  arch: string;
  nodeVersion: string;
  processUptime: number;
  timestamp: string;
}

interface SystemInfo {
  platform: {
    os: string;
    arch: string;
    node: string;
  };
  cpu: {
    model: string;
    cores: number;
    speed: string;
    usage: string;
  };
  memory: {
    total: string;
    used: string;
    free: string;
    percentage: string;
  };
  disk: {
    total: string;
    used: string;
    free: string;
    percentage: string;
  };
  uptime: {
    system: string;
    process: string;
  };
  network: {
    interfaces: Array<{
      name: string;
      address: string;
      family: string;
      internal: boolean;
    }>;
  };
}

export const SystemMonitor = () => {
  const [stats, setStats] = React.useState<SystemStats | null>(null);
  const [info, setInfo] = React.useState<SystemInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  const fetchSystemStats = async () => {
    try {
      console.log('Fetching system statistics...');
      const response = await fetch('/api/system/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        console.log('System stats loaded');
      } else {
        console.error('Failed to fetch system stats:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      console.log('Fetching system information...');
      const response = await fetch('/api/system/info');
      if (response.ok) {
        const data = await response.json();
        setInfo(data);
        console.log('System info loaded');
      } else {
        console.error('Failed to fetch system info:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching system info:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchSystemStats(), fetchSystemInfo()]);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchSystemStats, 5000); // Update stats every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

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

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsageBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'secondary';
    return 'default';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Monitor</h2>
            <p className="text-muted-foreground">Loading system information...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Monitor</h2>
          <p className="text-muted-foreground">Real-time server performance monitoring</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">CPU Usage</p>
                    <Badge variant={getUsageBadgeVariant(stats.cpu.usage)}>
                      {stats.cpu.usage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={stats.cpu.usage} className="mt-2 h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.cpu.cores} cores
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MemoryStick className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Memory</p>
                    <Badge variant={getUsageBadgeVariant(stats.memory.percentage)}>
                      {stats.memory.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={stats.memory.percentage} className="mt-2 h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5 text-purple-500" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Disk Usage</p>
                    <Badge variant={getUsageBadgeVariant(stats.disk.percentage)}>
                      {stats.disk.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={stats.disk.percentage} className="mt-2 h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatBytes(stats.disk.used)} / {formatBytes(stats.disk.total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">System Uptime</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatUptime(stats.uptime)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Process: {formatUptime(stats.processUptime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cpu">CPU</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>System Information</span>
                </CardTitle>
                <CardDescription>Server hardware and software details</CardDescription>
              </CardHeader>
              <CardContent>
                {info && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Operating System</p>
                        <p className="text-sm text-muted-foreground">{info.platform.os}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Architecture</p>
                        <p className="text-sm text-muted-foreground">{info.platform.arch}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Node.js Version</p>
                        <p className="text-sm text-muted-foreground">{info.platform.node}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">CPU Model</p>
                        <p className="text-sm text-muted-foreground">{info.cpu.model}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Performance Overview</span>
                </CardTitle>
                <CardDescription>Current system performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {stats && info && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">CPU Usage</span>
                      <span className={`text-sm font-bold ${getUsageColor(stats.cpu.usage)}`}>
                        {info.cpu.usage}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <span className={`text-sm font-bold ${getUsageColor(stats.memory.percentage)}`}>
                        {info.memory.percentage}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Disk Usage</span>
                      <span className={`text-sm font-bold ${getUsageColor(stats.disk.percentage)}`}>
                        {info.disk.percentage}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">System Uptime</span>
                      <span className="text-sm font-bold text-blue-600">
                        {info.uptime.system}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cpu" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cpu className="h-5 w-5" />
                <span>CPU Information</span>
              </CardTitle>
              <CardDescription>Detailed processor information and usage</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && info && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{stats.cpu.cores}</p>
                      <p className="text-sm text-muted-foreground">CPU Cores</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{info.cpu.speed}</p>
                      <p className="text-sm text-muted-foreground">Clock Speed</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className={`text-2xl font-bold ${getUsageColor(stats.cpu.usage)}`}>
                        {stats.cpu.usage.toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Current Usage</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">CPU Model</p>
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                      {info.cpu.model}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MemoryStick className="h-5 w-5" />
                <span>Memory Information</span>
              </CardTitle>
              <CardDescription>System memory usage and details</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && info && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{info.memory.total}</p>
                      <p className="text-sm text-muted-foreground">Total Memory</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{info.memory.used}</p>
                      <p className="text-sm text-muted-foreground">Used Memory</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{info.memory.free}</p>
                      <p className="text-sm text-muted-foreground">Free Memory</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <span className={`text-sm font-bold ${getUsageColor(stats.memory.percentage)}`}>
                        {info.memory.percentage}
                      </span>
                    </div>
                    <Progress value={stats.memory.percentage} className="h-3" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5" />
                <span>Network Interfaces</span>
              </CardTitle>
              <CardDescription>Network interface information</CardDescription>
            </CardHeader>
            <CardContent>
              {info && (
                <div className="space-y-4">
                  {info.network.interfaces.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No network interfaces found
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {info.network.interfaces.map((iface, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-medium">Interface</p>
                              <p className="text-sm text-muted-foreground">{iface.name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">IP Address</p>
                              <p className="text-sm text-muted-foreground font-mono">{iface.address}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Type</p>
                              <Badge variant="outline">
                                {iface.family} {iface.internal ? '(Internal)' : '(External)'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      {stats && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Last updated: {new Date(stats.timestamp).toLocaleString()}</span>
              <span>Auto-refresh: {autoRefresh ? 'Every 5 seconds' : 'Disabled'}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

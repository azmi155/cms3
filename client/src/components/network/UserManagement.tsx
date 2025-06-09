import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HotspotUsers } from './HotspotUsers';
import { PPPoEUsers } from './PPPoEUsers';
import { Users, Wifi, Globe, Activity, UserPlus, RefreshCw } from 'lucide-react';

export const UserManagement = () => {
  const [stats, setStats] = React.useState({
    devices: { total: 0, online: 0, offline: 0 },
    users: { total: 0, hotspot: 0, pppoe: 0 },
    sessions: { active: 0 }
  });
  const [loading, setLoading] = React.useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reports/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  const getUserDistribution = () => {
    if (stats.users.total === 0) return { hotspot: 0, pppoe: 0 };
    return {
      hotspot: (stats.users.hotspot / stats.users.total) * 100,
      pppoe: (stats.users.pppoe / stats.users.total) * 100
    };
  };

  const distribution = getUserDistribution();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage Hotspot and PPPoE users across all devices</p>
        </div>
        <Button variant="outline" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      {/* User Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold">{stats.users.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wifi className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Hotspot Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.users.hotspot}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">PPPoE Users</p>
                <p className="text-2xl font-bold text-purple-600">{stats.users.pppoe}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Active Sessions</p>
                <p className="text-2xl font-bold text-orange-600">{stats.sessions.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>User Distribution</CardTitle>
          <CardDescription>Overview of user types across your network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Hotspot Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{stats.users.hotspot}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {distribution.hotspot.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={distribution.hotspot} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">PPPoE Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{stats.users.pppoe}</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {distribution.pppoe.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={distribution.pppoe} className="h-2" />
            </div>

            {stats.users.total > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-sm">
                  <strong>Session Utilization:</strong> {stats.sessions.active} of {stats.users.total} users currently connected
                  ({((stats.sessions.active / stats.users.total) * 100).toFixed(1)}%)
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common user management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="font-medium">Add Hotspot User</span>
                </div>
                <span className="text-xs text-muted-foreground">Create new hotspot account</span>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="font-medium">Add PPPoE User</span>
                </div>
                <span className="text-xs text-muted-foreground">Create new PPPoE account</span>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
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

      {/* User Management Tabs */}
      <Tabs defaultValue="hotspot" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hotspot" className="flex items-center space-x-2">
            <Wifi className="h-4 w-4" />
            <span>Hotspot Users ({stats.users.hotspot})</span>
          </TabsTrigger>
          <TabsTrigger value="pppoe" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>PPPoE Users ({stats.users.pppoe})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotspot" className="mt-6">
          <HotspotUsers />
        </TabsContent>

        <TabsContent value="pppoe" className="mt-6">
          <PPPoEUsers />
        </TabsContent>
      </Tabs>
    </div>
  );
};

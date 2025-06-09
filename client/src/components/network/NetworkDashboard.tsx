import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NetworkOverview } from './NetworkOverview';
import { DeviceManagement } from './DeviceManagement';
import { UserManagement } from './UserManagement';
import { ProfileManagement } from './ProfileManagement';
import { MonthlyReports } from './MonthlyReports';
import { AdminUserManagement } from '../admin/AdminUserManagement';
import { SystemMonitor } from '../system/SystemMonitor';
import { useAuth } from '../auth/AuthProvider';
import { LogOut, Settings, User, Shield, Monitor } from 'lucide-react';

export const NetworkDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState('overview');

  const handleTabNavigation = (tab: string) => {
    console.log('Navigating to tab:', tab);
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Network Infrastructure Management Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to the Network Manager dashboard. This section provides a comprehensive view of the overall network infrastructure.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{user?.username}</span>
              {user?.role === 'admin' && (
                <Badge variant="default" className="bg-red-100 text-red-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="monitor">
            <Monitor className="h-4 w-4 mr-2" />
            Monitor
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="admin">
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-8">
          <NetworkOverview onNavigateToTab={handleTabNavigation} />
        </TabsContent>

        <TabsContent value="devices" className="mt-8">
          <DeviceManagement />
        </TabsContent>

        <TabsContent value="users" className="mt-8">
          <UserManagement />
        </TabsContent>

        <TabsContent value="profiles" className="mt-8">
          <ProfileManagement />
        </TabsContent>

        <TabsContent value="reports" className="mt-8">
          <MonthlyReports />
        </TabsContent>

        <TabsContent value="monitor" className="mt-8">
          <SystemMonitor />
        </TabsContent>

        {user?.role === 'admin' && (
          <TabsContent value="admin" className="mt-8">
            <AdminUserManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

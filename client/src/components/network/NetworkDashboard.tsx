import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NetworkOverview } from './NetworkOverview';
import { DeviceManagement } from './DeviceManagement';
import { UserManagement } from './UserManagement';
import { ProfileManagement } from './ProfileManagement';
import { MonthlyReports } from './MonthlyReports';

export const NetworkDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Network Infrastructure Management Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the Network Manager dashboard. This section provides a comprehensive view of the overall network infrastructure.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-8">
          <NetworkOverview />
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
      </Tabs>
    </div>
  );
};

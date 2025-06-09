import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddPPPoEUserDialog } from './AddPPPoEUserDialog';
import { Plus, Edit, Trash2, RefreshCw, Eye } from 'lucide-react';

export const PPPoEUsers = () => {
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [selectedDevice, setSelectedDevice] = React.useState('');
  const [devices, setDevices] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchUsers = async (deviceId: string) => {
    if (!deviceId) return;
    
    setLoading(true);
    try {
      console.log('Fetching PPPoE users for device:', deviceId);
      const response = await fetch(`/api/users/pppoe/${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        console.log('PPPoE users loaded:', data.length);
      }
    } catch (error) {
      console.error('Error fetching PPPoE users:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDevices();
  }, []);

  React.useEffect(() => {
    if (selectedDevice) {
      fetchUsers(selectedDevice);
    } else {
      setUsers([]);
    }
  }, [selectedDevice]);

  const handleSyncFromMikrotik = async () => {
    if (!selectedDevice) return;
    
    setSyncing(true);
    try {
      console.log('Syncing PPPoE users from MikroTik device:', selectedDevice);
      const response = await fetch(`/api/users/sync/${selectedDevice}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userType: 'pppoe' })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('PPPoE sync completed:', result);
        fetchUsers(selectedDevice); // Refresh the list
        alert(result.message);
      } else {
        const error = await response.json();
        console.error('Failed to sync PPPoE users:', error);
        alert(`Failed to sync PPPoE users from MikroTik: ${error.error}`);
      }
    } catch (error) {
      console.error('Error syncing PPPoE users:', error);
      alert('Error syncing PPPoE users');
    } finally {
      setSyncing(false);
    }
  };

  const handleViewActiveSessions = async () => {
    if (!selectedDevice) return;

    try {
      console.log('Fetching active PPPoE sessions for device:', selectedDevice);
      const response = await fetch(`/api/users/sessions/${selectedDevice}?type=pppoe`);
      
      if (response.ok) {
        const sessions = await response.json();
        console.log('Active PPPoE sessions:', sessions);
        
        if (sessions.length === 0) {
          alert('No active PPPoE sessions found');
        } else {
          const sessionInfo = sessions.map(s => 
            `User: ${s.user || s.name || 'Unknown'}\nIP: ${s.address || 'N/A'}\nTime: ${s['session-time'] || s.uptime || 'N/A'}`
          ).join('\n\n');
          alert(`Active PPPoE Sessions (${sessions.length}):\n\n${sessionInfo}`);
        }
      } else {
        const error = await response.json();
        console.error('Failed to fetch PPPoE sessions:', error);
        alert(`Failed to fetch active PPPoE sessions: ${error.error}`);
      }
    } catch (error) {
      console.error('Error fetching PPPoE sessions:', error);
      alert('Error fetching active PPPoE sessions');
    }
  };

  const handleEditUser = (userId: number) => {
    console.log('Edit PPPoE user:', userId);
    alert('Edit PPPoE user feature coming soon!');
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this PPPoE user? This will also delete the user from MikroTik if the device is online.')) {
      return;
    }

    try {
      console.log('Deleting PPPoE user:', userId);
      const response = await fetch(`/api/users/pppoe/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('PPPoE user deleted successfully');
        fetchUsers(selectedDevice); // Refresh the list
        alert('PPPoE user deleted successfully');
      } else {
        const error = await response.json();
        console.error('Failed to delete PPPoE user:', error);
        alert(`Failed to delete PPPoE user: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting PPPoE user:', error);
      alert('Error deleting PPPoE user');
    }
  };

  const handleUserAdded = () => {
    fetchUsers(selectedDevice); // Refresh the list
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const selectedDeviceData = devices.find(d => d.id.toString() === selectedDevice);
  const isMikroTikOnline = selectedDeviceData?.type?.toLowerCase() === 'mikrotik' && selectedDeviceData?.status === 'online';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">PPPoE Users</h3>
          <p className="text-muted-foreground">Manage PPPoE user accounts</p>
        </div>
        <div className="flex items-center space-x-2">
          {isMikroTikOnline && (
            <>
              <Button variant="outline" onClick={handleViewActiveSessions}>
                <Eye className="h-4 w-4 mr-2" />
                Active Sessions
              </Button>
              <Button variant="outline" onClick={handleSyncFromMikrotik} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Sync from MikroTik
              </Button>
            </>
          )}
          <Button onClick={() => setShowAddDialog(true)} disabled={!selectedDevice}>
            <Plus className="h-4 w-4 mr-2" />
            Add PPPoE User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Selection</CardTitle>
          <CardDescription>Select a MikroTik device to manage its PPPoE users</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a MikroTik device" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.id} value={device.id.toString()}>
                  {device.name} ({device.status === 'online' ? 'Online' : 'Offline'}) - {device.type}
                </SelectItem>
              ))}
              {devices.length === 0 && (
                <SelectItem value="none" disabled>No devices available</SelectItem>
              )}
            </SelectContent>
          </Select>

          {!selectedDevice && (
            <p className="text-sm text-muted-foreground mt-2">
              Please select a device to view and manage PPPoE users
            </p>
          )}

          {selectedDevice && selectedDeviceData && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Device: {selectedDeviceData.name}</h4>
              <div className="flex items-center space-x-4 text-sm">
                <span>Type: {selectedDeviceData.type}</span>
                <span>IP: {selectedDeviceData.ip_address}</span>
                <Badge variant={selectedDeviceData.status === 'online' ? 'default' : 'destructive'}>
                  {selectedDeviceData.status}
                </Badge>
              </div>
              {isMikroTikOnline && (
                <p className="text-sm text-green-600 mt-2">✓ MikroTik is online - Live sync and management available</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDevice && (
        <Card>
          <CardHeader>
            <CardTitle>PPPoE Users - {selectedDeviceData?.name}</CardTitle>
            <CardDescription>Manage PPPoE users for the selected device</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No PPPoE users found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add users manually or sync from MikroTik device
                </p>
                <div className="flex justify-center space-x-2">
                  {isMikroTikOnline && (
                    <Button variant="outline" onClick={handleSyncFromMikrotik}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync from MikroTik
                    </Button>
                  )}
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First PPPoE User
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.profile}</TableCell>
                      <TableCell>{user.service}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.ip_address || 'Dynamic'}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(user.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <AddPPPoEUserDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        selectedDevice={selectedDevice}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
};

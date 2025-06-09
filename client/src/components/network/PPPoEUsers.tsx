import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddPPPoEUserDialog } from './AddPPPoEUserDialog';
import { EditPPPoEUserDialog } from './EditPPPoEUserDialog';
import { Plus, Edit, Trash2, RefreshCw, Eye, MessageCircle, DollarSign } from 'lucide-react';

export const PPPoEUsers = () => {
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(null);
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
        fetchUsers(selectedDevice);
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

  const handleEditUser = (user) => {
    console.log('Edit PPPoE user:', user);
    setSelectedUser(user);
    setShowEditDialog(true);
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
        fetchUsers(selectedDevice);
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

  const handleWhatsAppClick = (phoneNumber: string) => {
    if (phoneNumber) {
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanNumber}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleUserAdded = () => {
    fetchUsers(selectedDevice);
  };

  const handleUserUpdated = () => {
    fetchUsers(selectedDevice);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
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
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Details</TableHead>
                      <TableHead>Connection</TableHead>
                      <TableHead>Contact & Device</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{user.username}</div>
                            {user.real_name && (
                              <div className="text-sm text-muted-foreground">{user.real_name}</div>
                            )}
                            {user.address && (
                              <div className="text-xs text-muted-foreground">{user.address}</div>
                            )}
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                              {user.status}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">Profile:</span> {user.profile}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Service:</span> {user.service}
                            </div>
                            {user.ip_address && (
                              <div className="text-sm">
                                <span className="font-medium">IP:</span> {user.ip_address}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2">
                            {user.whatsapp_contact && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWhatsAppClick(user.whatsapp_contact)}
                                className="flex items-center space-x-1"
                              >
                                <MessageCircle className="h-3 w-3" />
                                <span className="text-xs">WhatsApp</span>
                              </Button>
                            )}
                            {user.remote_device && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Remote:</span> {user.remote_device}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {user.service_cost && (
                              <div className="flex items-center space-x-1 text-sm">
                                <DollarSign className="h-3 w-3" />
                                <span>{formatCurrency(user.service_cost)}</span>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Created: {formatDate(user.created_at)}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
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

                {/* Summary Statistics */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{users.length}</div>
                        <div className="text-muted-foreground">Total Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {users.filter(u => u.status === 'active').length}
                        </div>
                        <div className="text-muted-foreground">Active Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {formatCurrency(users.reduce((sum, u) => sum + (u.service_cost || 0), 0))}
                        </div>
                        <div className="text-muted-foreground">Total Revenue</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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

      <EditPPPoEUserDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { AddDeviceDialog } from './AddDeviceDialog';
import { EditDeviceDialog } from './EditDeviceDialog';
import { Plus, Edit, Trash2, AlertCircle, CheckCircle, RefreshCw, Server, Wifi, Globe, Clock, Settings } from 'lucide-react';

export const DeviceManagement = () => {
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [selectedDevice, setSelectedDevice] = React.useState(null);
  const [devices, setDevices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [syncingDevice, setSyncingDevice] = React.useState(null);

  const fetchDevices = async () => {
    try {
      console.log('Fetching devices...');
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
        console.log('Devices loaded:', data.length);
      } else {
        console.error('Failed to fetch devices:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDevices();
  }, []);

  const handleEditDevice = (device: any) => {
    console.log('Opening edit dialog for device:', device);
    setSelectedDevice(device);
    setShowEditDialog(true);
  };

  const handleDeviceUpdated = async () => {
    console.log('Device updated, refreshing device list...');
    // Close dialog and clear selected device
    setShowEditDialog(false);
    setSelectedDevice(null);
    
    // Refresh device list
    await fetchDevices();
  };

  const handleEditDialogClose = (open: boolean) => {
    console.log('Edit dialog close triggered:', open);
    setShowEditDialog(open);
    if (!open) {
      setSelectedDevice(null);
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    if (!confirm('Are you sure you want to delete this device? This will also remove all associated users and profiles.')) {
      return;
    }

    try {
      console.log('Deleting device:', deviceId);
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('Device deleted successfully');
        await fetchDevices();
        alert('Device deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete device:', errorData);
        alert(`Failed to delete device: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Error deleting device');
    }
  };

  const handleSyncDevice = async (deviceId: number) => {
    setSyncingDevice(deviceId);
    try {
      console.log('Syncing device:', deviceId);
      const response = await fetch(`/api/devices/${deviceId}/sync`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Device synced successfully:', result);
        await fetchDevices();
        
        if (result.systemInfo) {
          alert(`Device sync completed!\nStatus: ${result.status}\nVersion: ${result.systemInfo.resource?.version || 'Unknown'}`);
        } else {
          alert(`Device sync completed!\nStatus: ${result.status}`);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to sync device:', errorData);
        alert(`Failed to sync device: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error syncing device:', error);
      alert('Error syncing device');
    } finally {
      setSyncingDevice(null);
    }
  };

  const handleDeviceAdded = async () => {
    console.log('Device added, refreshing device list...');
    await fetchDevices();
  };

  const formatLastSeen = (lastSeen: string) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mikrotik':
        return <Server className="h-4 w-4" />;
      case 'ruijie':
        return <Wifi className="h-4 w-4" />;
      case 'olt':
        return <Globe className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getDeviceStats = () => {
    const total = devices.length;
    const online = devices.filter(d => d.status === 'online').length;
    const offline = total - online;
    const healthPercentage = total > 0 ? (online / total) * 100 : 0;

    return { total, online, offline, healthPercentage };
  };

  const stats = getDeviceStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Device Management</h2>
            <p className="text-muted-foreground">Loading devices...</p>
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
          <h2 className="text-2xl font-bold">Device Management</h2>
          <p className="text-muted-foreground">Manage and monitor your network devices</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchDevices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>

      {/* Device Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Devices</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Online</p>
                <p className="text-2xl font-bold text-green-600">{stats.online}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Offline</p>
                <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Network Health</p>
                <span className="text-sm font-medium">{stats.healthPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={stats.healthPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.healthPercentage >= 80 ? 'Excellent' : 
                 stats.healthPercentage >= 60 ? 'Good' : 
                 stats.healthPercentage >= 40 ? 'Fair' : 'Poor'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices</CardTitle>
          <CardDescription>
            View and manage all registered network devices. Click sync to test connectivity and update status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No devices registered</h3>
              <p className="text-muted-foreground mb-6">
                Add your first network device to start managing your infrastructure
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Device
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Connection</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {getDeviceIcon(device.type)}
                          <div>
                            <div className="font-medium">{device.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {device.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <div className="font-medium capitalize">{device.type}</div>
                          {device.type.toLowerCase() === 'mikrotik' && (
                            <div className="text-xs text-blue-600">
                              API Enabled
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <div className="font-mono text-sm">{device.ip_address}</div>
                          <div className="text-xs text-muted-foreground">
                            User: {device.username}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {device.status === 'online' ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  Online
                                </Badge>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 text-destructive" />
                                <Badge variant="destructive">
                                  Offline
                                </Badge>
                              </>
                            )}
                          </div>
                          {syncingDevice === device.id && (
                            <div className="text-xs text-blue-600 flex items-center">
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Syncing...
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatLastSeen(device.last_seen)}</span>
                        </div>
                        {device.last_seen && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(device.last_seen).toLocaleString()}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncDevice(device.id)}
                            disabled={syncingDevice === device.id}
                            title="Test connection and sync status"
                          >
                            <RefreshCw className={`h-4 w-4 ${syncingDevice === device.id ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDevice(device)}
                            title="Edit device configuration"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDevice(device.id)}
                            className="text-destructive hover:text-destructive"
                            title="Delete device"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Device Management Tips */}
              <div className="bg-muted/30 rounded-lg p-4 mt-6">
                <h4 className="font-medium mb-2">Device Management Tips</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>• Click "Sync" to test device connectivity and update status</div>
                  <div>• MikroTik devices support automatic user and profile synchronization</div>
                  <div>• Offline devices may need network configuration or credential updates</div>
                  <div>• Use the refresh button to update all device statuses at once</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddDeviceDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onDeviceAdded={handleDeviceAdded}
      />

      {selectedDevice && (
        <EditDeviceDialog
          open={showEditDialog}
          onOpenChange={handleEditDialogClose}
          device={selectedDevice}
          onDeviceUpdated={handleDeviceUpdated}
        />
      )}
    </div>
  );
};

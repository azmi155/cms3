import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Wifi, Users, RefreshCw, Download } from 'lucide-react';

export const ProfileManagement = () => {
  const [selectedDevice, setSelectedDevice] = React.useState('');
  const [devices, setDevices] = React.useState([]);
  const [hotspotProfiles, setHotspotProfiles] = React.useState([]);
  const [pppoeProfiles, setPppoeProfiles] = React.useState([]);
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

  const fetchProfiles = async (deviceId: string) => {
    if (!deviceId) return;
    
    setLoading(true);
    try {
      const [hotspotResponse, pppoeResponse] = await Promise.all([
        fetch(`/api/profiles/hotspot/${deviceId}`),
        fetch(`/api/profiles/pppoe/${deviceId}`)
      ]);

      if (hotspotResponse.ok) {
        const hotspotData = await hotspotResponse.json();
        setHotspotProfiles(hotspotData);
      }

      if (pppoeResponse.ok) {
        const pppoeData = await pppoeResponse.json();
        setPppoeProfiles(pppoeData);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDevices();
  }, []);

  React.useEffect(() => {
    if (selectedDevice) {
      fetchProfiles(selectedDevice);
    } else {
      setHotspotProfiles([]);
      setPppoeProfiles([]);
    }
  }, [selectedDevice]);

  const handleSyncProfiles = async (profileType: string) => {
    if (!selectedDevice) return;
    
    setSyncing(true);
    try {
      console.log('Syncing profiles from MikroTik:', profileType);
      const response = await fetch(`/api/profiles/sync/${selectedDevice}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profileType })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Profile sync completed:', result);
        alert(result.message);
        await fetchProfiles(selectedDevice); // Refresh profiles
      } else {
        const error = await response.json();
        console.error('Failed to sync profiles:', error);
        alert(`Failed to sync profiles: ${error.error}`);
      }
    } catch (error) {
      console.error('Error syncing profiles:', error);
      alert('Error syncing profiles');
    } finally {
      setSyncing(false);
    }
  };

  const handleViewLiveProfiles = async (profileType: string) => {
    if (!selectedDevice) return;

    try {
      console.log('Fetching live profiles from MikroTik:', profileType);
      const response = await fetch(`/api/profiles/mikrotik/${selectedDevice}/${profileType}`);

      if (response.ok) {
        const liveProfiles = await response.json();
        console.log('Live profiles:', liveProfiles);
        
        // Show live profiles in a simple alert for now
        const profileNames = liveProfiles.map(p => p.name || 'Unnamed').join(', ');
        alert(`Live ${profileType} profiles from MikroTik:\n${profileNames}`);
      } else {
        const error = await response.json();
        console.error('Failed to fetch live profiles:', error);
        alert(`Failed to fetch live profiles: ${error.error}`);
      }
    } catch (error) {
      console.error('Error fetching live profiles:', error);
      alert('Error fetching live profiles');
    }
  };

  const handleAddProfile = (type: string) => {
    console.log('Add profile:', type);
    alert(`Add ${type} profile feature coming soon!`);
  };

  const handleEditProfile = (profileId: number) => {
    console.log('Edit profile:', profileId);
    alert('Edit profile feature coming soon!');
  };

  const handleDeleteProfile = (profileId: number) => {
    console.log('Delete profile:', profileId);
    alert('Delete profile feature coming soon!');
  };

  const selectedDeviceData = devices.find(d => d.id.toString() === selectedDevice);
  const isMikroTikOnline = selectedDeviceData?.type?.toLowerCase() === 'mikrotik' && selectedDeviceData?.status === 'online';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile Management</h2>
        <p className="text-muted-foreground">Manage Hotspot and PPPoE profiles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Selection</CardTitle>
          <CardDescription>Select a MikroTik device to manage or view its profiles</CardDescription>
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
              Please select a device to view and manage profiles
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
                <p className="text-sm text-green-600 mt-2">✓ MikroTik is online - Live sync available</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDevice && (
        <Tabs defaultValue="hotspot" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hotspot" className="flex items-center space-x-2">
              <Wifi className="h-4 w-4" />
              <span>Hotspot Profiles</span>
            </TabsTrigger>
            <TabsTrigger value="pppoe" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>PPPoE Profiles</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hotspot" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Hotspot Profiles - {selectedDeviceData?.name}</CardTitle>
                    <CardDescription>Manage hotspot user profiles and bandwidth limits</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isMikroTikOnline && (
                      <>
                        <Button variant="outline" onClick={() => handleViewLiveProfiles('hotspot')} disabled={syncing}>
                          <Download className="h-4 w-4 mr-2" />
                          View Live
                        </Button>
                        <Button variant="outline" onClick={() => handleSyncProfiles('hotspot')} disabled={syncing}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                          Sync from MikroTik
                        </Button>
                      </>
                    )}
                    <Button onClick={() => handleAddProfile('hotspot')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Profile
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading profiles...</p>
                  </div>
                ) : hotspotProfiles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No hotspot profiles found</p>
                    <div className="flex justify-center space-x-2">
                      {isMikroTikOnline && (
                        <Button variant="outline" onClick={() => handleSyncProfiles('hotspot')}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync from MikroTik
                        </Button>
                      )}
                      <Button onClick={() => handleAddProfile('hotspot')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Profile
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profile Name</TableHead>
                        <TableHead>Rate Limit</TableHead>
                        <TableHead>Session Timeout</TableHead>
                        <TableHead>Shared Users</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hotspotProfiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.name}</TableCell>
                          <TableCell>{profile.rate_limit || 'Not set'}</TableCell>
                          <TableCell>{profile.session_timeout || 'Not set'}</TableCell>
                          <TableCell>{profile.shared_users}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{profile.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditProfile(profile.id)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteProfile(profile.id)}>
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
          </TabsContent>

          <TabsContent value="pppoe" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>PPPoE Profiles - {selectedDeviceData?.name}</CardTitle>
                    <CardDescription>Manage PPPoE user profiles and connection settings</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isMikroTikOnline && (
                      <>
                        <Button variant="outline" onClick={() => handleViewLiveProfiles('pppoe')} disabled={syncing}>
                          <Download className="h-4 w-4 mr-2" />
                          View Live
                        </Button>
                        <Button variant="outline" onClick={() => handleSyncProfiles('pppoe')} disabled={syncing}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                          Sync from MikroTik
                        </Button>
                      </>
                    )}
                    <Button onClick={() => handleAddProfile('pppoe')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Profile
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading profiles...</p>
                  </div>
                ) : pppoeProfiles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No PPPoE profiles found</p>
                    <div className="flex justify-center space-x-2">
                      {isMikroTikOnline && (
                        <Button variant="outline" onClick={() => handleSyncProfiles('pppoe')}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync from MikroTik
                        </Button>
                      )}
                      <Button onClick={() => handleAddProfile('pppoe')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Profile
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profile Name</TableHead>
                        <TableHead>Local Address</TableHead>
                        <TableHead>Remote Address</TableHead>
                        <TableHead>Rate Limit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pppoeProfiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.name}</TableCell>
                          <TableCell>{profile.local_address || 'Not set'}</TableCell>
                          <TableCell>{profile.remote_address || 'Not set'}</TableCell>
                          <TableCell>{profile.rate_limit || 'Not set'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{profile.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditProfile(profile.id)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteProfile(profile.id)}>
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
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

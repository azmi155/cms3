import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Wifi, Globe, Settings, AlertCircle, CheckCircle } from 'lucide-react';

interface EditDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: any;
  onDeviceUpdated: () => void;
}

export const EditDeviceDialog = ({ open, onOpenChange, device, onDeviceUpdated }: EditDeviceDialogProps) => {
  const [deviceName, setDeviceName] = React.useState('');
  const [deviceType, setDeviceType] = React.useState('');
  const [ipAddress, setIpAddress] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const deviceTypes = [
    {
      value: 'mikrotik',
      label: 'MikroTik Router',
      icon: <Server className="h-4 w-4" />,
      description: 'Full API support with user and profile management',
      features: ['Hotspot Management', 'PPPoE Support', 'Real-time Monitoring', 'Profile Sync']
    },
    {
      value: 'ruijie',
      label: 'Ruijie Switch',
      icon: <Wifi className="h-4 w-4" />,
      description: 'Network switch with basic monitoring',
      features: ['Port Monitoring', 'VLAN Management', 'Basic Statistics']
    },
    {
      value: 'olt',
      label: 'OLT Device',
      icon: <Globe className="h-4 w-4" />,
      description: 'Optical Line Terminal for fiber networks',
      features: ['PON Management', 'ONT Monitoring', 'Fiber Diagnostics']
    },
    {
      value: 'other',
      label: 'Other Device',
      icon: <Settings className="h-4 w-4" />,
      description: 'Generic network device with basic connectivity',
      features: ['Basic Monitoring', 'Ping Tests', 'Status Tracking']
    }
  ];

  // Reset form when dialog opens or device changes
  React.useEffect(() => {
    if (device && open) {
      console.log('Initializing form with device data:', device);
      setDeviceName(device.name || '');
      setDeviceType(device.type || '');
      setIpAddress(device.ip_address || '');
      setUsername(device.username || '');
      setPassword(device.password || '');
    }
  }, [device, open]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setDeviceName('');
      setDeviceType('');
      setIpAddress('');
      setUsername('');
      setPassword('');
      setLoading(false);
    }
  }, [open]);

  const selectedDeviceType = deviceTypes.find(type => type.value === deviceType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      console.log('Updating device:', device.id, {
        name: deviceName,
        type: deviceType,
        ip_address: ipAddress,
        username,
        // Don't log password for security
      });
      
      const response = await fetch(`/api/devices/${device.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: deviceName,
          type: deviceType,
          ip_address: ipAddress,
          username,
          password,
          status: device.status // Keep existing status
        })
      });

      if (response.ok) {
        const updatedDevice = await response.json();
        console.log('Device updated successfully:', updatedDevice.name);
        
        // Close dialog first
        onOpenChange(false);
        
        // Then refresh device list
        onDeviceUpdated();
        
        // Show success message
        alert(`Device "${deviceName}" updated successfully!`);
      } else {
        const error = await response.json();
        console.error('Failed to update device:', error);
        alert(`Failed to update device: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating device:', error);
      alert('Failed to update device. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const isValid = deviceName.trim() && deviceType && ipAddress.trim() && username.trim() && password.trim();
    console.log('Form validation:', {
      deviceName: !!deviceName.trim(),
      deviceType: !!deviceType,
      ipAddress: !!ipAddress.trim(),
      username: !!username.trim(),
      password: !!password.trim(),
      isValid
    });
    return isValid;
  };

  const handleCancel = () => {
    console.log('Canceling edit, resetting form');
    // Reset form to original values
    if (device) {
      setDeviceName(device.name || '');
      setDeviceType(device.type || '');
      setIpAddress(device.ip_address || '');
      setUsername(device.username || '');
      setPassword(device.password || '');
    }
    onOpenChange(false);
  };

  const handleTypeSelect = (type: string) => {
    console.log('Device type selected:', type);
    setDeviceType(type);
  };

  if (!device) {
    console.log('No device provided to EditDeviceDialog');
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Device: {device.name}</DialogTitle>
          <DialogDescription>
            Update the device configuration. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Device Status */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Current Status</h4>
                  <p className="text-sm text-muted-foreground">Device ID: {device.id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {device.status === 'online' ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                </div>
              </div>
              {device.last_seen && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last seen: {new Date(device.last_seen).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Device Type Selection */}
          <div className="space-y-3">
            <Label>Device Type *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deviceTypes.map((type) => (
                <Card 
                  key={type.value}
                  className={`cursor-pointer transition-all ${
                    deviceType === type.value 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => handleTypeSelect(type.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded ${
                        deviceType === type.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {type.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{type.label}</h4>
                          {deviceType === type.value && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <CardDescription className="text-xs mt-1">
                          {type.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedDeviceType && (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <h5 className="font-medium mb-2">Features Available:</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedDeviceType.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Device Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name *</Label>
              <Input
                id="deviceName"
                placeholder="e.g., Main Router, Office Switch"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this device
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address *</Label>
              <Input
                id="ipAddress"
                placeholder="192.168.1.1"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                required
              />
              <p className="text-xs text-muted-foreground">
                The device's network IP address
              </p>
            </div>
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Device management username
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Device management password
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div className="text-sm">
                  <h5 className="font-medium text-amber-800">Update Notice</h5>
                  <p className="text-amber-700 mt-1">
                    Changing the IP address or credentials may affect device connectivity. 
                    Test the connection after updating to ensure the device remains accessible.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !validateForm()}
              className="min-w-[100px]"
            >
              {loading ? 'Updating...' : 'Update Device'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

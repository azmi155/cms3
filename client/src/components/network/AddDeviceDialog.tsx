import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Wifi, Globe, Settings, AlertCircle, CheckCircle } from 'lucide-react';

interface AddDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeviceAdded: () => void;
}

export const AddDeviceDialog = ({ open, onOpenChange, onDeviceAdded }: AddDeviceDialogProps) => {
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

  const selectedDeviceType = deviceTypes.find(type => type.value === deviceType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Adding device:', { deviceName, deviceType, ipAddress, username });
      
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: deviceName,
          type: deviceType,
          ip_address: ipAddress,
          username,
          password
        })
      });

      if (response.ok) {
        const device = await response.json();
        console.log('Device added successfully:', device);
        
        // Reset form
        setDeviceName('');
        setDeviceType('');
        setIpAddress('');
        setUsername('');
        setPassword('');
        
        onDeviceAdded();
        onOpenChange(false);
        
        // Show success message
        alert(`Device "${deviceName}" added successfully! You can now sync it to test connectivity.`);
      } else {
        const error = await response.json();
        console.error('Failed to add device:', error);
        alert(`Failed to add device: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding device:', error);
      alert('Failed to add device. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    return deviceName && deviceType && ipAddress && username && password;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Network Device</DialogTitle>
          <DialogDescription>
            Register a new network device to manage through the dashboard. Choose the device type for optimal integration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Device Type Selection */}
          <div className="space-y-3">
            <Label>Device Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deviceTypes.map((type) => (
                <Card 
                  key={type.value}
                  className={`cursor-pointer transition-all ${
                    deviceType === type.value 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setDeviceType(type.value)}
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
                  <h5 className="font-medium text-amber-800">Security Notice</h5>
                  <p className="text-amber-700 mt-1">
                    Credentials are stored securely and used only for device management. 
                    Ensure the device account has appropriate permissions for API access.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !validateForm()}
              className="min-w-[100px]"
            >
              {loading ? 'Adding...' : 'Add Device'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

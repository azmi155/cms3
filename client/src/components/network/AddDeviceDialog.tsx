import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [errors, setErrors] = React.useState({});

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

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setDeviceName('');
      setDeviceType('');
      setIpAddress('');
      setUsername('');
      setPassword('');
      setErrors({});
      setLoading(false);
    }
  }, [open]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!deviceName || !deviceName.trim()) {
      newErrors.deviceName = 'Device name is required';
    } else if (deviceName.trim().length > 100) {
      newErrors.deviceName = 'Device name must be less than 100 characters';
    }
    
    if (!deviceType) {
      newErrors.deviceType = 'Device type is required';
    }
    
    if (!ipAddress || !ipAddress.trim()) {
      newErrors.ipAddress = 'IP address is required';
    } else {
      // Validate IP format
      const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      if (!ipRegex.test(ipAddress.trim())) {
        newErrors.ipAddress = 'Invalid IP address format (e.g., 192.168.1.1)';
      } else {
        // Validate IP range
        const parts = ipAddress.trim().split('.');
        const invalidParts = parts.filter(part => {
          const num = parseInt(part);
          return num < 0 || num > 255;
        });
        if (invalidParts.length > 0) {
          newErrors.ipAddress = 'IP address octets must be between 0-255';
        }
      }
    }
    
    if (!username || !username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const deviceData = {
        name: deviceName.trim(),
        type: deviceType,
        ip_address: ipAddress.trim(),
        username: username.trim(),
        password: password
      };

      console.log('Adding device with data:', deviceData);
      
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deviceData)
      });

      const responseText = await response.text();
      console.log('Server response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        throw new Error('Invalid server response');
      }

      if (response.ok) {
        console.log('Device added successfully:', data);
        
        // Reset form
        setDeviceName('');
        setDeviceType('');
        setIpAddress('');
        setUsername('');
        setPassword('');
        setErrors({});
        
        // Close dialog and trigger refresh
        onOpenChange(false);
        onDeviceAdded();
        
        // Show success message
        alert(`Device "${deviceData.name}" added successfully! You can now sync it to test connectivity.`);
      } else {
        console.error('Failed to add device:', data);
        
        // Handle specific error cases
        if (data.error && data.error.includes('IP address already exists')) {
          setErrors({ ipAddress: data.error });
        } else if (data.error && data.error.includes('Missing required fields')) {
          alert('Please fill in all required fields');
        } else {
          alert(`Failed to add device: ${data.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error adding device:', error);
      alert('Failed to add device. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDeviceName('');
    setDeviceType('');
    setIpAddress('');
    setUsername('');
    setPassword('');
    setErrors({});
    onOpenChange(false);
  };

  const handleTypeSelect = (type) => {
    setDeviceType(type);
    // Clear device type error when user selects a type
    if (errors.deviceType) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.deviceType;
        return newErrors;
      });
    }
  };

  const handleInputChange = (field, value) => {
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    switch (field) {
      case 'deviceName':
        setDeviceName(value);
        break;
      case 'ipAddress':
        setIpAddress(value);
        break;
      case 'username':
        setUsername(value);
        break;
      case 'password':
        setPassword(value);
        break;
    }
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
            <Label>Device Type *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deviceTypes.map((type) => (
                <Card 
                  key={type.value}
                  className={`cursor-pointer transition-all ${
                    deviceType === type.value 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-muted-foreground/50'
                  } ${errors.deviceType ? 'border-red-500' : ''}`}
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
            {errors.deviceType && (
              <p className="text-sm text-red-500">{errors.deviceType}</p>
            )}

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
                onChange={(e) => handleInputChange('deviceName', e.target.value)}
                className={errors.deviceName ? 'border-red-500' : ''}
                required
              />
              {errors.deviceName && (
                <p className="text-sm text-red-500">{errors.deviceName}</p>
              )}
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
                onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                className={errors.ipAddress ? 'border-red-500' : ''}
                required
              />
              {errors.ipAddress && (
                <p className="text-sm text-red-500">{errors.ipAddress}</p>
              )}
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
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={errors.username ? 'border-red-500' : ''}
                required
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username}</p>
              )}
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
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={errors.password ? 'border-red-500' : ''}
                required
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
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
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
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

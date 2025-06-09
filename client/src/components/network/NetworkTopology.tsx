import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Router, Wifi, AlertCircle, CheckCircle, Server, Globe, RefreshCw, Activity } from 'lucide-react';

interface NetworkTopologyProps {
  devices?: {
    total: number;
    online: number;
    offline: number;
  };
}

export const NetworkTopology = ({ devices }: NetworkTopologyProps) => {
  const [deviceList, setDeviceList] = React.useState([]);

  React.useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDeviceList(data);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const handleDeviceClick = (device: any) => {
    console.log('Device clicked:', device);
    // Could open device details modal or navigate to device management
  };

  const getDeviceIcon = (type: string, status: string) => {
    const iconClass = `h-8 w-8 mx-auto mb-2 ${status === 'online' ? 'text-green-500' : 'text-muted-foreground'}`;
    
    switch (type.toLowerCase()) {
      case 'mikrotik':
        return <Router className={iconClass} />;
      case 'ruijie':
        return <Wifi className={iconClass} />;
      case 'olt':
        return <Server className={iconClass} />;
      default:
        return <Globe className={iconClass} />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'online') {
      return (
        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Online
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertCircle className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    );
  };

  if (deviceList.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
          <Server className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Devices Configured</h3>
          <p className="text-muted-foreground mb-4">
            Add your first network device to see the topology visualization
          </p>
          <Button>
            <Router className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Network Overview */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Network Overview</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{devices?.total || deviceList.length}</div>
            <div className="text-sm text-muted-foreground">Total Devices</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{devices?.online || 0}</div>
            <div className="text-sm text-muted-foreground">Online</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{devices?.offline || deviceList.length}</div>
            <div className="text-sm text-muted-foreground">Offline</div>
          </div>
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {deviceList.map((device) => (
          <Card 
            key={device.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              device.status === 'online' ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
            }`}
            onClick={() => handleDeviceClick(device)}
          >
            <CardContent className="p-4 text-center">
              {getDeviceIcon(device.type, device.status)}
              
              <h5 className="font-semibold mb-1">{device.name}</h5>
              <p className="text-sm text-muted-foreground mb-2">{device.type}</p>
              
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  IP: {device.ip_address}
                </div>
                
                {getStatusBadge(device.status)}
                
                {device.last_seen && (
                  <div className="text-xs text-muted-foreground">
                    Last seen: {new Date(device.last_seen).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Device Type Specific Info */}
              {device.type.toLowerCase() === 'mikrotik' && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                  <div className="font-medium text-blue-800">MikroTik Features</div>
                  <div className="text-blue-600">Hotspot & PPPoE Support</div>
                </div>
              )}

              {device.status === 'online' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-3 w-full text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('View details for:', device.name);
                  }}
                >
                  View Details
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connection Map */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-semibold mb-4">Connection Status</h4>
        <div className="space-y-3">
          {deviceList.map((device) => (
            <div key={device.id} className="flex items-center justify-between p-3 bg-background rounded border">
              <div className="flex items-center space-x-3">
                {getDeviceIcon(device.type, device.status)}
                <div>
                  <div className="font-medium">{device.name}</div>
                  <div className="text-sm text-muted-foreground">{device.ip_address}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {device.status === 'online' && (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Connected</span>
                  </div>
                )}
                {getStatusBadge(device.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Actions */}
      <div className="flex flex-wrap gap-2 justify-center pt-4 border-t">
        <Button variant="outline" size="sm" onClick={fetchDevices}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Topology
        </Button>
        <Button variant="outline" size="sm">
          <Server className="h-4 w-4 mr-2" />
          Add Device
        </Button>
        <Button variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Network Test
        </Button>
      </div>

      {/* Legend */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h5 className="font-medium mb-3">Legend</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Router className="h-4 w-4 text-muted-foreground" />
            <span>MikroTik Router</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <span>Ruijie Switch</span>
          </div>
          <div className="flex items-center space-x-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span>OLT Device</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Online Status</span>
          </div>
        </div>
      </div>
    </div>
  );
};

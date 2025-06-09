import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddPPPoEUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDevice: string;
  onUserAdded: () => void;
}

export const AddPPPoEUserDialog = ({ open, onOpenChange, selectedDevice, onUserAdded }: AddPPPoEUserDialogProps) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [profile, setProfile] = React.useState('');
  const [service, setService] = React.useState('');
  const [ipAddress, setIpAddress] = React.useState('');
  const [realName, setRealName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [whatsappContact, setWhatsappContact] = React.useState('');
  const [remoteDevice, setRemoteDevice] = React.useState('');
  const [serviceCost, setServiceCost] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Adding PPPoE user:', { selectedDevice, username, profile, service, realName });
      
      const response = await fetch('/api/users/pppoe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: selectedDevice,
          username,
          password,
          profile,
          service,
          ip_address: ipAddress,
          real_name: realName,
          address,
          whatsapp_contact: whatsappContact,
          remote_device: remoteDevice,
          service_cost: serviceCost
        })
      });

      if (response.ok) {
        const user = await response.json();
        console.log('PPPoE user added successfully:', user);
        
        // Reset form
        setUsername('');
        setPassword('');
        setProfile('');
        setService('');
        setIpAddress('');
        setRealName('');
        setAddress('');
        setWhatsappContact('');
        setRemoteDevice('');
        setServiceCost('');
        
        onUserAdded();
        onOpenChange(false);
        alert('PPPoE user added successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to add PPPoE user:', error);
        alert(`Failed to add PPPoE user: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding PPPoE user:', error);
      alert('Failed to add PPPoE user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    if (whatsappContact) {
      const phoneNumber = whatsappContact.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phoneNumber}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add PPPoE User</DialogTitle>
          <DialogDescription>
            Create a new PPPoE user account. If the MikroTik device is online, the user will also be added to the device.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile">Profile *</Label>
              <Select value={profile} onValueChange={setProfile} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service *</Label>
              <Select value={service} onValueChange={setService} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pppoe">PPPoE</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ipAddress">IP Address</Label>
            <Input
              id="ipAddress"
              placeholder="192.168.1.100 (optional)"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for dynamic IP assignment
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="realName">Customer Name</Label>
            <Input
              id="realName"
              placeholder="Enter customer full name"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Enter customer address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappContact">WhatsApp Contact</Label>
            <div className="flex space-x-2">
              <Input
                id="whatsappContact"
                placeholder="+62812345678 or 08123456789"
                value={whatsappContact}
                onChange={(e) => setWhatsappContact(e.target.value)}
                className="flex-1"
              />
              {whatsappContact && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleWhatsAppClick}
                  className="shrink-0"
                >
                  Open WhatsApp
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer WhatsApp number for direct contact
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remoteDevice">Remote Device</Label>
            <Input
              id="remoteDevice"
              placeholder="192.168.1.1:8080"
              value={remoteDevice}
              onChange={(e) => setRemoteDevice(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Remote device IP with port 8080 (e.g., 192.168.1.1:8080)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceCost">Service Cost</Label>
            <Input
              id="serviceCost"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={serviceCost}
              onChange={(e) => setServiceCost(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Monthly service cost in your local currency
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedDevice}>
              {loading ? 'Adding...' : 'Add User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

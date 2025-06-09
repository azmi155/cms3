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
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Adding PPPoE user:', { selectedDevice, username, profile, service });
      
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
          service
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add PPPoE User</DialogTitle>
          <DialogDescription>
            Create a new PPPoE user account. If the MikroTik device is online, the user will also be added to the device.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile">Profile</Label>
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
            <Label htmlFor="service">Service</Label>
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

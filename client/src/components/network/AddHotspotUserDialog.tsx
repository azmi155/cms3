import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddHotspotUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDevice: string;
  onUserAdded: () => void;
}

export const AddHotspotUserDialog = ({ open, onOpenChange, selectedDevice, onUserAdded }: AddHotspotUserDialogProps) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [profile, setProfile] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [profiles, setProfiles] = React.useState([]);
  const [loadingProfiles, setLoadingProfiles] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setUsername('');
      setPassword('');
      setProfile('');
    }
  }, [open]);

  React.useEffect(() => {
    if (selectedDevice && open) {
      fetchProfiles();
    }
  }, [selectedDevice, open]);

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      console.log('Fetching hotspot profiles for device:', selectedDevice);
      const response = await fetch(`/api/profiles/hotspot/${selectedDevice}`);
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
        console.log('Hotspot profiles loaded:', data.length);
      } else {
        console.error('Failed to fetch profiles');
        setProfiles([]);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Adding hotspot user:', { selectedDevice, username, profile });
      
      const response = await fetch('/api/users/hotspot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: selectedDevice,
          username,
          password,
          profile
        })
      });

      if (response.ok) {
        const user = await response.json();
        console.log('Hotspot user added successfully:', user);
        
        // Reset form
        setUsername('');
        setPassword('');
        setProfile('');
        
        onUserAdded();
        onOpenChange(false);
      } else {
        const error = await response.json();
        console.error('Failed to add hotspot user:', error);
        alert(`Failed to add user: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding hotspot user:', error);
      alert('Failed to add user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Hotspot User</DialogTitle>
          <DialogDescription>
            Create a new hotspot user account
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
            <Select value={profile} onValueChange={setProfile} required disabled={loadingProfiles}>
              <SelectTrigger>
                <SelectValue placeholder={loadingProfiles ? "Loading profiles..." : "Select profile"} />
              </SelectTrigger>
              <SelectContent>
                {profiles.length === 0 && !loadingProfiles && (
                  <SelectItem value="default">Default (No profiles found)</SelectItem>
                )}
                {profiles.map((prof) => (
                  <SelectItem key={prof.id} value={prof.name}>
                    {prof.name} {prof.rate_limit && `(${prof.rate_limit})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {profiles.length === 0 && !loadingProfiles && (
              <p className="text-xs text-amber-600">
                No profiles found. Add profiles first or sync from MikroTik.
              </p>
            )}
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

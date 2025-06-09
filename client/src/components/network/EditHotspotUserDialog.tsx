import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditHotspotUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onUserUpdated: () => void;
}

export const EditHotspotUserDialog = ({ open, onOpenChange, user, onUserUpdated }: EditHotspotUserDialogProps) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [profile, setProfile] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [profiles, setProfiles] = React.useState([]);
  const [loadingProfiles, setLoadingProfiles] = React.useState(false);

  React.useEffect(() => {
    if (user && open) {
      setUsername(user.username || '');
      setPassword(user.password || '');
      setProfile(user.profile || '');
      setStatus(user.status || 'active');
      
      // Fetch profiles for this device
      if (user.device_id) {
        fetchProfiles(user.device_id);
      }
    }
  }, [user, open]);

  const fetchProfiles = async (deviceId) => {
    setLoadingProfiles(true);
    try {
      console.log('Fetching hotspot profiles for device:', deviceId);
      const response = await fetch(`/api/profiles/hotspot/${deviceId}`);
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
      console.log('Updating hotspot user:', user.id);
      
      const response = await fetch(`/api/users/hotspot/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          profile,
          status
        })
      });

      if (response.ok) {
        console.log('Hotspot user updated successfully');
        onUserUpdated();
        onOpenChange(false);
        alert('User updated successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to update user:', error);
        alert(`Failed to update user: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Hotspot User</DialogTitle>
          <DialogDescription>
            Update user account details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
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
                  <SelectItem value={profile || "default"}>
                    {profile || "Default"} (Current)
                  </SelectItem>
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
                No profiles found. Current profile will be kept.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

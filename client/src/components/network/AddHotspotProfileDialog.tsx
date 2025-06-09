import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddHotspotProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDevice: string;
  onProfileAdded: () => void;
}

export const AddHotspotProfileDialog = ({ open, onOpenChange, selectedDevice, onProfileAdded }: AddHotspotProfileDialogProps) => {
  const [name, setName] = React.useState('');
  const [rateLimit, setRateLimit] = React.useState('');
  const [sessionTimeout, setSessionTimeout] = React.useState('');
  const [sharedUsers, setSharedUsers] = React.useState('1');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setName('');
      setRateLimit('');
      setSessionTimeout('');
      setSharedUsers('1');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Adding hotspot profile:', { selectedDevice, name, rateLimit, sessionTimeout, sharedUsers });
      
      const response = await fetch('/api/profiles/hotspot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: selectedDevice,
          name,
          rate_limit: rateLimit || null,
          session_timeout: sessionTimeout || null,
          shared_users: parseInt(sharedUsers) || 1
        })
      });

      if (response.ok) {
        const profile = await response.json();
        console.log('Hotspot profile added successfully:', profile);
        
        setName('');
        setRateLimit('');
        setSessionTimeout('');
        setSharedUsers('1');
        
        onProfileAdded();
        onOpenChange(false);
        alert('Hotspot profile added successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to add hotspot profile:', error);
        alert(`Failed to add profile: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding hotspot profile:', error);
      alert('Failed to add profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Hotspot Profile</DialogTitle>
          <DialogDescription>
            Create a new hotspot profile. This will be added to the database and to MikroTik if the device is online.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Profile Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Premium, Basic, Guest"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rateLimit">Rate Limit</Label>
            <Input
              id="rateLimit"
              placeholder="e.g., 1M/2M, 512K/1M"
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Upload/Download rate limit (optional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout</Label>
            <Input
              id="sessionTimeout"
              placeholder="e.g., 1h, 2h30m, 8h"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Maximum session duration (optional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sharedUsers">Shared Users</Label>
            <Input
              id="sharedUsers"
              type="number"
              min="1"
              value={sharedUsers}
              onChange={(e) => setSharedUsers(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Number of concurrent users allowed
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedDevice}>
              {loading ? 'Adding...' : 'Add Profile'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

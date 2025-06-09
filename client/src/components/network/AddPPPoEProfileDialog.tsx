import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddPPPoEProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDevice: string;
  onProfileAdded: () => void;
}

export const AddPPPoEProfileDialog = ({ open, onOpenChange, selectedDevice, onProfileAdded }: AddPPPoEProfileDialogProps) => {
  const [name, setName] = React.useState('');
  const [localAddress, setLocalAddress] = React.useState('');
  const [remoteAddress, setRemoteAddress] = React.useState('');
  const [rateLimit, setRateLimit] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setName('');
      setLocalAddress('');
      setRemoteAddress('');
      setRateLimit('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Adding PPPoE profile:', { selectedDevice, name, localAddress, remoteAddress, rateLimit });
      
      const response = await fetch('/api/profiles/pppoe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: selectedDevice,
          name,
          local_address: localAddress || null,
          remote_address: remoteAddress || null,
          rate_limit: rateLimit || null
        })
      });

      if (response.ok) {
        const profile = await response.json();
        console.log('PPPoE profile added successfully:', profile);
        
        setName('');
        setLocalAddress('');
        setRemoteAddress('');
        setRateLimit('');
        
        onProfileAdded();
        onOpenChange(false);
        alert('PPPoE profile added successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to add PPPoE profile:', error);
        alert(`Failed to add profile: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding PPPoE profile:', error);
      alert('Failed to add profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add PPPoE Profile</DialogTitle>
          <DialogDescription>
            Create a new PPPoE profile. This will be added to the database and to MikroTik if the device is online.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Profile Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Home, Business, Premium"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="localAddress">Local Address</Label>
            <Input
              id="localAddress"
              placeholder="e.g., 10.0.0.1"
              value={localAddress}
              onChange={(e) => setLocalAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Local server IP address (optional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remoteAddress">Remote Address</Label>
            <Input
              id="remoteAddress"
              placeholder="e.g., 10.0.0.0/24"
              value={remoteAddress}
              onChange={(e) => setRemoteAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Remote client IP range (optional)
            </p>
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

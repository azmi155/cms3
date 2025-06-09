import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Phone, 
  MapPin, 
  Globe, 
  Monitor, 
  DollarSign, 
  Calendar, 
  Key,
  MessageCircle,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PPPoEUserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

export const PPPoEUserDetailDialog = ({ open, onOpenChange, user }: PPPoEUserDetailDialogProps) => {
  const [copied, setCopied] = React.useState('');

  const handleWhatsAppClick = () => {
    if (user?.whatsapp_contact) {
      const cleanNumber = user.whatsapp_contact.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanNumber}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleRemoteClick = () => {
    if (user?.remote_device) {
      const url = `http://${user.remote_device}`;
      window.open(url, '_blank');
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>PPPoE User Details</span>
          </DialogTitle>
          <DialogDescription>
            Comprehensive information for {user.username}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Account Status</span>
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                  {user.status === 'active' ? (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-1" />
                  )}
                  {user.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Key className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <div className="font-medium text-blue-700">Account Type</div>
                  <div className="text-sm text-blue-600">PPPoE User</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Globe className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <div className="font-medium text-green-700">Service</div>
                  <div className="text-sm text-green-600">{user.service}</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                  <div className="font-medium text-purple-700">Profile</div>
                  <div className="text-sm text-purple-600">{user.profile}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
              <CardDescription>Login credentials and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Username</label>
                    <div className="flex items-center space-x-2">
                      <div className="font-mono text-sm bg-muted px-3 py-2 rounded flex-1">
                        {user.username}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(user.username, 'username')}
                      >
                        {copied === 'username' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Password</label>
                    <div className="flex items-center space-x-2">
                      <div className="font-mono text-sm bg-muted px-3 py-2 rounded flex-1">
                        {user.password}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(user.password, 'password')}
                      >
                        {copied === 'password' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {user.ip_address && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                    <div className="flex items-center space-x-2">
                      <div className="font-mono text-sm bg-green-50 border border-green-200 px-3 py-2 rounded flex-1">
                        {user.ip_address}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(user.ip_address, 'ip')}
                      >
                        {copied === 'ip' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
              <CardDescription>Personal and contact details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.real_name ? (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <User className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-blue-700">{user.real_name}</div>
                      <div className="text-sm text-blue-600">Customer Name</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-400" />
                    <div className="text-sm text-gray-500">No customer name provided</div>
                  </div>
                )}

                {user.whatsapp_contact ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium text-green-700">{user.whatsapp_contact}</div>
                        <div className="text-sm text-green-600">WhatsApp Contact</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleWhatsAppClick}
                      className="bg-green-100 border-green-300 text-green-700 hover:bg-green-200"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Open WhatsApp
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div className="text-sm text-gray-500">No contact number provided</div>
                  </div>
                )}

                {user.address ? (
                  <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-orange-700">Address</div>
                      <div className="text-sm text-orange-600">{user.address}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div className="text-sm text-gray-500">No address provided</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Network & Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Network & Service Information</CardTitle>
              <CardDescription>Technical and billing details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.remote_device ? (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Monitor className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="font-medium text-purple-700">Remote Device</div>
                        <div className="text-sm text-purple-600 font-mono">{user.remote_device}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoteClick}
                      className="bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Remote
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Monitor className="h-5 w-5 text-gray-400" />
                    <div className="text-sm text-gray-500">No remote device configured</div>
                  </div>
                )}

                {user.service_cost ? (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium text-green-700">Service Cost</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(user.service_cost)}/month
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div className="text-sm text-gray-500">No service cost defined</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account History</CardTitle>
              <CardDescription>Creation and modification dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <div className="text-sm bg-muted px-3 py-2 rounded">
                    {formatDate(user.created_at)}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <div className="text-sm bg-muted px-3 py-2 rounded">
                    {formatDate(user.updated_at)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common customer support tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {user.whatsapp_contact && (
                  <Button
                    variant="outline"
                    onClick={handleWhatsAppClick}
                    className="flex items-center space-x-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Contact Customer</span>
                  </Button>
                )}
                
                {user.remote_device && (
                  <Button
                    variant="outline"
                    onClick={handleRemoteClick}
                    className="flex items-center space-x-2"
                  >
                    <Monitor className="h-4 w-4" />
                    <span>Access Remote</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => handleCopy(`${user.username}:${user.password}`, 'credentials')}
                  className="flex items-center space-x-2"
                >
                  {copied === 'credentials' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>Copy Credentials</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

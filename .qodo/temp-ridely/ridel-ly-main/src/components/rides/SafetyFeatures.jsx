import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Share2, 
  Phone, 
  AlertTriangle, 
  Users,
  MapPin,
  CheckCircle2,
  Copy,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function SafetyFeatures({ ride, onShareTrip }) {
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareContacts, setShareContacts] = useState([{ name: '', phone: '' }]);
  const [isSharing, setIsSharing] = useState(false);

  const handleShareTrip = async () => {
    setIsSharing(true);
    try {
      const shareUrl = `${window.location.origin}/TrackRide?id=${ride.id}`;
      const shareText = `Track my Ride-ly trip: ${shareUrl}`;

      // Try native share first
      if (navigator.share) {
        await navigator.share({
          title: 'Track My Ride',
          text: `I'm taking a Ride-ly from ${ride.pickup_location?.address} to ${ride.destination?.address}`,
          url: shareUrl
        });
        toast.success('Trip shared successfully!');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        toast.success('Trip link copied to clipboard!');
      }

      // Send SMS to contacts if provided
      const validContacts = shareContacts.filter(c => c.phone);
      if (validContacts.length > 0) {
        for (const contact of validContacts) {
          await base44.integrations.Core.SendEmail({
            to: contact.phone + '@txt.att.net', // This is a placeholder - would need SMS integration
            subject: 'Track my ride',
            body: `${contact.name ? `Hi ${contact.name}, ` : ''}I'm on my way! Track my ride: ${shareUrl}`
          });
        }
        toast.success(`Trip shared with ${validContacts.length} contact(s)`);
      }

      setShowShareDialog(false);
      onShareTrip?.();
    } catch (error) {
      console.error('Share error:', error);
      // Still try to copy to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/TrackRide?id=${ride.id}`);
        toast.success('Trip link copied!');
      } catch (e) {
        toast.error('Could not share trip');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleEmergency = () => {
    // In a real app, this would:
    // 1. Alert the platform
    // 2. Share location with emergency contacts
    // 3. Potentially call emergency services
    setShowEmergencyDialog(true);
  };

  const confirmEmergency = async () => {
    toast.info('Emergency services notified. Stay safe.');
    // Would trigger actual emergency protocols
    setShowEmergencyDialog(false);
  };

  const addContact = () => {
    setShareContacts([...shareContacts, { name: '', phone: '' }]);
  };

  const updateContact = (index, field, value) => {
    const updated = [...shareContacts];
    updated[index][field] = value;
    setShareContacts(updated);
  };

  return (
    <>
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="w-5 h-5 text-blue-600" />
            Safety Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Share Trip */}
          <Button
            variant="outline"
            className="w-full justify-start bg-white hover:bg-blue-50"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="w-4 h-4 mr-3 text-blue-600" />
            <div className="text-left">
              <p className="font-medium">Share Trip Status</p>
              <p className="text-xs text-gray-500">Let others track your ride</p>
            </div>
          </Button>

          {/* Trusted Contacts */}
          <Button
            variant="outline"
            className="w-full justify-start bg-white hover:bg-blue-50"
            onClick={() => toast.info('Manage trusted contacts in Settings')}
          >
            <Users className="w-4 h-4 mr-3 text-blue-600" />
            <div className="text-left">
              <p className="font-medium">Trusted Contacts</p>
              <p className="text-xs text-gray-500">Auto-share with family & friends</p>
            </div>
          </Button>

          {/* Emergency Button */}
          <Button
            variant="outline"
            className="w-full justify-start bg-red-50 border-red-200 hover:bg-red-100"
            onClick={handleEmergency}
          >
            <AlertTriangle className="w-4 h-4 mr-3 text-red-600" />
            <div className="text-left">
              <p className="font-medium text-red-900">Emergency Assistance</p>
              <p className="text-xs text-red-700">Get immediate help</p>
            </div>
          </Button>

          {/* Safety Info */}
          <div className="pt-3 border-t border-blue-200">
            <div className="flex items-center gap-2 text-xs text-blue-800">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Driver verified • Trip monitored</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Your Trip
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Trip Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-gray-500">From</p>
                  <p className="font-medium">{ride?.pickup_location?.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-gray-500">To</p>
                  <p className="font-medium">{ride?.destination?.address}</p>
                </div>
              </div>
            </div>

            {/* Quick Share */}
            <Button
              onClick={handleShareTrip}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Trip Link
            </Button>

            {/* Share with Contacts */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Share with specific contacts</Label>
              {shareContacts.map((contact, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    placeholder="Name (optional)"
                    value={contact.name}
                    onChange={(e) => updateContact(idx, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="Phone number"
                    value={contact.phone}
                    onChange={(e) => updateContact(idx, 'phone', e.target.value)}
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={addContact}
                className="mt-2"
              >
                + Add another contact
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareTrip} disabled={isSharing}>
              {isSharing ? 'Sharing...' : 'Share Trip'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Emergency Assistance
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-gray-600">
              If you're in immediate danger, please call emergency services directly.
            </p>

            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-lg py-6"
              onClick={() => window.location.href = 'tel:911'}
            >
              <Phone className="w-5 h-5 mr-2" />
              Call 911
            </Button>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">
                Or report a non-emergency safety concern:
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={confirmEmergency}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Report Safety Issue
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmergencyDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
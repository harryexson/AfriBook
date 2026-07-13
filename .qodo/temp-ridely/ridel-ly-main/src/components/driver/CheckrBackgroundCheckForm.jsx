import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CheckrBackgroundCheckForm({ user, onComplete }) {
  const [formData, setFormData] = useState({
    firstName: user?.full_name?.split(' ')[0] || '',
    lastName: user?.full_name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    dob: '',
    ssn: '',
    licenseNumber: '',
    licenseState: '',
    zipCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasCheckrId = user?.checkr_candidate_id && user?.checkr_report_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.dob || !formData.ssn || !formData.licenseNumber || !formData.licenseState) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await base44.functions.invoke('initiateBackgroundCheck', formData);
      
      if (result.data?.success) {
        toast.success('Background check initiated! This may take 3-5 business days.');
        onComplete?.();
      } else {
        toast.error(result.data?.error || 'Failed to initiate background check');
      }
    } catch (error) {
      console.error('Error initiating background check:', error);
      toast.error('Failed to initiate background check');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasCheckrId) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Background Check Submitted</p>
              <p className="text-sm text-green-700">Your background check is being processed by Checkr</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Background Check Authorization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Required for All Drivers</p>
              <p className="text-xs">
                We use Checkr to verify your identity, driving record (MVR), and criminal background. 
                This is a standard industry practice to ensure safety for all users.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date of Birth *</Label>
              <Input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                required
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>ZIP Code *</Label>
              <Input
                placeholder="12345"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                maxLength="5"
                required
              />
            </div>
          </div>

          <div>
            <Label>Social Security Number (Last 4 digits) *</Label>
            <Input
              type="password"
              placeholder="1234"
              value={formData.ssn}
              onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
              maxLength="4"
              required
            />
            <p className="text-xs text-gray-500 mt-1">🔒 Encrypted and secure</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Driver's License Number *</Label>
              <Input
                placeholder="DL123456"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>License State *</Label>
              <Input
                placeholder="CA"
                value={formData.licenseState}
                onChange={(e) => setFormData({ ...formData, licenseState: e.target.value.toUpperCase() })}
                maxLength="2"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting to Checkr...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Authorize Background Check
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By submitting, you authorize Checkr to conduct a background check. 
            Processing typically takes 3-5 business days.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
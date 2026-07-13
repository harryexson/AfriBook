import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const statusConfig = {
  pending: { 
    icon: Clock, 
    color: 'bg-yellow-100 text-yellow-800', 
    label: 'Pending Verification',
    description: 'Background check is being processed by Checkr'
  },
  complete: { 
    icon: CheckCircle2, 
    color: 'bg-green-100 text-green-800', 
    label: 'Verification Complete',
    description: 'Background check has been completed'
  },
  clear: { 
    icon: CheckCircle2, 
    color: 'bg-green-100 text-green-800', 
    label: 'Approved',
    description: 'Background check passed successfully'
  },
  consider: { 
    icon: AlertTriangle, 
    color: 'bg-orange-100 text-orange-800', 
    label: 'Under Review',
    description: 'Additional review required'
  },
  suspended: { 
    icon: XCircle, 
    color: 'bg-red-100 text-red-800', 
    label: 'Suspended',
    description: 'Background check requires attention'
  }
};

export default function CheckrVerificationCard({ user, onUpdate }) {
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const result = await base44.functions.invoke('checkBackgroundStatus', {});
      
      if (result.data?.success) {
        toast.success('Status updated');
        onUpdate?.();
      } else {
        toast.error(result.data?.error || 'Failed to check status');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Failed to check status');
    } finally {
      setIsChecking(false);
    }
  };

  const status = user.background_check_status || 'not_started';
  const result = user.background_check_result || null;
  const config = statusConfig[result] || statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const hasCheckrId = user.checkr_candidate_id && user.checkr_report_id;

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Checkr Background Verification
          </CardTitle>
          {hasCheckrId && (
            <Button
              variant="outline"
              size="sm"
              onClick={checkStatus}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Check Status
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasCheckrId ? (
          <div className="text-center py-4">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Background check will be initiated during onboarding
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-full ${config.color.split(' ')[0]}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <Badge className={config.color}>{config.label}</Badge>
                <p className="text-sm text-gray-600 mt-1">{config.description}</p>
              </div>
            </div>

            {user.background_check_completed_at && (
              <div className="text-xs text-gray-500">
                Completed: {new Date(user.background_check_completed_at).toLocaleDateString()}
              </div>
            )}

            {result === 'consider' && user.background_check_issues && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> {user.background_check_issues}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-3 border-t">
              <div className="text-sm">
                <p className="text-gray-500">Checkr Candidate ID</p>
                <p className="font-mono text-xs">{user.checkr_candidate_id}</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-500">Report ID</p>
                <p className="font-mono text-xs">{user.checkr_report_id}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
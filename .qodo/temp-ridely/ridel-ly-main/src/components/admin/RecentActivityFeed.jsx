import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  UserPlus, 
  FileText, 
  DollarSign, 
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const activityIcons = {
  ride_completed: { icon: Car, color: 'bg-green-100 text-green-600' },
  ride_cancelled: { icon: Car, color: 'bg-red-100 text-red-600' },
  new_user: { icon: UserPlus, color: 'bg-blue-100 text-blue-600' },
  document_uploaded: { icon: FileText, color: 'bg-yellow-100 text-yellow-600' },
  document_approved: { icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
  payout_requested: { icon: DollarSign, color: 'bg-purple-100 text-purple-600' },
  dispute_opened: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-600' }
};

export default function RecentActivityFeed({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const config = activityIcons[activity.type] || activityIcons.ride_completed;
            const Icon = config.icon;

            return (
              <div key={activity.id || index} className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", config.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
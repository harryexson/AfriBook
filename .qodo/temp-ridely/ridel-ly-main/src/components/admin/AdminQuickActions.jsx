import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Users, 
  Car, 
  Zap, 
  AlertTriangle,
  Settings,
  BarChart3,
  Gift
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const quickActions = [
  {
    title: 'Review Documents',
    description: 'Pending driver documents',
    icon: FileText,
    color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    href: 'AdminDocumentReview'
  },
  {
    title: 'User Management',
    description: 'Manage users & roles',
    icon: Users,
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    href: 'AdminUserManagement'
  },
  {
    title: 'Ride Monitoring',
    description: 'Active & past rides',
    icon: Car,
    color: 'bg-green-100 text-green-700 hover:bg-green-200',
    href: 'AdminRideMonitor'
  },
  {
    title: 'Analytics',
    description: 'Performance metrics',
    icon: BarChart3,
    color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    href: 'AdminAnalytics'
  },
  {
    title: 'Promo Codes',
    description: 'Manage promotions',
    icon: Gift,
    color: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
    href: 'AdminPromoCodes'
  },
  {
    title: 'Support Panel',
    description: 'Customer support',
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    href: 'AdminSupportPanel'
  }
];

export default function AdminQuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link key={action.title} to={createPageUrl(action.href)}>
              <Button
                variant="outline"
                className={`w-full h-auto py-4 flex flex-col items-center gap-2 ${action.color} border-0`}
              >
                <action.icon className="w-6 h-6" />
                <div className="text-center">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs opacity-70">{action.description}</p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
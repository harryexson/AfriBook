import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function AdminStatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  trendValue,
  className,
  iconColor = 'text-gray-400'
}) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <div className="flex items-center gap-2">
              {trend && (
                <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
                  {getTrendIcon()}
                  <span>{trendValue}</span>
                </div>
              )}
              {description && (
                <p className="text-xs text-gray-500">{description}</p>
              )}
            </div>
          </div>
          {Icon && (
            <div className={cn("p-3 rounded-xl bg-gray-100", iconColor)}>
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
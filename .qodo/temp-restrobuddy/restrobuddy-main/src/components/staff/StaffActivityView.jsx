import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Activity, Clock, ShoppingBag, Package, DollarSign } from "lucide-react";
import { StaffActivityLog } from "@/entities/StaffActivityLog";
import { format } from "date-fns";

export default function StaffActivityView({ staff, onClose }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadActivities();
  }, [staff]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const logs = await StaffActivityLog.filter(
        { employee_id: staff.id },
        "-created_date",
        100
      );
      setActivities(logs);
    } catch (error) {
      console.error("Error loading activities:", error);
    }
    setIsLoading(false);
  };

  const getIcon = (type) => {
    const icons = {
      order_update: ShoppingBag,
      order_create: ShoppingBag,
      menu_update: Package,
      inventory_update: Package,
      login: Activity,
      logout: Activity,
      clock_in: Clock,
      clock_out: Clock,
      payment_process: DollarSign
    };
    return icons[type] || Activity;
  };

  const getActionColor = (type) => {
    const colors = {
      order_update: 'bg-blue-100 text-blue-800',
      order_create: 'bg-green-100 text-green-800',
      menu_update: 'bg-purple-100 text-purple-800',
      inventory_update: 'bg-amber-100 text-amber-800',
      login: 'bg-slate-100 text-slate-800',
      logout: 'bg-slate-100 text-slate-800',
      clock_in: 'bg-emerald-100 text-emerald-800',
      clock_out: 'bg-orange-100 text-orange-800',
      payment_process: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
  };

  const filteredActivities = filter === "all" 
    ? activities 
    : activities.filter(a => a.action_type === filter);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-1">Activity Log</CardTitle>
              <p className="text-blue-100">{staff.full_name} - {staff.role}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-blue-500">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === "order_update" ? "default" : "outline"}
              onClick={() => setFilter("order_update")}
            >
              Orders
            </Button>
            <Button
              size="sm"
              variant={filter === "clock_in" ? "default" : "outline"}
              onClick={() => setFilter("clock_in")}
            >
              Clock In/Out
            </Button>
            <Button
              size="sm"
              variant={filter === "inventory_update" ? "default" : "outline"}
              onClick={() => setFilter("inventory_update")}
            >
              Inventory
            </Button>
            <Button
              size="sm"
              variant={filter === "payment_process" ? "default" : "outline"}
              onClick={() => setFilter("payment_process")}
            >
              Payments
            </Button>
          </div>

          {/* Activity List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No activity logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => {
                const Icon = getIcon(activity.action_type);
                
                return (
                  <Card key={activity.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(activity.action_type)}`}>
                          <Icon className="w-6 h-6" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge className={getActionColor(activity.action_type)}>
                                {activity.action_type.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-500">
                              {format(new Date(activity.created_date), 'MMM d, h:mm a')}
                            </span>
                          </div>

                          <p className="text-sm text-slate-900 font-medium mb-1">
                            {activity.description}
                          </p>

                          {activity.related_order_id && (
                            <p className="text-xs text-slate-600">
                              Order: #{activity.related_order_id.slice(-6)}
                            </p>
                          )}

                          {activity.before_value && activity.after_value && (
                            <div className="mt-2 pt-2 border-t border-slate-200 text-xs">
                              <div className="flex gap-4">
                                <div>
                                  <span className="text-slate-500">Before:</span>
                                  <span className="ml-1 text-slate-700">{activity.before_value}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">After:</span>
                                  <span className="ml-1 text-slate-700">{activity.after_value}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
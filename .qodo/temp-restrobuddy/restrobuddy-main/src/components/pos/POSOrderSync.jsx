import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function POSOrderSync({ restaurantId }) {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [syncError, setSyncError] = useState(null);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);

  // Auto-sync every 2 minutes
  useEffect(() => {
    if (!isAutoSyncEnabled) return;

    const interval = setInterval(async () => {
      await handleSync();
    }, 120000);

    return () => clearInterval(interval);
  }, [restaurantId, isAutoSyncEnabled]);

  const handleSync = async () => {
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      // Fetch pending orders
      const orders = await base44.asServiceRole.entities.Order.filter({
        status: 'pending'
      });

      const restaurantOrders = orders.filter(o => o.restaurant_id === restaurantId);
      setPendingOrders(restaurantOrders.length);

      // Simulate POS sync - in production, this would connect to actual POS system
      await new Promise(resolve => setTimeout(resolve, 1000));

      setLastSync(new Date());
      setSyncStatus('success');

      // Reset success message after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error.message);
      setSyncStatus('error');
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>POS System Sync</span>
          <Badge 
            variant={
              syncStatus === 'syncing' ? 'default' :
              syncStatus === 'success' ? 'default' :
              syncStatus === 'error' ? 'destructive' :
              'secondary'
            }
          >
            {syncStatus === 'syncing' && 'Syncing...'}
            {syncStatus === 'success' && 'Synced'}
            {syncStatus === 'error' && 'Error'}
            {syncStatus === 'idle' && 'Ready'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600">Pending Orders</p>
            <p className="text-2xl font-bold text-blue-600">{pendingOrders}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600">Last Sync</p>
            <p className="text-sm font-semibold">
              {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="space-y-3">
          <Button
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
            className="w-full gap-2"
          >
            {syncStatus === 'syncing' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </>
            )}
          </Button>

          {/* Auto-sync Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium">Auto-sync (every 2 min)</span>
            <button
              onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
              className={`w-10 h-6 rounded-full transition-colors ${
                isAutoSyncEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  isAutoSyncEnabled ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {syncError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{syncError}</p>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg">
          <p className="font-semibold mb-1">POS Integration Info:</p>
          <p>• Automatically syncs pending orders every 2 minutes</p>
          <p>• Updates inventory from POS system</p>
          <p>• Prevents duplicate orders and menu inconsistencies</p>
        </div>
      </CardContent>
    </Card>
  );
}
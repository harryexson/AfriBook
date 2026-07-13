import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BrowserNotificationManager() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    if (permission === 'default') {
      const hasPrompted = localStorage.getItem('notification_prompted');
      if (!hasPrompted) {
        setTimeout(() => setShowPrompt(true), 5000); // Show after 5 seconds
      }
    }
  }, [permission]);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem('notification_prompted', 'true');
      setShowPrompt(false);

      if (result === 'granted') {
        // Test notification
        new Notification('Notifications Enabled!', {
          body: 'You\'ll now receive real-time updates about your rides.',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('notification_prompted', 'true');
  };

  if (!showPrompt || permission !== 'default') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 z-[9999] max-w-sm"
      >
        <Card className="shadow-2xl border-2 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1">Enable Notifications</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Get real-time updates about your rides, driver arrivals, and special offers.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={requestPermission}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Enable
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={dismissPrompt}
                  >
                    Not now
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={dismissPrompt}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
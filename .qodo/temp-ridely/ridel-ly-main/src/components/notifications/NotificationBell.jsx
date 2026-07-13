import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import NotificationCenter from './NotificationCenter';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCenter, setShowCenter] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    
    // Poll every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const user = await base44.auth.me();
      const notifications = await base44.entities.Notification.filter(
        { user_id: user.id, is_read: false },
        '-created_date',
        100
      );
      setUnreadCount(notifications.length);
    } catch (error) {
      // Silently fail
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setShowCenter(true)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0.5 text-xs min-w-[20px] h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      <NotificationCenter
        isOpen={showCenter}
        onClose={() => {
          setShowCenter(false);
          loadUnreadCount();
        }}
      />
    </>
  );
}
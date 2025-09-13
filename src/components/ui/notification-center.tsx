import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCircle, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';

interface Notification {
  id: number;
  recipientAddress: string;
  title: string;
  message: string;
  type: string;
  relatedId?: number;
  relatedType?: string;
  actionRequired: boolean;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  walletAddress: string;
}

export function NotificationCenter({ walletAddress }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications', walletAddress],
    enabled: !!walletAddress,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['/api/notifications', walletAddress, 'unread'],
    enabled: !!walletAddress,
    refetchInterval: 30000
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/${walletAddress}/read-all`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'milestone_due':
      case 'milestone_created':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'milestone_completed':
      case 'verification_approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'verification_required':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'verification_rejected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'funds_available':
      case 'funds_released':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'contract_signed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.actionUrl) {
      // Navigate to the action URL
      window.location.href = notification.actionUrl;
    }
  };

  const unreadCount = unreadNotifications.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-0">
                  {notifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm leading-tight">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                            {notification.actionRequired && (
                              <Badge variant="outline" className="text-xs">
                                Action required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
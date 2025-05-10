import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Notification {
  id: number;
  userId: number;
  clientId?: number;
  title: string;
  content: string;
  type: "message" | "appointment" | "system";
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
  scheduledFor?: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Okunmamış bildirimleri al
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/notifications/unread-count");
        const data = await response.json();
        return data.count;
      } catch (error) {
        console.error("Bildirim sayısı alınamadı:", error);
        return 0;
      }
    },
  });

  // Tüm bildirimleri al
  const { 
    data: notifications = [], 
    refetch: refetchNotifications,
    isLoading 
  } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/notifications");
        const data = await response.json();
        return data as Notification[];
      } catch (error) {
        console.error("Bildirimler alınamadı:", error);
        return [];
      }
    },
    enabled: open, // Popover açılınca yükle
  });

  // Bildirim okundu olarak işaretle
  const markAsRead = async (notificationId: number) => {
    try {
      await apiRequest("POST", `/api/notifications/${notificationId}/mark-read`);
      refetchNotifications();
      refetchUnreadCount();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Bildirim okundu olarak işaretlenemedi",
        variant: "destructive",
      });
    }
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = async () => {
    try {
      await apiRequest("POST", "/api/notifications/mark-all-read");
      refetchNotifications();
      refetchUnreadCount();
      toast({
        title: "Bildirimler",
        description: "Tüm bildirimler okundu olarak işaretlendi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Bildirimler okundu olarak işaretlenemedi",
        variant: "destructive",
      });
    }
  };

  // Popover açıldığında bildirimleri yenile
  useEffect(() => {
    if (open) {
      refetchNotifications();
    }
  }, [open, refetchNotifications]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative p-2 h-9 w-9 rounded-full">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 rounded-full flex items-center justify-center bg-red-500 border-none text-white text-[10px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-medium">Bildirimler</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={markAllAsRead}
            >
              Tümünü okundu işaretle
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <span className="text-sm text-muted-foreground">Yükleniyor...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <span className="text-sm text-muted-foreground">Bildirim yok</span>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`p-3 hover:bg-muted transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-muted/40" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    {notification.type === "message" ? (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                        <Bell size={16} />
                      </div>
                    ) : notification.type === "appointment" ? (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                        <Bell size={16} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <Bell size={16} />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{notification.title}</p>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-xs">{notification.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
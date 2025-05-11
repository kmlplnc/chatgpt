import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, 
  CheckCheck, 
  Clock,
  Send,
  Loader2,
  MoreVertical,
  Trash2
} from "lucide-react";
import { format, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {  ArrowLeft,  MessageSquare,  Mail, Settings } from "lucide-react";
import { isYesterday, isThisWeek, isThisYear } from 'date-fns';

interface Message {
  id: number;
  content: string;
  fromClient: boolean;
  createdAt: string;
  isRead: boolean;
  status?: string;
  userId?: number;
  clientId?: number;
}

interface MessageGroup {
  date: string;
  messages: Message[];
}

export default function ClientPortalMessages() {
  const [newMessage, setNewMessage] = useState("");
  const [groupedMessages, setGroupedMessages] = useState<MessageGroup[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [, navigate] = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Mesaj silme mutation'ı
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest('DELETE', `/api/client-portal/messages/${messageId}`);
      if (!response.ok) throw new Error('Mesaj silinemedi');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-portal/messages'] });
      toast({
        title: "Başarılı",
        description: "Mesaj silindi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Mesaj silinemedi: ${error.message}`,
        variant: "destructive",
      });
    }
  });

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await fetch('/api/client-portal/messages/unread/count', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setUnreadCount(data.count || 0);
                } else {
                    console.error('Failed to fetch unread message count');
                    setUnreadCount(0);
                }
            } catch (error) {
                console.error('Error fetching unread message count:', error);
                setUnreadCount(0);
            }
        };

        fetchUnreadCount();
    }, []);

  // Ses efekti oluşturma
  useEffect(() => {
    audioRef.current = new Audio('https://www.soundjay.com/misc/sounds/bell-ding-1.mp3');
  }, []);

  // Mesajları getir
  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/client-portal/messages'],
    queryFn: async () => {
      const response = await fetch('/api/client-portal/messages', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Mesajlar getirilemedi');
      }
      return response.json();
    },
    refetchInterval: 1500
  });

  // Diyetisyen bilgilerini getir
  const { data: dietitian } = useQuery({
    queryKey: ['/api/client-portal/dietitian'],
    queryFn: async () => {
      const response = await fetch('/api/client-portal/dietitian', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Diyetisyen bilgileri getirilemedi');
      }
      return response.json();
    }
  });

  // Mesaj gönderme
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/client-portal/messages", { content });
      if (!response.ok) {
        throw new Error("Mesaj gönderilemedi");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-portal/messages'] });
      toast({
        title: "Başarılı",
        description: "Mesaj gönderildi",
      });
      setNewMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mesajın gönderilmesi
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage);
    }
  };

  // Mesajları gruplandır ve yeni mesaj bildirim sesi
  useEffect(() => {
    if (messages) {
      const newGroups = groupMessagesByDate(messages);

      if (groupedMessages.length > 0) {
        const oldMessageCount = groupedMessages.reduce(
          (sum, group) => sum + group.messages.length, 0
        );
        const newMessageCount = messages.length;

        if (newMessageCount > oldMessageCount) {
          const lastMessage = messages[messages.length - 1];

          if (!lastMessage.fromClient) {
            if (audioRef.current) {
              audioRef.current.play().catch(err => console.error("Ses çalma hatası:", err));
            }

            toast({
              title: "Yeni Mesaj",
              description: "Diyetisyeninizden yeni bir mesaj aldınız.",
              duration: 3000
            });
          }
        }
      }

      setGroupedMessages(newGroups);
    }
  }, [messages]);

  // Mesajların sonuna scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    if (messages && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages]);

  // Mesajları okundu olarak işaretle
  const markMessagesAsRead = async () => {
    try {
      const unreadMessages = messages?.filter(msg => !msg.fromClient && !msg.isRead).map(msg => msg.id) || [];

      if (unreadMessages.length > 0) {
        await apiRequest('POST', '/api/client-portal/messages/mark-as-read', { 
          messageIds: unreadMessages 
        });

        queryClient.invalidateQueries({ queryKey: ['/api/client-portal/messages'] });
      }
    } catch (error) {
      console.error('Mesajlar okundu olarak işaretlenemedi:', error);
    }
  };

  // Mesajları günlere göre grupla
  const groupMessagesByDate = (messages: Message[]): MessageGroup[] => {
    if (!messages || messages.length === 0) return [];

    const groups: MessageGroup[] = [];
    let currentDate: string | null = null;
    let currentGroup: Message[] = [];

    messages.forEach(message => {
      const messageDate = new Date(message.createdAt);
      const messageDay = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
      ).toISOString();

      if (messageDay !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate!,
            messages: currentGroup
          });
        }
        currentDate = messageDay;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0 && currentDate) {
      groups.push({
        date: currentDate,
        messages: currentGroup
      });
    }

    return groups;
  };

  // Tarih gösterimini formatla
  const formatGroupDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();

    if (isToday(date)) {
      return "Bugün";
    } else if (isYesterday(new Date(date.setDate(date.getDate() + 1)))) {
      return "Dün";
    } else {
      return format(date, 'd MMMM yyyy', { locale: tr });
    }
  };

  // Mesaj saatini formatla
  const formatMessageTime = (dateString: string): string => {
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
        {/* Başlık ve geri düğmesi */}
        <header className="border-b">
            <div className="container mx-auto py-4 px-4 md:px-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold">Mesajlar</h1>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/client-portal/dashboard')}
                        className="text-muted-foreground hover:text-primary"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Danışan Portalına Dön
                    </Button>
                </div>
                {unreadCount > 0 && (
                    <Badge variant="destructive">
                        {unreadCount} Okunmamış Mesaj
                    </Badge>
                )}
            </div>
        </header>
    <div className="min-h-screen bg-background">
      <div className="container py-6 flex-1">
        <Card className="w-full max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
          <CardHeader className="border-b flex flex-row items-center p-4">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarFallback>{dietitian?.name ? dietitian.name.substring(0, 2).toUpperCase() : "DD"}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{dietitian?.name || "Diyetisyeniniz"}</CardTitle>
              <CardDescription>Hızlı iletişim için mesaj gönderebilirsiniz</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={messagesContainerRef}>
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : groupedMessages && groupedMessages.length > 0 ? (
                <div className="space-y-4">
                  {groupedMessages.map((group, groupIndex) => (
                    <div key={group.date} className="space-y-3">
                      <div className="flex justify-center my-4">
                        <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                          {formatGroupDate(group.date)}
                        </div>
                      </div>

                      {group.messages.map((message, messageIndex) => {
                        const isConsecutive = messageIndex > 0 && 
                          group.messages[messageIndex - 1].fromClient === message.fromClient;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${message.fromClient ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`relative max-w-[80%] group rounded-lg px-4 py-2 flex flex-col ${
                                message.fromClient 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-slate-100 text-slate-900"
                              } ${
                                isConsecutive 
                                  ? message.fromClient 
                                    ? "rounded-tr-sm" 
                                    : "rounded-tl-sm" 
                                  : ""
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{message.content}</p>
                              <div className={`flex items-center space-x-2 mt-1 ${
                                message.fromClient 
                                  ? "text-primary-foreground/80" 
                                  : "text-slate-500"
                              }`}>
                                <span className="text-xs">
                                  {formatMessageTime(message.createdAt)}
                                </span>
                                {message.fromClient && (
                                  <>
                                    {message.isRead ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-[160px]">
                                        <DropdownMenuItem onClick={() => deleteMessageMutation.mutate(message.id)}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Mesajı Sil</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <p className="text-muted-foreground">Henüz mesaj yok.</p>
                  <p className="text-sm">Diyetisyeninize mesaj göndererek sohbeti başlatın.</p>
                </div>
              )}
            </ScrollArea>

            <div className="px-4 py-3 border-t bg-background">
              <div className="flex items-end space-x-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Mesajınızı yazın..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1 pr-10 min-h-[48px] rounded-2xl bg-muted border-0"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    {sendMessageMutation.isPending && (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
        </div>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  CheckCheck, 
  Clock, 
  Loader2, 
  MessageSquare, 
  Search, 
  Send 
} from "lucide-react";
import { format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ClientPortalMessages() {
  const [newMessage, setNewMessage] = useState("");
  const [groupedMessages, setGroupedMessages] = useState<MessageGroup[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Mesajları getir
  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/client-portal/messages'],
    queryFn: async () => {
      const response = await fetch('/api/client-portal/messages');
      if (!response.ok) {
        throw new Error('Mesajlar getirilemedi');
      }
      return response.json();
    }
  });

  // Dietisyen ve danışan bilgilerini getir
  const { data: clientData } = useQuery({
    queryKey: ['/api/client-portal/me'],
    queryFn: async () => {
      const response = await fetch('/api/client-portal/me');
      if (!response.ok) {
        throw new Error('Kullanıcı bilgileri getirilemedi');
      }
      return response.json();
    }
  });

  const { data: dietitian } = useQuery({
    queryKey: ['/api/client-portal/dietitian'],
    queryFn: async () => {
      const response = await fetch('/api/client-portal/dietitian');
      if (!response.ok) {
        throw new Error('Diyetisyen bilgileri getirilemedi');
      }
      return response.json();
    },
    enabled: !!clientData
  });

  // Mesaj gönderme
  async function sendMessage(content: string) {
    const response = await apiRequest("POST", "/api/client-portal/messages", { content });
    if (!response.ok) {
      throw new Error("Mesaj gönderilemedi");
    }
    return response.json();
  }
  
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
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

  // Otomatik scroll ve mesajları okundu olarak işaretle
  // Mesajları gruplandır
  useEffect(() => {
    if (messages) {
      setGroupedMessages(groupMessagesByDate(messages));
    }
  }, [messages]);

  // Mesajların sonuna scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    // Mesajlar yüklendiğinde okundu olarak işaretle
    if (messages && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages]);
  
  // Mesajları okundu olarak işaretle
  const markMessagesAsRead = async () => {
    try {
      await fetch('/api/client-portal/messages/mark-as-read', {
        method: 'POST',
      });
      // Okunmamış mesaj sayısını güncelle
      queryClient.invalidateQueries({ queryKey: ['/api/client-portal/messages/unread/count'] });
    } catch (error) {
      console.error('Mesajlar okundu olarak işaretlenemedi:', error);
    }
  };
  
  // Mesaj durumunu görüntüle
  const MessageStatus = ({ status }: { status: string }) => {
    if (status === 'sent') {
      return <Clock className="h-3 w-3 text-current opacity-70" />;
    } 
    
    if (status === 'delivered') {
      return (
        <div className="flex items-center">
          <CheckCheck className="h-3 w-3 text-current opacity-70" />
        </div>
      );
    } 
    
    if (status === 'read') {
      return (
        <div className="flex items-center">
          <CheckCheck className="h-3 w-3 text-blue-400" />
        </div>
      );
    }
    
    return null;
  };
  
  // Mesaj tipi tanımı
  interface Message {
    id: number;
    content: string;
    fromClient: boolean;
    createdAt: string;
    status?: string;
    userId?: number;
    clientId?: number;
  }
  
  // Grup tipi tanımı
  interface MessageGroup {
    date: string;
    messages: Message[];
  }
  
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
            date: currentDate,
            messages: currentGroup
          });
        }
        currentDate = messageDay;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
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
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    
    const isToday = date.getDate() === now.getDate() && 
                   date.getMonth() === now.getMonth() && 
                   date.getFullYear() === now.getFullYear();
                   
    const isYesterday = date.getDate() === yesterday.getDate() && 
                        date.getMonth() === yesterday.getMonth() && 
                        date.getFullYear() === yesterday.getFullYear();
    
    if (isToday) {
      return "Bugün";
    } else if (isYesterday) {
      return "Dün";
    } else {
      return format(date, 'd MMMM yyyy', { locale: tr });
    }
  };

  // Mesaj tarihini formatla
  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Diyetisyeninizle Mesajlaşma</h1>
      
      <Card className="w-full max-w-4xl mx-auto h-[70vh] flex flex-col">
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
                    {/* Tarih ayırıcı */}
                    <div className="flex justify-center my-4">
                      <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                        {formatGroupDate(group.date)}
                      </div>
                    </div>
                    
                    {/* Gün içindeki mesajlar */}
                    {group.messages.map((message, messageIndex) => {
                      // Aynı kişiden ardışık mesajları belirle
                      const isConsecutive = messageIndex > 0 && 
                        group.messages[messageIndex - 1].fromClient === message.fromClient;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${message.fromClient ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 flex flex-col ${
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
                            <div className={`flex justify-end items-center space-x-1 mt-1 ${
                              message.fromClient 
                                ? "text-primary-foreground/80" 
                                : "text-slate-500"
                            }`}>
                              <span className="text-xs">
                                {formatMessageTime(message.createdAt)}
                              </span>
                              {message.fromClient && (
                                <MessageStatus status={message.status || 'delivered'} />
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
          
          {/* Mesaj gönderme alanı */}
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
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : null}
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
  );
}
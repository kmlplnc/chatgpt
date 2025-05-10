import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Avatar, 
  AvatarFallback,
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  Send, 
  Search, 
  Loader2, 
  Check, 
  CheckCheck, 
  Clock,
  MessageSquare
} from "lucide-react";
import { format, isToday, isYesterday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mesaj tipi tanımı
interface Message {
  id: number;
  message: string;
  fromClient: boolean;
  createdAt: string;
  isRead?: boolean;
  status?: string;
  userId?: number;
  clientId?: number;
}

// Grup tipi tanımı
interface MessageGroup {
  date: string;
  messages: Message[];
}

export default function MessagesPage() {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [groupedMessages, setGroupedMessages] = useState<MessageGroup[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Danışanları getir
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/clients');
      return response.json();
    }
  });

  // Seçili danışan için mesajları getir
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const response = await apiRequest('GET', `/api/messages/${selectedClient.id}`);
      if (!response.ok) throw new Error('Mesajlar getirilemedi');
      return response.json();
    },
    enabled: !!selectedClient
  });

  // Okunmamış mesaj sayılarını getir
  const { data: unreadCounts, isLoading: unreadLoading } = useQuery({
    queryKey: ['/api/messages/unread/counts-by-client'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/messages/unread/counts-by-client');
      if (!response.ok) throw new Error('Okunmamış mesaj sayıları getirilemedi');
      return response.json();
    },
    refetchInterval: 15000 // Her 15 saniyede bir güncelle
  });

  // Mesaj gönder
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest('POST', '/api/messages', {
        clientId: selectedClient.id,
        message: text,
        fromClient: false
      });
      if (!response.ok) throw new Error('Mesaj gönderilemedi');
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedClient?.id] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Mesaj gönderilemedi: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mesajları okundu olarak işaretle
  const markAsReadMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await apiRequest('POST', `/api/messages/${clientId}/mark-as-read`);
      if (!response.ok) throw new Error('Mesajlar okundu olarak işaretlenemedi');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/counts-by-client'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
    }
  });

  // Mesaj gönderme işlevi
  const handleSendMessage = () => {
    if (newMessage.trim() && selectedClient) {
      sendMessageMutation.mutate(newMessage);
    }
  };

  // Enter tuşuyla mesaj gönderme
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Mesajları görüntülediğinde okundu olarak işaretle
  useEffect(() => {
    if (selectedClient && messages && messages.length > 0) {
      markAsReadMutation.mutate(selectedClient.id);
    }
  }, [selectedClient, messages]);

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
  }, [groupedMessages]);

  // Danışanları ara
  const filteredClients = clients
    ? clients.filter(client => 
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Danışanı seç
  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };

  // Danışan adını görüntüle
  const getClientInitials = (client) => {
    return `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
  };

  // Mesaj tarihini formatla
  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'dd MMM HH:mm', { locale: tr });
    }
  };
  
  // Mesajları günlere göre grupla
  const groupMessagesByDate = (messages) => {
    if (!messages || messages.length === 0) return [];
    
    const groups = [];
    let currentDate = null;
    let currentGroup = [];
    
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
    
    if (isToday(date)) {
      return "Bugün";
    } else if (isYesterday(date)) {
      return "Dün";
    } else {
      return format(date, 'd MMMM yyyy', { locale: tr });
    }
  };

  // Mesaj durumunu görüntüle
  const MessageStatus = ({ status }) => {
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

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Mesajlar</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Sol panel: Danışan Listesi */}
        <Card className="col-span-1 border h-full flex flex-col overflow-hidden">
          <CardHeader className="p-4 border-b space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Danışanlar</CardTitle>
              <Badge variant="outline" className="font-normal text-xs">
                {filteredClients.length} danışan
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Danışan ara..." 
                className="pl-9 rounded-full bg-muted border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-290px)]">
              {clientsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div>
                  {filteredClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 p-4 text-center">
                      <p className="text-muted-foreground mb-1">Danışan bulunamadı</p>
                      <p className="text-xs text-muted-foreground">Farklı bir arama terimi deneyin</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-muted/40">
                      {filteredClients.map(client => {
                        const unreadCount = unreadCounts?.find(c => c.clientId === client.id)?.count || 0;
                        const isActive = selectedClient?.id === client.id;
                        const lastMessageGroup = messages && selectedClient?.id === client.id && groupedMessages.length > 0 
                          ? groupedMessages[groupedMessages.length - 1] 
                          : null;
                        const lastMessage = lastMessageGroup 
                          ? lastMessageGroup.messages[lastMessageGroup.messages.length - 1] 
                          : null;
                        
                        return (
                          <li key={client.id}>
                            <button 
                              className={`w-full py-3 px-4 flex items-center space-x-3 hover:bg-muted/40 transition-colors ${isActive ? 'bg-muted/70' : ''}`}
                              onClick={() => handleClientSelect(client)}
                            >
                              <Avatar className="h-12 w-12 border-2 border-background">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getClientInitials(client)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 text-left overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="font-medium truncate">{client.firstName} {client.lastName}</p>
                                  {lastMessage && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {formatMessageDate(lastMessage.createdAt)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex justify-between items-center">
                                  <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                                    {lastMessage 
                                      ? (lastMessage.fromClient ? '' : 'Sen: ') + lastMessage.message
                                      : 'Henüz mesaj yok'}
                                  </p>
                                  {unreadCount > 0 && (
                                    <Badge 
                                      className="bg-primary text-white h-5 min-w-[20px] flex items-center justify-center rounded-full text-xs ml-2"
                                    >
                                      {unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Sağ panel: Mesajlaşma Alanı */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 h-full flex flex-col">
          {selectedClient ? (
            <>
              {/* Mesajlaşma başlığı */}
              <CardHeader className="flex flex-row items-center p-4 border-b">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback>{getClientInitials(selectedClient)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{selectedClient.firstName} {selectedClient.lastName}</CardTitle>
                  <CardDescription>{selectedClient.email}</CardDescription>
                </div>
              </CardHeader>
              
              {/* Mesaj alanı */}
              <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 p-4" ref={messagesContainerRef}>
                  {messagesLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : groupedMessages.length > 0 ? (
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
                                className={`flex ${message.fromClient ? "justify-start" : "justify-end"}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-lg px-4 py-2 flex flex-col ${
                                    message.fromClient 
                                      ? "bg-slate-100 text-slate-900" 
                                      : "bg-primary text-primary-foreground"
                                  } ${
                                    isConsecutive 
                                      ? message.fromClient 
                                        ? "rounded-tl-sm" 
                                        : "rounded-tr-sm" 
                                      : ""
                                  }`}
                                >
                                  <p>{message.message}</p>
                                  <div className={`flex justify-end items-center space-x-1 mt-1 ${
                                    message.fromClient 
                                      ? "text-slate-500" 
                                      : "text-primary-foreground/80"
                                  }`}>
                                    <span className="text-xs">
                                      {formatMessageDate(message.createdAt)}
                                    </span>
                                    {!message.fromClient && (
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
                      <p className="text-sm">Danışanınıza mesaj göndererek sohbeti başlatın.</p>
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
                        onKeyDown={handleKeyPress}
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Mesajlaşma</h3>
              <p className="text-muted-foreground max-w-md">
                Sol panelden bir danışan seçerek mesajlaşmaya başlayın.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// Import should be at the top of the file, this line can be removed
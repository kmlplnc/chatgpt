import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  MessageSquare,
  Mail
} from "lucide-react";
import { format, isToday, isYesterday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mesaj tipi tanımı
interface Message {
  id: number;
  content: string; // mesaj içeriği "content" alanında tutuluyor
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Ses efekti oluşturma - daha kısa/hoş bir mesaj sesi
  useEffect(() => {
    audioRef.current = new Audio('https://www.soundjay.com/misc/sounds/bell-ding-1.mp3');
  }, []);

  // Danışanları getir
  const { data: clients, isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/clients');
        if (!response.ok) {
          throw new Error('Danışanlar getirilemedi');
        }
        return response.json();
      } catch (error) {
        console.error('Danışanlar yüklenirken hata:', error);
        return [];
      }
    }
  });

  // Seçili danışan için mesajları getir
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/messages', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      try {
        const response = await apiRequest('GET', `/api/messages/${selectedClient.id}`);
        if (!response.ok) throw new Error('Mesajlar getirilemedi');
        const data = await response.json();
        console.log('Yüklenen mesajlar:', data);
        return data;
      } catch (error) {
        console.error('Mesajlar yüklenirken hata:', error);
        return [];
      }
    },
    refetchInterval: 1500, // Her 1.5 saniyede bir güncelle (daha hızlı)
    enabled: !!selectedClient
  });

  // Okunmamış mesaj sayılarını getir
  const { data: unreadCounts, isLoading: unreadLoading } = useQuery({
    queryKey: ['/api/messages/unread/counts-by-client'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/messages/unread/counts-by-client');
        if (!response.ok) throw new Error('Okunmamış mesaj sayıları getirilemedi');
        return response.json();
      } catch (error) {
        console.error('Okunmamış mesaj sayıları yüklenirken hata:', error);
        return [];
      }
    },
    refetchInterval: 5000 // Her 5 saniyede bir güncelle
  });

  // Mesaj gönder
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedClient) {
        throw new Error('Lütfen bir danışan seçin');
      }
      
      const response = await apiRequest('POST', '/api/messages', {
        clientId: selectedClient.id,
        content: text,
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
    if (!newMessage.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir mesaj yazın",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedClient) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir danışan seçin",
        variant: "destructive",
      });
      return;
    }
    
    sendMessageMutation.mutate(newMessage);
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

  // Mesajları gruplandır ve yeni mesaj sesi çal
  useEffect(() => {
    if (messages && Array.isArray(messages)) {
      console.log("Mesajlar yüklendi:", messages);
      const grouped = groupMessagesByDate(messages);
      console.log("Gruplandırılmış mesajlar:", grouped);
      
      // Önceki mesajlar ile karşılaştır
      if (groupedMessages.length > 0) {
        const oldMessageCount = groupedMessages.reduce(
          (sum, group) => sum + group.messages.length, 0
        );
        const newMessageCount = messages.length;
        
        // Yeni mesaj geldiyse ve danışandan geldiyse ses çal
        if (newMessageCount > oldMessageCount && selectedClient) {
          // En son eklenen mesajı bul
          const lastMessage = messages[messages.length - 1];
          
          if (lastMessage.fromClient) {
            console.log("Yeni mesaj bildirim sesi çalınıyor");
            if (audioRef.current) {
              audioRef.current.play().catch(err => console.error("Ses çalma hatası:", err));
            }
            
            // Bildirim göster
            toast({
              title: "Yeni Mesaj",
              description: `${selectedClient.firstName} ${selectedClient.lastName} yeni bir mesaj gönderdi.`,
              duration: 3000
            });
          }
        }
      }
      
      setGroupedMessages(grouped);
    } else {
      console.log("Mesajlar geçerli bir dizi değil veya boş:", messages);
      setGroupedMessages([]);
    }
  }, [messages, groupedMessages, selectedClient, toast]);

  // Mesajların sonuna scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupedMessages]);

  // Danışanları ara
  const filteredClients = useMemo(() => {
    if (!clients || !Array.isArray(clients)) {
      console.log('Danışanlar yüklenemedi veya dizi değil');
      return [];
    }
    
    if (!searchQuery.trim()) {
      return clients;
    }
    
    const searchLower = searchQuery.toLowerCase();
    return clients.filter(client => {
      if (!client) return false;
      const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
      const email = (client.email || '').toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  }, [clients, searchQuery]);

  // Danışanı seç
  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };

  // Danışan adını görüntüle
  const getClientInitials = (client: any): string => {
    if (!client || !client.firstName || !client.lastName) {
      return 'KD'; // "Kullanıcı Danışan" için varsayılan
    }
    return `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
  };

  // Mesaj tarihini formatla
  const formatMessageDate = (dateString: string): string => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'dd MMM HH:mm', { locale: tr });
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
    
    if (isToday(date)) {
      return "Bugün";
    } else if (isYesterday(date)) {
      return "Dün";
    } else {
      return format(date, 'd MMMM yyyy', { locale: tr });
    }
  };

  // Mesaj durumunu görüntüle
  const MessageStatus = ({ status, isRead }: { status?: string, isRead?: boolean }) => {
    // "Görüldü" durumunu göster - çift tik
    if (status === 'read' || isRead) {
      return (
        <div className="flex items-center" title="Görüldü">
          <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
        </div>
      );
    } 
    
    // Teslim edildi - tek tik
    return (
      <div className="flex items-center" title="Gönderildi">
        <Check className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    );
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Mesajlar</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Sol panel: Danışan Listesi */}
        <Card className="col-span-1 border h-full flex flex-col overflow-hidden bg-background shadow-md">
          <CardHeader className="p-4 border-b space-y-2.5 bg-background">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Danışanlar</CardTitle>
              <Badge variant="outline" className="font-normal text-xs">
                {filteredClients.length} danışan
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Danışan ara..." 
                className="pl-9 rounded-full bg-muted/30 border-muted/50 focus-visible:ring-primary/20"
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
                    <ul className="divide-y divide-border/60">
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
                          <li key={client.id} className={`${
                            isActive 
                              ? 'border-l-4 border-l-primary' 
                              : 'border-l-4 border-l-transparent'
                          }`}>
                            <button 
                              className={`w-full py-3.5 px-4 flex items-center space-x-3 transition-colors ${
                                isActive 
                                  ? 'bg-primary/10' 
                                  : 'hover:bg-muted/30'
                              }`}
                              onClick={() => handleClientSelect(client)}
                            >
                              <Avatar className={`h-12 w-12 ${
                                isActive 
                                  ? 'ring-2 ring-primary ring-offset-2' 
                                  : unreadCount > 0 
                                    ? 'ring-1 ring-muted-foreground/30' 
                                    : ''
                              }`}>
                                <AvatarFallback className={`${
                                  isActive 
                                    ? 'bg-primary/20 text-primary font-medium' 
                                    : 'bg-primary/10 text-primary/80'
                                }`}>
                                  {getClientInitials(client)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 text-left overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                  <p className={`font-medium truncate ${
                                    isActive 
                                      ? 'text-primary font-semibold' 
                                      : unreadCount > 0 
                                        ? 'font-semibold' 
                                        : ''
                                  }`}>
                                    {client.firstName} {client.lastName}
                                  </p>
                                  {lastMessage && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap opacity-70">
                                      {formatMessageDate(lastMessage.createdAt)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex justify-between items-center">
                                  <p className={`text-sm truncate max-w-[150px] ${
                                    unreadCount > 0 
                                      ? 'text-foreground font-medium' 
                                      : 'text-muted-foreground'
                                  }`}>
                                    {lastMessage 
                                      ? (lastMessage.fromClient ? '' : 'Sen: ') + lastMessage.message
                                      : 'Henüz mesaj yok'}
                                  </p>
                                  {unreadCount > 0 && (
                                    <Badge 
                                      className="bg-primary text-primary-foreground h-5 min-w-[22px] py-0.5 flex items-center justify-center rounded-full text-[10px] ml-2"
                                      variant="default"
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
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 h-full flex flex-col bg-background shadow-md border">
          {selectedClient ? (
            <>
              {/* Mesajlaşma başlığı */}
              <CardHeader className="flex flex-row items-center p-4 border-b bg-background">
                <Avatar className="h-12 w-12 mr-3 ring-2 ring-primary ring-offset-2">
                  <AvatarFallback className="bg-primary/20 text-primary font-medium">
                    {getClientInitials(selectedClient)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">{selectedClient.firstName} {selectedClient.lastName}</CardTitle>
                      <CardDescription className="text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {selectedClient.email}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {/* Mesaj alanı */}
              <CardContent className="flex-1 p-0 overflow-hidden flex flex-col bg-muted/5">
                <ScrollArea className="flex-1 p-4 px-6" ref={messagesContainerRef}>
                  {messagesLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : groupedMessages.length > 0 ? (
                    <div className="space-y-4">
                      {groupedMessages.map((group, groupIndex) => (
                        <div key={group.date} className="space-y-2">
                          {/* Tarih ayırıcı */}
                          <div className="flex justify-center my-5">
                            <div className="bg-muted/60 px-4 py-1.5 rounded-full text-xs text-muted-foreground font-medium shadow-sm border border-border/10">
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
                                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 flex flex-col 
                                    ${message.fromClient 
                                      ? "bg-muted/70 text-foreground border border-border/20 shadow-sm" 
                                      : "bg-primary/90 text-primary-foreground shadow-md"}
                                    ${isConsecutive
                                      ? message.fromClient 
                                        ? "rounded-tl-md" 
                                        : "rounded-tr-md" 
                                      : ""
                                  }`}
                                >
                                  <div className="break-words text-[15px]">
                                    {message.content}
                                  </div>
                                  <div className={`flex justify-end items-center gap-1.5 mt-1.5 ${
                                    message.fromClient 
                                      ? "text-muted-foreground/70" 
                                      : "text-primary-foreground/80"
                                  }`}>
                                    <span className="text-[11px]">
                                      {formatMessageDate(message.createdAt)}
                                    </span>
                                    {!message.fromClient && (
                                      <MessageStatus status={message.status} isRead={message.isRead} />
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
                  <div className="flex items-end space-x-3">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Mesajınızı yazın..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={sendMessageMutation.isPending}
                        className="flex-1 pr-10 min-h-[50px] rounded-full bg-card border border-border/50 focus-visible:ring-primary/20 shadow-sm"
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
                      className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="bg-muted/30 h-20 w-20 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 text-primary/60" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Mesaj Kutusu</h3>
              <p className="text-muted-foreground max-w-sm">
                Sol panelden bir danışan seçerek mesajlaşmaya başlayabilirsiniz.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// Import should be at the top of the file, this line can be removed
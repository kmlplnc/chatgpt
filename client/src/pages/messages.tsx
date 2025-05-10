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
  Clock 
} from "lucide-react";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MessagesPage() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
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

  // Mesajların sonuna scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

  // Mesaj durumunu görüntüle
  const MessageStatus = ({ status }) => {
    if (status === 'sent') return <Clock className="h-3 w-3 text-gray-400" />;
    if (status === 'delivered') return <Check className="h-3 w-3 text-blue-500" />;
    if (status === 'read') return <CheckCheck className="h-3 w-3 text-blue-500" />;
    return null;
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Mesajlar</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Sol panel: Danışan Listesi */}
        <Card className="col-span-1 border h-full">
          <CardHeader className="p-4">
            <CardTitle>Danışanlar</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Danışan ara..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-290px)]">
              {clientsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div>
                  {filteredClients.length === 0 ? (
                    <p className="text-center text-muted-foreground p-4">Danışan bulunamadı</p>
                  ) : (
                    <ul className="space-y-1">
                      {filteredClients.map(client => {
                        const unreadCount = unreadCounts?.find(c => c.clientId === client.id)?.count || 0;
                        const isActive = selectedClient?.id === client.id;
                        
                        return (
                          <li key={client.id}>
                            <button 
                              className={`w-full p-3 flex items-center space-x-3 hover:bg-slate-50 transition-colors ${isActive ? 'bg-slate-100' : ''}`}
                              onClick={() => handleClientSelect(client)}
                            >
                              <Avatar>
                                <AvatarFallback>{getClientInitials(client)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 text-left">
                                <p className="font-medium truncate">{client.firstName} {client.lastName}</p>
                                <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                              </div>
                              {unreadCount > 0 && (
                                <Badge 
                                  className="bg-primary text-white h-5 min-w-[20px] flex items-center justify-center rounded-full text-xs"
                                >
                                  {unreadCount}
                                </Badge>
                              )}
                            </button>
                            <Separator />
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
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.fromClient ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 flex flex-col ${
                              message.fromClient 
                                ? "bg-slate-100 text-slate-900" 
                                : "bg-primary text-primary-foreground"
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
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Mesajınızı yazın..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={sendMessageMutation.isPending}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
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

// MessageSquare ekleme
import { MessageSquare } from 'lucide-react';
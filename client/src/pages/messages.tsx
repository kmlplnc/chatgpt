import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, Check, CheckCheck, MessageSquare, Trash2 } from "lucide-react";
import { format, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number | string;
  content: string;
  fromClient: boolean;
  createdAt: string;
  isRead?: boolean;
  optimistic?: boolean;
}

interface MessageGroup {
  date: string;
  messages: Message[];
}

function groupMessagesByDate(messages: Message[]): MessageGroup[] {
  if (!messages || messages.length === 0) return [];
  
  // Mesajları tarihe göre grupla
  const groupedByDate = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const messageDate = new Date(message.createdAt);
    const messageDay = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth(),
      messageDate.getDate()
    ).toISOString();

    if (!groups[messageDay]) {
      groups[messageDay] = [];
    }
    groups[messageDay].push(message);
    return groups;
  }, {});

  // Grupları diziye dönüştür ve tarihe göre sırala (en eski tarih en üstte)
  return Object.entries(groupedByDate)
    .map(([date, messages]) => ({
      date,
      messages: messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default function MessagesPage() {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Danışanları getir
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/clients');
      if (!response.ok) throw new Error('Danışanlar getirilemedi');
      return response.json();
    }
  });

  // Seçili danışan için mesajları getir
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['/api/messages', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const response = await apiRequest('GET', `/api/messages/${selectedClient.id}`);
      if (!response.ok) throw new Error('Mesajlar getirilemedi');
      return response.json();
    },
    refetchInterval: 1500,
    enabled: !!selectedClient
  });

  // Mesajları gruplandır
  const groupedMessages = useMemo(() => {
    if (!messages || !Array.isArray(messages)) return [];
    return groupMessagesByDate(messages);
  }, [messages]);

  // Otomatik scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mesaj gönder
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedClient) throw new Error('Lütfen bir danışan seçin');
      const response = await apiRequest('POST', '/api/messages', {
        clientId: selectedClient.id,
        content: text,
        fromClient: false
      });
      if (!response.ok) throw new Error('Mesaj gönderilemedi');
      return response.json();
    },
    onMutate: async (text: string) => {
      // Optimistic: Mesajı hemen ekle
      queryClient.setQueryData(['/api/messages', selectedClient?.id], (old: any[] = []) => [
        ...old,
        {
          id: 'temp-' + Date.now(),
          content: text,
          fromClient: false,
          createdAt: new Date().toISOString(),
          isRead: false,
          optimistic: true,
        }
      ]);
      setNewMessage("");
    },
    onSuccess: (data) => {
      // Gerçek mesajla optimistic olanı değiştir
      queryClient.setQueryData(['/api/messages', selectedClient?.id], (old: any[] = []) =>
        old.map(m => m.optimistic ? data : m)
      );
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
    onError: (err: any, text: string) => {
      setError(err?.message || 'Mesaj gönderilemedi');
      // Hata olursa balonu kaldır
      queryClient.setQueryData(['/api/messages', selectedClient?.id], (old: any[] = []) =>
        old.filter(m => !(m.optimistic && m.content === text))
      );
      toast({ title: "Hata", description: "Mesaj gönderilemedi", variant: "destructive" });
    }
  });

  // Mesaj sil
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest('DELETE', `/api/messages/${messageId}`);
      if (!response.ok) throw new Error('Mesaj silinemedi');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedClient?.id] });
      setDeleteError(null);
      toast({ title: 'Mesaj silindi', description: 'Mesaj başarıyla silindi.' });
    },
    onError: (err: any) => {
      setDeleteError(err?.message || 'Mesaj silinemedi');
      toast({ title: 'Hata', description: err?.message || 'Mesaj silinemedi', variant: 'destructive' });
    }
  });

  // Danışan adını baş harfleri
  const getClientInitials = (client: any) =>
    client && client.firstName && client.lastName
      ? `${client.firstName[0]}${client.lastName[0]}`.toUpperCase()
      : "KD";

  // Mesaj tarihini formatla
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return isToday(date) ? format(date, 'HH:mm') : format(date, 'dd MMM HH:mm', { locale: tr });
  };

  const deleteAllMessagesMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await apiRequest('DELETE', `/api/messages/conversation/${clientId}`);
      if (!response.ok) throw new Error('Sohbet silinemedi');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedClient?.id] });
      setDeleteDialogOpen(false);
      setDeleteError(null);
      toast({ title: 'Sohbet silindi', description: 'Tüm mesajlar başarıyla silindi.' });
    },
    onError: (err: any) => {
      setDeleteError(err?.message || 'Sohbet silinemedi');
      toast({ title: 'Hata', description: err?.message || 'Sohbet silinemedi', variant: 'destructive' });
    }
  });

  return (
    <div className="w-full min-h-screen bg-background flex relative overflow-hidden">
      <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden w-full">
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full flex-1">
            {/* Sol panel: Danışan Listesi */}
            <Card className="col-span-1 border h-full flex flex-col overflow-hidden bg-background/80 backdrop-blur-sm animate-fade-up">
              <CardHeader className="p-3 border-b">
                <CardTitle className="text-lg">Danışanlar</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {clientsLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <ul className="animate-fade-up-delay-1">
                    {clients.map((client: any) => (
                      <li key={client.id}>
                        <button
                          className={`w-full py-2 px-3 flex items-center gap-2 hover:bg-muted/50 ${
                            selectedClient?.id === client.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedClient(client)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {getClientInitials(client)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium tracking-[-0.011em] text-sm">
                            {client.firstName} {client.lastName}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Sağ panel: Mesajlaşma Alanı */}
            <Card className="col-span-2 lg:col-span-3 border h-full flex flex-col overflow-hidden bg-background/80 backdrop-blur-sm animate-fade-up-delay-2">
              {selectedClient ? (
                <>
                  <CardHeader className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getClientInitials(selectedClient)}
                          </AvatarFallback>
                        </Avatar>
                        <CardTitle className="message-header">
                          {selectedClient.firstName} {selectedClient.lastName}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <div className="flex-1 overflow-y-auto">
                    {messagesLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : groupedMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-1 animate-fade-up">
                        <p className="empty-messages">Henüz mesaj yok</p>
                        <p className="empty-messages-subtitle">Danışanınız ile mesajlaşmaya başlayın</p>
                      </div>
                    ) : (
                      <div className="space-y-4 p-4">
                        {groupedMessages.map((group, index) => (
                          <div key={index} className="space-y-2 animate-fade-up-delay-1">
                            <div className="text-center message-timestamp my-2">
                              {formatMessageDate(group.date)}
                            </div>
                            {group.messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.fromClient ? 'justify-start' : 'justify-end'}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-lg p-3 ${
                                    message.fromClient
                                      ? 'bg-slate-100 text-slate-900'
                                      : 'bg-primary text-primary-foreground'
                                  }`}
                                >
                                  <p className="message-content">{message.content}</p>
                                  <p className="message-timestamp">
                                    {new Date(message.createdAt).toLocaleTimeString('tr-TR')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                  <div className="border-t bg-background p-4 animate-fade-up-delay-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newMessage.trim()) {
                          sendMessageMutation.mutate(newMessage);
                        }
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mesajınızı yazın..."
                        className="flex-1 message-input"
                      />
                      <Button
                        type="submit"
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin size-4 border-2 border-current border-t-transparent rounded-full"></div>
                            <span className="back-button-text">Gönderiliyor</span>
                          </div>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            <span className="back-button-text">Gönder</span>
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1 animate-fade-up">
                  <p className="empty-messages">Mesajları görüntülemek için bir danışan seçin</p>
                  <p className="empty-messages-subtitle">Sol menüden bir danışan seçerek mesajlaşmaya başlayabilirsiniz</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sohbeti Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu sohbetteki tüm mesajlar kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <div className="text-red-500 text-sm py-1">{deleteError}</div>}
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAllMessagesMutation.mutate(selectedClient.id)} disabled={deleteAllMessagesMutation.isPending}>
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
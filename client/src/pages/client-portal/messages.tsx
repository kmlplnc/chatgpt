// Bu dosya sıfırlandı. Danışan mesajları arayüzü temizlendi.

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number | string;
  content: string;
  fromClient: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Mesajları getir
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/client-portal/messages'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/client-portal/messages');
      if (!response.ok) throw new Error('Mesajlar getirilemedi');
      return response.json();
    },
    refetchInterval: 1500,
    retry: 1
  });

  // Otomatik scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mesaj gönder
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest('POST', '/api/client-portal/messages', {
        content: text,
        fromClient: true
      });
      if (!response.ok) throw new Error('Mesaj gönderilemedi');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-portal/messages'] });
      setNewMessage("");
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
    onError: (err: any) => {
      setError(err?.message || 'Mesaj gönderilemedi');
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi",
        variant: "destructive"
      });
    }
  });

  const handleGoBack = () => {
    window.location.href = '/client-portal/dashboard';
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      

      <div className="px-4 py-4 relative">
        <div className="pl-4">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="back-button-text">Danışan Portalına Dön</span>
          </Button>
        </div>
        <div className="max-w-3xl mx-auto -mt-4">
          <Card className="shadow-lg backdrop-blur-sm bg-background/80">
            <CardHeader className="border-b bg-card py-3">
              <CardTitle className="message-header">Mesajlar</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col h-[calc(100vh-8rem)]">
                <div className="flex-1 overflow-y-auto">
                  {messagesLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-1">
                      <p className="empty-messages">Henüz mesaj yok</p>
                      <p className="empty-messages-subtitle">Diyetisyeniniz ile mesajlaşmaya başlayın</p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-4">
                      {[...messages].reverse().map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.fromClient ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.fromClient
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            <p className="message-content">{message.content}</p>
                            <p className="message-timestamp">
                              {new Date(message.createdAt).toLocaleTimeString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                <div className="border-t bg-background p-4">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
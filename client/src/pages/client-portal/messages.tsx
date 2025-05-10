import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ClientPortalMessages() {
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Otomatik scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mesajlar</CardTitle>
        <CardDescription>
          Diyetisyeniniz ile mesajlaşın
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4 overflow-y-auto flex-1 pr-4">
              {messages.map((message: any) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.fromClient ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-2 max-w-[80%] ${
                      message.fromClient ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={message.fromClient ? "/avatar-client.png" : "/avatar-dietitian.png"}
                        alt={message.fromClient ? "Danışan" : "Diyetisyen"}
                      />
                      <AvatarFallback>
                        {message.fromClient ? "D" : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-lg p-3 ${
                        message.fromClient
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-xs">
                          {message.fromClient 
                            ? clientData?.firstName 
                            : (dietitian?.name || "Diyetisyen")}
                        </span>
                        <span className="text-xs opacity-70 ml-2">
                          {format(new Date(message.createdAt), 'HH:mm - d MMMM', { locale: tr })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Henüz hiç mesaj yok. Diyetisyeninize mesaj göndererek başlayın.
            </div>
          )}
          
          <div className="border-t pt-4 mt-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Mesajınızı yazın..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[80px]"
              />
              <Button 
                onClick={handleSendMessage} 
                className="self-end"
                disabled={sendMessageMutation.isPending || !newMessage.trim()}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
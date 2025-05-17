import React, { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Message } from "@/types/client";

interface MessageListProps {
  clientId: string;
  messages: Message[];
  isLoading: boolean;
  error: any;
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: (message: string) => void;
}

export function MessageList({
  clientId,
  messages,
  isLoading,
  error,
  newMessage,
  setNewMessage,
  onSendMessage,
}: MessageListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // API fonksiyonları
  async function sendMessage(content: string) {
    const messageData = {
      content,
      clientId: Number(clientId),
      fromClient: false
    };
    const response = await apiRequest("POST", `/api/messages`, messageData);
    if (!response.ok) {
      throw new Error("Mesaj gönderilemedi");
    }
    return response.json();
  }
  
  async function markMessagesAsRead() {
    const clientMessages = messages.filter(m => m.fromClient && !m.isRead);
    if (clientMessages.length === 0) return;
    
    const messageIds = clientMessages.map(m => m.id);
    const response = await apiRequest("PATCH", `/api/messages/mark-read`, { messageIds });
    if (!response.ok) {
      throw new Error("Mesajlar okundu olarak işaretlenemedi");
    }
    return response.json();
  }

  // Mutasyonlar  
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages`, clientId] });
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
  
  const markMessagesAsReadMutation = useMutation({
    mutationFn: markMessagesAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages`, clientId] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
    },
    onError: (error: any) => {
      console.error("Mesajlar okundu olarak işaretlenemedi:", error);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mesajları otomatik olarak okundu olarak işaretle
  useEffect(() => {
    if (!isLoading && messages && messages.length > 0) {
      const hasUnreadMessages = messages.some(m => m.fromClient && !m.isRead);
      if (hasUnreadMessages) {
        markMessagesAsReadMutation.mutate();
      }
    }
  }, [isLoading, messages]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mesajlar yükleniyor...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mesajlar yüklenirken bir hata oluştu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Mesajlar</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.fromClient ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.fromClient
                      ? "bg-gray-100"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.fromClient ? "text-gray-500" : "text-blue-100"
                    }`}
                  >
                    {format(new Date(message.createdAt), "d MMMM yyyy HH:mm", {
                      locale: tr,
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Mesajınızı yazın..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && newMessage.trim()) {
                onSendMessage(newMessage);
              }
            }}
          />
          <Button
            onClick={() => {
              if (newMessage.trim()) {
                onSendMessage(newMessage);
              }
            }}
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
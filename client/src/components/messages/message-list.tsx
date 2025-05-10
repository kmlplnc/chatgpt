import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

interface MessageListProps {
  clientId: string | number;
  messages: any[];
  isLoading: boolean;
  error: Error | null;
  newMessage: string;
  setNewMessage: (value: string) => void;
}

export function MessageList({
  clientId,
  messages,
  isLoading,
  error,
  newMessage,
  setNewMessage,
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

  // Otomatik scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
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

  return (
    <div className="flex flex-col h-[400px]">
      {isLoading ? (
        <div className="flex items-center justify-center p-4 flex-1">
          <div className="flex items-center gap-2">
            <div className="animate-spin size-5 border-2 border-primary border-t-transparent rounded-full"></div>
            <span>Mesajlar yükleniyor...</span>
          </div>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>
            Mesajlar yüklenirken bir hata oluştu: {error.message}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-lg">
            {messages && messages.length > 0 ? (
              messages.map((message: any) => (
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
                    <p>{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(message.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground p-4">
                <p>Henüz mesaj yok</p>
                <p className="text-sm">Danışan ile mesajlaşmaya başlamak için bir mesaj gönderin.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex gap-2">
            <Textarea 
              placeholder="Mesajınızı yazın..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => {
                if (newMessage.trim()) {
                  sendMessageMutation.mutate(newMessage);
                }
              }}
              disabled={sendMessageMutation.isPending || !newMessage.trim()}
            >
              {sendMessageMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin size-4 border-2 border-current border-t-transparent rounded-full"></div>
                  <span>Gönderiliyor</span>
                </div>
              ) : (
                <span>Gönder</span>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
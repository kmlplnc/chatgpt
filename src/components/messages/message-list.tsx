import React, { useEffect, useRef } from 'react';
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface MessageListProps {
  clientId: string | number;
  messages: any[];
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Otomatik scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Hata</h3>
        <p className="text-red-600 mt-1">Mesajlar yüklenirken bir hata oluştu: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Mesajlar</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 p-4">
              <p>Henüz mesaj yok</p>
              <p className="text-sm">Danışan ile mesajlaşmaya başlamak için bir mesaj gönderin.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.fromClient ? "justify-start" : "justify-end"}`}
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
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mesajınızı yazın..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && newMessage.trim()) {
                onSendMessage(newMessage.trim());
              }
            }}
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              if (newMessage.trim()) {
                onSendMessage(newMessage.trim());
              }
            }}
            disabled={!newMessage.trim()}
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
} 
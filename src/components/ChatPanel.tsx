import React, { useRef, useEffect } from "react";
import { CardContent } from "../../client/src/components/ui/card";
import { Input } from "../../client/src/components/ui/input";
import { Button } from "../../client/src/components/ui/button";
import { Send } from "lucide-react";

const ChatPanel = ({ messages, currentUser, newMessage, setNewMessage, handleSendMessage }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input after sending a message
  useEffect(() => {
    inputRef.current?.focus();
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="flex flex-col gap-4 justify-end min-h-full">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground opacity-60 mt-8">Henüz mesaj yok.</div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === currentUser?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.senderId === currentUser?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Input Area */}
      <div className="border-t p-4 flex items-center gap-2 bg-background">
        <Input
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          placeholder="Mesajınızı yazın..."
          className="flex-1"
        />
        <Button onClick={handleSendMessage} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel; 
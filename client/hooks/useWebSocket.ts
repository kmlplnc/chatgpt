import React from 'react';
import { useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface WebSocketMessage {
  type: 'NEW_MESSAGE' | 'BROADCAST';
  data: {
    senderName: string;
    senderAvatar?: string;
    content: string;
  };
}

const NotificationToast = React.forwardRef<HTMLDivElement, {
  visible: boolean;
  senderName: string;
  senderAvatar?: string;
  content: string;
  onView: () => void;
}>(({ visible, senderName, senderAvatar, content, onView }, ref) => (
  <div
    ref={ref}
    className={`${
      visible ? 'animate-enter' : 'animate-leave'
    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
  >
    <div className="flex-1 w-0 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <img
            className="h-10 w-10 rounded-full"
            src={senderAvatar || '/default-avatar.png'}
            alt=""
          />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {senderName}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {content}
          </p>
        </div>
      </div>
    </div>
    <div className="flex border-l border-gray-200">
      <button
        onClick={onView}
        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Görüntüle
      </button>
    </div>
  </div>
));

export function useWebSocket(userId: string, userType: 'client' | 'dietitian') {
  const connect = useCallback(() => {
    const ws = new WebSocket(
      `ws://localhost:5000?userId=${userId}&userType=${userType}`
    );

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'NEW_MESSAGE':
            toast.custom((t) => (
              <NotificationToast
                visible={t.visible}
                senderName={message.data.senderName}
                senderAvatar={message.data.senderAvatar}
                content={message.data.content}
                onView={() => {
                  toast.dismiss(t.id);
                  window.location.href = '/messages';
                }}
              />
            ));
            break;

          case 'BROADCAST':
            toast(message.data.content);
            break;
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(connect, 5000);
    };

    return ws;
  }, [userId, userType]);

  useEffect(() => {
    const ws = connect();
    return () => {
      ws.close();
    };
  }, [connect]);
} 
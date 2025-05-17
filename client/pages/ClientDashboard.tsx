import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket'; // .tsx extension is now used, but import path remains the same in most bundlers
import { Toaster } from 'react-hot-toast';

export function ClientDashboard() {
  // Kullanıcı ID'sini ve tipini gerçek uygulamada auth sisteminden almalısınız
  const userId = "current-user-id"; // Bu kısmı gerçek kullanıcı ID'si ile değiştirin
  useWebSocket(userId, 'client');

  return (
    <div>
      <Toaster position="top-right" />
      {/* Mevcut dashboard içeriği */}
    </div>
  );
} 
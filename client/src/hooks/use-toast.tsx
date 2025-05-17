import { useCallback } from 'react';

interface ToastOptions {
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    // Implement your toast notification logic here
    console.log('Toast:', options);
  }, []);

  return { toast };
} 
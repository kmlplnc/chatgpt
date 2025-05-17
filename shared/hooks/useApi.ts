import { useState } from 'react';
import { createErrorHandler } from '../utils/errorHandler';

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const execute = async (
    request: () => Promise<T>,
    context: string
  ) => {
    setState({ data: null, error: null, loading: true });
    
    try {
      const data = await request();
      setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      const errorHandler = createErrorHandler(context);
      errorHandler(error);
      setState({ data: null, error: error as Error, loading: false });
      throw error;
    }
  };

  return {
    ...state,
    execute,
  };
} 
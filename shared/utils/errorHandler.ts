import { toast } from 'react-hot-toast';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorMessages = {
  DATABASE_ERROR: 'Veritabanı işlemi sırasında bir hata oluştu.',
  NETWORK_ERROR: 'Ağ bağlantısında bir sorun oluştu.',
  AUTH_ERROR: 'Kimlik doğrulama hatası.',
  VALIDATION_ERROR: 'Geçersiz veri girişi.',
  UNKNOWN_ERROR: 'Beklenmeyen bir hata oluştu.',
} as const;

export const handleError = (error: unknown) => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    toast.error(error.message);
    return;
  }

  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }

  toast.error(errorMessages.UNKNOWN_ERROR);
};

export const logError = (error: unknown, context?: string) => {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  };

  // Burada hata loglarını bir servise gönderebilir veya dosyaya yazabilirsiniz
  console.error('Error Log:', errorLog);
  
  // TODO: Hata loglarını bir servise gönder (örn: Sentry, LogRocket vb.)
};

export const createErrorHandler = (context: string) => {
  return (error: unknown) => {
    logError(error, context);
    handleError(error);
  };
}; 
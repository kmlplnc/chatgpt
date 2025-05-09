import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

// Kullanıcı tipi tanımı
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  name?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
}

// AuthContext için state tipi
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isPremium: boolean;
}

// AuthContext için context tipi
interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkSubscription: () => Promise<boolean>;
}

// Kayıt verisi tipi
interface RegisterData {
  username: string;
  email: string;
  password: string;
  name?: string;
}

// Context oluştur
const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider bileşeni
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
    isPremium: false
  });
  
  const { toast } = useToast();

  // Kullanıcı durumunu kontrol et (uygulama başladığında)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/me');
        
        if (response.ok) {
          const user = await response.json();
          setState({
            user,
            isLoading: false,
            error: null,
            isAuthenticated: true,
            isPremium: isUserPremium(user)
          });
        } else {
          setState({
            user: null,
            isLoading: false,
            error: null,
            isAuthenticated: false,
            isPremium: false
          });
        }
      } catch (error) {
        setState({
          user: null,
          isLoading: false,
          error: 'Kimlik doğrulama durumu kontrol edilirken bir hata oluştu',
          isAuthenticated: false,
          isPremium: false
        });
      }
    };

    checkAuth();
  }, []);
  
  // Kullanıcının premium olup olmadığını kontrol et
  const isUserPremium = (user: User): boolean => {
    if (!user) return false;
    
    // Premium planlar
    const premiumPlans = ['basic', 'premium', 'pro'];
    
    // Abonelik aktif mi ve premium plan mı?
    return (
      user.subscriptionStatus === 'active' && 
      user.subscriptionEndDate && 
      new Date(user.subscriptionEndDate) > new Date() && 
      user.subscriptionPlan && 
      premiumPlans.includes(user.subscriptionPlan)
    );
  };

  // Giriş işlemi
  const login = async (username: string, password: string) => {
    setState({ ...state, isLoading: true, error: null });
    
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Giriş başarısız');
      }
      
      const user = await response.json();
      
      setState({
        user,
        isLoading: false,
        error: null,
        isAuthenticated: true,
        isPremium: isUserPremium(user)
      });
      
      toast({
        title: 'Giriş başarılı',
        description: 'Hoş geldiniz!',
      });
    } catch (error: any) {
      setState({
        ...state,
        isLoading: false,
        error: error.message,
        user: null,
        isAuthenticated: false,
        isPremium: false
      });
      
      toast({
        title: 'Giriş başarısız',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Kayıt işlemi
  const register = async (userData: RegisterData) => {
    setState({ ...state, isLoading: true, error: null });
    
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kayıt başarısız');
      }
      
      const user = await response.json();
      
      setState({
        user,
        isLoading: false,
        error: null,
        isAuthenticated: true,
        isPremium: false // Yeni kayıtlar her zaman free olarak başlar
      });
      
      toast({
        title: 'Kayıt başarılı',
        description: 'Hesabınız oluşturuldu!',
      });
    } catch (error: any) {
      setState({
        ...state,
        isLoading: false,
        error: error.message,
        user: null,
        isAuthenticated: false,
        isPremium: false
      });
      
      toast({
        title: 'Kayıt başarısız',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Çıkış işlemi
  const logout = async () => {
    setState({ ...state, isLoading: true });
    
    try {
      await apiRequest('POST', '/api/auth/logout');
      
      setState({
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
        isPremium: false
      });
      
      toast({
        title: 'Çıkış başarılı',
        description: 'Güvenli bir şekilde çıkış yaptınız',
      });
    } catch (error: any) {
      setState({
        ...state,
        isLoading: false,
        error: error.message
      });
      
      toast({
        title: 'Çıkış yapılırken hata oluştu',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Abonelik durumunu kontrol et
  const checkSubscription = async (): Promise<boolean> => {
    if (!state.isAuthenticated) {
      return false;
    }
    
    try {
      const response = await apiRequest('GET', '/api/subscription/status');
      
      if (response.ok) {
        const subscription = await response.json();
        const isPremium = subscription.status === 'active';
        
        // State'i güncelle
        setState({ ...state, isPremium });
        
        return isPremium;
      }
      
      return false;
    } catch (error) {
      console.error('Abonelik durumu kontrol edilirken hata:', error);
      return false;
    }
  };

  // Context değerini oluştur
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    checkSubscription
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth hook, AuthProvider içinde kullanılmalıdır');
  }
  
  return context;
}
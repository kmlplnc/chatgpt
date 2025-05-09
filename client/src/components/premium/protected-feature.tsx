import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import FeatureLock from './feature-lock';

interface ProtectedFeatureProps {
  children: ReactNode;
  featureName?: string;
  fallback?: ReactNode;
}

/**
 * ProtectedFeature bileşeni, premium özelliklerini korumak için kullanılır.
 * Kullanıcı premium değilse, FeatureLock bileşeni gösterilir.
 */
export default function ProtectedFeature({ 
  children, 
  featureName, 
  fallback
}: ProtectedFeatureProps) {
  const { isPremium } = useAuth();
  
  if (isPremium) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return <FeatureLock featureName={featureName} />;
}
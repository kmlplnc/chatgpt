import React from 'react';
import { useLocation } from 'wouter';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureLockProps {
  title?: string;
  description?: string;
  featureName?: string;
}

export default function FeatureLock({
  title = 'Premium Özellik',
  description = 'Bu özelliği kullanabilmek için premium abonelik gerekiyor.',
  featureName
}: FeatureLockProps) {
  const [location, navigate] = useLocation();

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-center">{title}</CardTitle>
          <CardDescription className="text-center">
            {featureName ? `${featureName} özelliği premium aboneler için ayrılmıştır.` : description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-2 text-muted-foreground">
          <p>Premium abonelik avantajları:</p>
          <ul className="space-y-1">
            <li>• Sınırsız danışan yönetimi</li>
            <li>• Tam detaylı beslenme veritabanı erişimi</li>
            <li>• Gelişmiş ölçüm raporları</li>
            <li>• Diyet planı oluşturma araçları</li>
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            className="w-full sm:w-auto sm:flex-1" 
            onClick={() => navigate('/subscription')}
          >
            Abonelik Planları
          </Button>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto sm:flex-1"
            onClick={() => window.history.back()}
          >
            Geri Dön
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
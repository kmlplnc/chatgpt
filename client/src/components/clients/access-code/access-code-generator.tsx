import React, { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, RefreshCw } from 'lucide-react';

interface AccessCodeGeneratorProps {
  clientId: number;
  clientName: string;
  existingCode?: string;
  onCodeGenerated?: (code: string) => void;
}

export function AccessCodeGenerator({
  clientId,
  clientName,
  existingCode,
  onCodeGenerated
}: AccessCodeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [accessCode, setAccessCode] = useState(existingCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  
  async function generateNewCode() {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', `/api/clients/${clientId}/access-code`, {});
      
      if (!response.ok) {
        throw new Error('Erişim kodu oluşturulamadı');
      }
      
      const data = await response.json();
      setAccessCode(data.accessCode);
      
      if (onCodeGenerated) {
        onCodeGenerated(data.accessCode);
      }
      
      toast({
        title: 'Erişim kodu oluşturuldu',
        description: 'Danışan için yeni erişim kodu oluşturuldu.',
      });
    } catch (error) {
      console.error('Error generating access code:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Erişim kodu oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  function copyToClipboard() {
    navigator.clipboard.writeText(accessCode).then(
      () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast({
          title: 'Kopyalandı',
          description: 'Erişim kodu panoya kopyalandı.',
        });
      },
      () => {
        toast({
          title: 'Kopyalanamadı',
          description: 'Panoya kopyalama işlemi başarısız oldu.',
          variant: 'destructive',
        });
      }
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {existingCode ? 'Erişim Kodu Göster' : 'Erişim Kodu Oluştur'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Danışan Erişim Kodu</DialogTitle>
          <DialogDescription>
            {clientName} için danışan portalı erişim kodu {existingCode ? 'bilgisi' : 'oluşturun'}.
            Bu kodu danışanınızla paylaşın.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="access-code">Erişim Kodu</Label>
            <div className="flex items-center gap-2">
              <Input
                id="access-code"
                value={accessCode}
                readOnly
                placeholder="Henüz kod oluşturulmadı"
                className="text-center tracking-widest text-lg uppercase font-medium"
              />
              {accessCode && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={copyToClipboard} 
                  disabled={!accessCode || isLoading}
                >
                  {isCopied ? (
                    <span className="text-green-500 text-xs">✓</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
          {accessCode && (
            <div className="text-sm text-muted-foreground">
              Bu kodu danışanınıza gönderin. Danışanınız bu kod ile portala giriş yapabilecek.
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={generateNewCode} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {accessCode ? 'Yeni Kod Oluştur' : 'Kod Oluştur'}
              </>
            )}
          </Button>
          <Button type="button" variant="default" onClick={() => setIsOpen(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Client detail sayfasına eklenecek kod
import { AccessCodeGenerator } from '@/components/clients/access-code/access-code-generator';

// Diğer butonların yanına erişim kodu butonunu ekle
<AccessCodeGenerator 
  clientId={client.id} 
  clientName={`${client.firstName} ${client.lastName}`}
  existingCode={client.accessCode}
  onCodeGenerated={(code) => {
    // İstenirse burada state güncellenebilir
  }}
/>

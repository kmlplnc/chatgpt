import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AppointmentDialogProps {
  clientId: string | number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAppointment?: any;
  isEdit?: boolean;
}

export function AppointmentDialog({
  clientId,
  open,
  onOpenChange,
  selectedAppointment,
  isEdit = false,
}: AppointmentDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // API fonksiyonları
  async function createAppointment(data: any) {
    const appointmentData = {
      ...data,
      clientId: Number(clientId),
    };
    const response = await apiRequest("POST", "/api/appointments", appointmentData);
    if (!response.ok) {
      throw new Error("Randevu oluşturulamadı");
    }
    return response.json();
  }

  async function updateAppointment(data: any) {
    const response = await apiRequest("PATCH", `/api/appointments/${selectedAppointment.id}`, data);
    if (!response.ok) {
      throw new Error("Randevu güncellenemedi");
    }
    return response.json();
  }

  // Mutasyonlar
  const createAppointmentMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/appointments`, clientId] });
      toast({
        title: "Başarılı",
        description: "Yeni randevu oluşturuldu",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: updateAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/appointments`, clientId] });
      toast({
        title: "Başarılı",
        description: "Randevu güncellendi",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    // Tarihleri doğru formata dönüştür
    const dateStr = formData.get('date') as string;
    const startTimeStr = formData.get('startTime') as string;
    const endTimeStr = formData.get('endTime') as string;
    
    // ISO formatında tam tarih-saat oluştur
    const startDateTime = new Date(`${dateStr}T${startTimeStr}`);
    const endDateTime = new Date(`${dateStr}T${endTimeStr}`);
    
    const appointmentData = {
      title: formData.get('title') as string,
      clientId: Number(clientId),
      date: startDateTime.toISOString(),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      status: formData.get('status') as string || "pending",
      notes: formData.get('notes') as string || null
    };
    
    console.log("Gönderilen randevu verileri:", appointmentData);
    
    if (isEdit) {
      updateAppointmentMutation.mutate(appointmentData);
    } else {
      createAppointmentMutation.mutate(appointmentData);
    }
  };

  // Formatla saat değerlerini
  const formatTimeForInput = (timeString: string) => {
    try {
      const time = new Date(timeString);
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Randevu Düzenle' : 'Yeni Randevu Oluştur'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Randevu bilgilerini düzenleyin.' : 'Danışan için yeni bir randevu oluşturun.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="title">Başlık</Label>
              <Input 
                id="title" 
                name="title" 
                defaultValue={isEdit ? selectedAppointment?.title : ''} 
                placeholder="Randevu başlığı" 
                required 
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="date">Tarih</Label>
              <Input 
                id="date" 
                name="date" 
                type="date" 
                defaultValue={isEdit && selectedAppointment?.date 
                  ? new Date(selectedAppointment.date).toISOString().split('T')[0] 
                  : new Date().toISOString().split('T')[0]} 
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Başlangıç Saati</Label>
                <Input 
                  id="startTime" 
                  name="startTime" 
                  type="time" 
                  defaultValue={isEdit && selectedAppointment?.startTime 
                    ? formatTimeForInput(selectedAppointment.startTime)
                    : ''}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="endTime">Bitiş Saati</Label>
                <Input 
                  id="endTime" 
                  name="endTime" 
                  type="time" 
                  defaultValue={isEdit && selectedAppointment?.endTime 
                    ? formatTimeForInput(selectedAppointment.endTime)
                    : ''}
                  required 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="status">Durum</Label>
              <Select name="status" defaultValue={isEdit ? selectedAppointment?.status : 'pending'}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="confirmed">Onaylandı</SelectItem>
                  <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                defaultValue={isEdit ? selectedAppointment?.notes : ''} 
                placeholder="Randevu hakkında notlar" 
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isEdit ? updateAppointmentMutation.isPending : createAppointmentMutation.isPending}
            >
              {isEdit 
                ? (updateAppointmentMutation.isPending ? "Güncelleniyor..." : "Güncelle") 
                : (createAppointmentMutation.isPending ? "Oluşturuluyor..." : "Randevu Oluştur")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
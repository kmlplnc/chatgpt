import React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';

const appointmentFormSchema = z.object({
  title: z.string().min(3, { message: 'Başlık en az 3 karakter olmalıdır' }),
  description: z.string().optional(),
  appointmentDate: z.date({ required_error: 'Lütfen bir tarih seçin' }),
  appointmentTime: z.string({ required_error: 'Lütfen bir saat seçin' }),
  durationMinutes: z.string().transform(val => parseInt(val, 10)),
  status: z.enum(['bekleyen', 'onaylanmış', 'iptal edilmiş', 'tamamlanmış']),
  location: z.string().optional(),
  notes: z.string().optional(),
  clientId: z.number({ required_error: 'Lütfen bir danışan seçin' }),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
  clients: { id: number; firstName: string; lastName: string }[];
  initialData?: Partial<AppointmentFormValues>;
  onSubmit: (data: AppointmentFormValues) => void;
  onCancel: () => void;
}

export function AppointmentForm({ 
  clients, 
  initialData, 
  onSubmit, 
  onCancel 
}: AppointmentFormProps) {
  const { toast } = useToast();
  
  // Form default değerleri
  const defaultValues: Partial<AppointmentFormValues> = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    appointmentDate: initialData?.appointmentDate || new Date(),
    appointmentTime: initialData?.appointmentTime || '09:00',
    durationMinutes: initialData?.durationMinutes?.toString() || '60',
    status: initialData?.status || 'bekleyen',
    location: initialData?.location || '',
    notes: initialData?.notes || '',
    clientId: initialData?.clientId,
  };

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues,
  });

  function handleSubmit(data: AppointmentFormValues) {
    try {
      onSubmit(data);
      toast({
        title: 'Randevu kaydedildi',
        description: 'Randevu bilgileri başarıyla kaydedildi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Randevu kaydedilirken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Danışan</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value, 10))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Danışan seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.firstName} {client.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Başlık</FormLabel>
              <FormControl>
                <Input placeholder="Randevu başlığı" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama</FormLabel>
              <FormControl>
                <Textarea placeholder="Randevu açıklaması (isteğe bağlı)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="appointmentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tarih</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: tr })
                        ) : (
                          <span>Tarih seçin</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appointmentTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saat</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Input type="time" {...field} />
                    <Clock className="ml-2 h-4 w-4 opacity-50" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="durationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Süre (dakika)</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Süre seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="30">30 dakika</SelectItem>
                    <SelectItem value="45">45 dakika</SelectItem>
                    <SelectItem value="60">60 dakika</SelectItem>
                    <SelectItem value="90">90 dakika</SelectItem>
                    <SelectItem value="120">2 saat</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durum</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bekleyen">Bekleyen</SelectItem>
                    <SelectItem value="onaylanmış">Onaylanmış</SelectItem>
                    <SelectItem value="iptal edilmiş">İptal Edilmiş</SelectItem>
                    <SelectItem value="tamamlanmış">Tamamlanmış</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konum</FormLabel>
              <FormControl>
                <Input placeholder="Randevu konumu (isteğe bağlı)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Textarea placeholder="Randevu notları (isteğe bağlı)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button type="submit">
            Kaydet
          </Button>
        </div>
      </form>
    </Form>
  );
}

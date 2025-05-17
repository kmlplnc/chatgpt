import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  appointment?: any;
  isLoading?: boolean;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  onSubmit,
  appointment,
  isLoading
}: AppointmentDialogProps) {
  const [formData, setFormData] = React.useState({
    type: appointment?.type || '',
    date: appointment?.date ? format(new Date(appointment.date), 'yyyy-MM-dd') : '',
    time: appointment?.time || '',
    duration: appointment?.duration || 60,
    notes: appointment?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Randevu Düzenle' : 'Yeni Randevu'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Randevu Türü</label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Randevu türü seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Danışma</SelectItem>
                <SelectItem value="followup">Kontrol</SelectItem>
                <SelectItem value="measurement">Ölçüm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tarih</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Saat</label>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Süre (dakika)</label>
            <Select
              value={String(formData.duration)}
              onValueChange={(value) => setFormData({ ...formData, duration: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Süre seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dakika</SelectItem>
                <SelectItem value="45">45 dakika</SelectItem>
                <SelectItem value="60">60 dakika</SelectItem>
                <SelectItem value="90">90 dakika</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notlar</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Randevu ile ilgili notlar..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : appointment ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
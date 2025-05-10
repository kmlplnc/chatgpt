import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const appointmentsRouter = Router();

// Middleware: Kimlik doğrulama gerektiren işlemler için
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Oturum açmanız gerekiyor' });
  }
  next();
};

// Tüm randevuları getir (kullanıcıya ya da danışana göre filtrelenmiş)
appointmentsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { clientId, startDate, endDate, status } = req.query;
    const userId = req.session.user?.id;
    
    const appointments = await storage.getAppointments({ 
      userId,
      clientId: clientId ? parseInt(clientId as string) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string | undefined
    });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Randevular getirilirken bir hata oluştu' });
  }
});

// Belirli bir randevuyu getir
appointmentsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const appointment = await storage.getAppointment(id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Randevu bulunamadı' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Randevu getirilirken bir hata oluştu' });
  }
});

// Yeni randevu oluştur
appointmentsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const appointmentData = req.body;
    // İstediğimiz zaman şemasını ekleyebiliriz
    // const data = appointmentSchema.parse(appointmentData);
    
    const appointment = await storage.createAppointment({
      ...appointmentData,
      createdBy: req.session.user!.id,
    });
    
    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Randevu oluşturulurken bir hata oluştu' });
  }
});

// Randevu güncelle
appointmentsRouter.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const appointment = await storage.updateAppointment(id, updates);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Randevu bulunamadı' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Randevu güncellenirken bir hata oluştu' });
  }
});

// Randevu sil
appointmentsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await storage.deleteAppointment(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Randevu bulunamadı' });
    }
    
    res.json({ message: 'Randevu başarıyla silindi' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Randevu silinirken bir hata oluştu' });
  }
});

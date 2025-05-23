import { Request, Response, Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertAppointmentSchema, insertNotificationSchema } from "@shared/schema";

const appointmentsRouter = Router();

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
  }
  next();
};

// Get appointments with filters
appointmentsRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    
    let appointments;
    if (clientId) {
      // Belirli bir danışanın randevuları 
      appointments = await storage.getAppointments(clientId);
    } else {
      // Kullanıcının tüm randevuları
      appointments = await storage.getAppointments();
    }
    
    res.json(appointments);
  } catch (error) {
    console.error("Randevular getirilemedi:", error);
    res.status(500).json({ message: "Randevular getirilemedi" });
  }
});

// Get specific appointment
appointmentsRouter.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const appointmentId = Number(req.params.id);
    const appointment = await storage.getAppointment(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: "Randevu bulunamadı" });
    }
    
    // Kullanıcının sadece kendi randevularına erişimi olmalı
    if (appointment.userId !== req.session.user!.id) {
      return res.status(403).json({ message: "Bu randevuya erişim izniniz yok" });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error("Randevu detayı getirilemedi:", error);
    res.status(500).json({ message: "Randevu detayı getirilemedi" });
  }
});

// Create appointment
appointmentsRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    console.log("Session user:", req.session.user);
    console.log("Randevu verisi:", JSON.stringify(req.body, null, 2));
    
    // ÇAKIŞMA KONTROLÜ EKLE (startTime üzerinden)
    const allAppointments = await storage.getUserAppointments(req.session.user!.id);
    const isConflict = allAppointments.some(a => {
      if (!a.startTime || !req.body.startTime) return false;
      const aDate = new Date(a.startTime).toISOString().split('T')[0];
      const aHourMin = new Date(a.startTime).toISOString().substring(11, 16);
      const reqDate = new Date(req.body.startTime).toISOString().split('T')[0];
      const reqHourMin = new Date(req.body.startTime).toISOString().substring(11, 16);
      return aDate === reqDate && aHourMin === reqHourMin;
    });

    if (isConflict) {
      return res.status(409).json({ message: "Bu saat dilimi dolu. Lütfen başka bir saat seçin." });
    }
    
    // String tarihleri Date nesnelerine dönüştür
    const { userId: _, ...restBody } = req.body; // userId'yi request body'den çıkar
    const formattedData = {
      ...restBody,
      userId: req.session.user!.id, // Her zaman session'daki UUID'yi kullan
      date: req.body.date ? new Date(req.body.date) : undefined,
      startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
      endTime: req.body.endTime ? new Date(req.body.endTime) : undefined
    };
    
    // Validate request body
    const appointmentData = insertAppointmentSchema.parse(formattedData);
    
    console.log("Onaylanmış randevu verisi:", JSON.stringify(appointmentData, null, 2));
    
    // Create appointment
    const appointment = await storage.createAppointment(appointmentData);
    
    // Randevu oluşturulduktan sonra hatırlatma bildirimleri için zamanlanmış görevler oluştur
    try {
      const appointmentDate = new Date(appointment.date);
      const client = await storage.getClient(appointment.clientId);
      
      if (!client) {
        console.warn(`Client with ID ${appointment.clientId} not found for appointment reminders`);
      } else {
        // 1 gün öncesi için hatırlatma
        const oneDayBefore = new Date(appointmentDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);
        
        // Şimdiki zamandan sonra ise bildirimi oluştur
        if (oneDayBefore > new Date()) {
          await storage.createNotification({
            userId: appointment.userId,
            clientId: appointment.clientId,
            title: "Randevu Hatırlatması",
            content: `${client.first_name} ${client.last_name} ile ${new Date(appointment.date).toLocaleDateString('tr-TR')} ${new Date(appointment.startTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})} tarihinde randevunuz var.`,
            type: "appointment",
            relatedId: appointment.id,
            isRead: false,
            scheduledFor: oneDayBefore
          });
        }
        
        // 1 saat öncesi için hatırlatma
        const oneHourBefore = new Date(appointmentDate);
        oneHourBefore.setHours(oneHourBefore.getHours() - 1);
        
        // Şimdiki zamandan sonra ise bildirimi oluştur
        if (oneHourBefore > new Date()) {
          await storage.createNotification({
            userId: appointment.userId,
            clientId: appointment.clientId,
            title: "Randevu Hatırlatması",
            content: `${client.first_name} ${client.last_name} ile bugün ${new Date(appointment.startTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})} saatinde randevunuz var.`,
            type: "appointment",
            relatedId: appointment.id,
            isRead: false,
            scheduledFor: oneHourBefore
          });
        }
      }
    } catch (notifError) {
      console.error("Randevu hatırlatma bildirimleri oluşturulamadı:", notifError);
      // Bildirimler oluşturulamazsa bile randevu kaydedilmiş olacak
    }
    
    res.status(201).json(appointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod Validasyon Hatası:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ message: "Geçersiz randevu bilgileri", errors: error.errors });
    }
    
    console.error("Randevu oluşturulamadı:", error);
    res.status(500).json({ message: "Randevu oluşturulamadı" });
  }
});

// Update appointment
appointmentsRouter.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const appointmentId = Number(req.params.id);
    const appointment = await storage.getAppointment(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: "Randevu bulunamadı" });
    }
    // Sadece randevuyu oluşturan kullanıcı güncelleyebilir
    if (appointment.userId !== req.session.user!.id) {
      return res.status(403).json({ message: "Bu randevuyu güncelleme izniniz yok" });
    }
    // String tarihleri Date nesnelerine dönüştür
    const formattedData = {
      ...req.body,
      userId: req.session.user!.id, // Her zaman session'daki UUID'yi kullan
      date: req.body.date ? new Date(req.body.date) : undefined,
      startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
      endTime: req.body.endTime ? new Date(req.body.endTime) : undefined
    };
    console.log("Güncellenen randevu verisi:", JSON.stringify(formattedData, null, 2));
    // Update appointment
    const updatedAppointment = await storage.updateAppointment(appointmentId, formattedData);
    res.json(updatedAppointment);
  } catch (error) {
    console.error("Randevu güncellenemedi:", error);
    if (error instanceof z.ZodError) {
      console.error("Zod Validasyon Hatası:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ message: "Geçersiz randevu bilgileri", errors: error.errors });
    }
    res.status(500).json({ message: "Randevu güncellenemedi" });
  }
});

// Delete appointment
appointmentsRouter.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const appointmentId = Number(req.params.id);
    // Önce randevuyu bul
    const appointment = await storage.getAppointment(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Randevu bulunamadı" });
    }
    // Kullanıcının sadece kendi randevularına erişimi olmalı
    if (appointment.userId !== req.session.user!.id) {
      return res.status(403).json({ message: "Bu randevuyu silme izniniz yok" });
    }
    await storage.deleteAppointment(appointmentId);
    res.json({ message: "Randevu başarıyla silindi" });
  } catch (error) {
    console.error("Randevu silinemedi:", error);
    res.status(500).json({ message: "Randevu silinemedi" });
  }
});

export default appointmentsRouter;
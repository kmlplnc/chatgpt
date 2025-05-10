import { Request, Response, Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertAppointmentSchema } from "@shared/schema";

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
    const { clientId } = req.query;
    
    let appointments;
    if (clientId) {
      appointments = await storage.getAppointments(Number(clientId), userId);
    } else {
      appointments = await storage.getAppointments(undefined, userId);
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
    const appointment = await storage.getAppointmentById(appointmentId);
    
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
    console.log("Randevu verisi:", JSON.stringify(req.body, null, 2));
    
    // String tarihleri Date nesnelerine dönüştür
    const formattedData = {
      ...req.body,
      userId: req.session.user!.id,
      date: req.body.date ? new Date(req.body.date) : undefined,
      startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
      endTime: req.body.endTime ? new Date(req.body.endTime) : undefined
    };
    
    // Validate request body
    const appointmentData = insertAppointmentSchema.parse(formattedData);
    
    console.log("Onaylanmış randevu verisi:", JSON.stringify(appointmentData, null, 2));
    
    // Create appointment
    const appointment = await storage.createAppointment(appointmentData);
    
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
    const appointment = await storage.getAppointmentById(appointmentId);
    
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
    const appointment = await storage.getAppointmentById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: "Randevu bulunamadı" });
    }
    
    // Sadece randevuyu oluşturan kullanıcı silebilir
    if (appointment.userId !== req.session.user!.id) {
      return res.status(403).json({ message: "Bu randevuyu silme izniniz yok" });
    }
    
    await storage.deleteAppointment(appointmentId);
    
    res.status(204).end();
  } catch (error) {
    console.error("Randevu silinemedi:", error);
    res.status(500).json({ message: "Randevu silinemedi" });
  }
});

export default appointmentsRouter;
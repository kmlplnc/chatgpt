import { Request, Response, Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertClientSchema, insertMeasurementSchema, updateClientSchema, clients, measurements } from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "../db";
import { eq } from "drizzle-orm";
import type { Client } from "@shared/schema";

// Create Drizzle database instance
const db = drizzle(pool);

const clientsRouter = Router();

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
  }
  next();
};

// Admin kullanıcı olup olmadığını kontrol eder
const isAdmin = (req: Request): boolean => {
  return req.session?.user?.role === 'admin';
};

// Get all clients for the authenticated user
clientsRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(clients);
    res.json(result);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// Admin - Get all users
clientsRouter.get("/admin/users", requireAuth, async (req: Request, res: Response) => {
  try {
    // Admin kontrolü
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Log session user
    console.log("[ADMIN USERS] Session user:", req.session.user);

    // Tüm kullanıcıları getir (mevcut kullanıcı dahil)
    const users = await storage.getAllUsers();
    console.log("[ADMIN USERS] Fetched users in route:", users);
    
    // Kullanıcıları düzenle (hassas bilgileri kaldır)
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      createdAt: user.createdAt
    }));
    console.log("[ADMIN USERS] Sanitized users:", sanitizedUsers);

    return res.json(sanitizedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get a specific client by ID
clientsRouter.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }

    const result = await db.select().from(clients).where(eq(clients.id, clientId));
    if (!result.length) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

// Create a new client
clientsRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    console.log("Gelen client verisi:", req.body);
    
    const newClient = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email || null,
      phone: req.body.phone || null,
      occupation: req.body.occupation || null,
      status: req.body.status || 'active',
      gender: req.body.gender,
      height: req.body.height,
      birth_date: req.body.birth_date || null,
      address: req.body.address || null,
      notes: req.body.notes || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.insert(clients).values(newClient).returning();
    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// Update a client
clientsRouter.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }

    const updatedClient = {
      ...req.body,
      updated_at: new Date()
    };

    const result = await db.update(clients)
      .set(updatedClient)
      .where(eq(clients.id, clientId))
      .returning();

    if (!result.length) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// Delete a client
clientsRouter.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }

    const result = await db.delete(clients)
      .where(eq(clients.id, clientId))
      .returning();

    if (!result.length) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

// Get client measurements
clientsRouter.get("/:id/measurements", requireAuth, async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    
    // Get client using Drizzle
    const clientResult = await db.select().from(clients).where(eq(clients.id, clientId));
    if (!clientResult.length) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    // Get measurements using Drizzle
    const measurementsResult = await db.select()
      .from(measurements)
      .where(eq(measurements.clientId, clientId))
      .orderBy(measurements.createdAt);
    
    return res.json(measurementsResult);
  } catch (error) {
    console.error("Error fetching client measurements:", error);
    return res.status(500).json({ message: "Failed to fetch client measurements" });
  }
});

// Add a new measurement
clientsRouter.post("/:id/measurements", requireAuth, async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    // Get client using Drizzle
    const clientResult = await db.select().from(clients).where(eq(clients.id, clientId));
    if (!clientResult.length) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Validate and prepare measurement data
    const validatedData = insertMeasurementSchema.parse({
      ...req.body,
      clientId: clientId,
      basalMetabolicRate: req.body.basal_metabolic_rate ? Number(req.body.basal_metabolic_rate) : null,
      totalDailyEnergyExpenditure: req.body.total_daily_energy_expenditure ? Number(req.body.total_daily_energy_expenditure) : null
    });

    // Create measurement using Drizzle
    const newMeasurement = {
      client_id: clientId,
      date: new Date(),
      height: validatedData.height.toString(),
      weight: validatedData.weight.toString(),
      bmi: validatedData.bmi.toString(),
      body_fat_percentage: validatedData.bodyFatPercentage?.toString() ?? null,
      waist_circumference: validatedData.waistCircumference?.toString() ?? null,
      hip_circumference: validatedData.hipCircumference?.toString() ?? null,
      chest_circumference: validatedData.chestCircumference?.toString() ?? null,
      arm_circumference: validatedData.armCircumference?.toString() ?? null,
      thigh_circumference: validatedData.thighCircumference?.toString() ?? null,
      calf_circumference: validatedData.calfCircumference?.toString() ?? null,
      basal_metabolic_rate: validatedData.basalMetabolicRate?.toString() ?? null,
      total_daily_energy_expenditure: validatedData.totalDailyEnergyExpenditure?.toString() ?? null,
      activity_level: validatedData.activityLevel ?? null,
      notes: validatedData.notes ?? null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.insert(measurements)
      .values(newMeasurement)
      .returning();

    return res.status(201).json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Error creating measurement:", error);
    return res.status(500).json({ message: "Failed to create measurement" });
  }
});

// Delete a measurement
clientsRouter.delete("/:id/measurements/:measurementId", requireAuth, async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    const measurementId = parseInt(req.params.measurementId);
    
    if (isNaN(clientId) || isNaN(measurementId)) {
      return res.status(400).json({ message: "Invalid client ID or measurement ID" });
    }
    
    // Get client using Drizzle
    const clientResult = await db.select().from(clients).where(eq(clients.id, clientId));
    if (!clientResult.length) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    // Delete measurement using Drizzle
    const result = await db.delete(measurements)
      .where(eq(measurements.id, measurementId))
      .returning();

    if (!result.length) {
      return res.status(404).json({ message: "Measurement not found" });
    }

    return res.status(200).json({ message: "Measurement deleted successfully" });
  } catch (error) {
    console.error("Error deleting measurement:", error);
    return res.status(500).json({ message: "Failed to delete measurement" });
  }
});

// Generate access code for client portal
clientsRouter.post("/:id/access-code", requireAuth, async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Geçersiz danışan ID'si" });
    }
    
    // Kullanıcının ID'sini al
    const userId = req.session.user!.id;
    
    // Danışanı kontrol et
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ message: "Danışan bulunamadı" });
    }
    
    // Admin kullanıcı kontrolü
    const admin = isAdmin(req);
    
    // Sadece admin kullanıcıları veya danışanın sahibi erişim kodu oluşturabilir
    if (!admin && client.user_id !== userId) {
      return res.status(403).json({ message: "Bu danışan için erişim kodu oluşturma yetkiniz yok" });
    }

    // Erişim kodu oluştur
    const accessCode = await storage.generateClientAccessCode(clientId);
    // Güncellenmiş client objesini tekrar al
    const updatedClient = await storage.getClient(clientId);
    return res.status(200).json(updatedClient);
  } catch (error) {
    console.error("Error generating access code:", error);
    return res.status(500).json({ message: "Erişim kodu oluşturulamadı" });
  }
});

// Çoklu notlar: GET /api/clients/:id/notes
clientsRouter.get('/:id/notes', async (req: Request, res: Response) => {
  try {
    const clientId = Number(req.params.id);
    if (isNaN(clientId)) return res.status(400).json({ message: 'Geçersiz client id' });
    const notes = await storage.getClientNotes(clientId);
    res.json(notes);
  } catch (error) {
    console.error('Get client notes error:', error);
    res.status(500).json({ message: 'Notlar getirilirken hata oluştu' });
  }
});

// Çoklu notlar: POST /api/clients/:id/notes
clientsRouter.post('/:id/notes', async (req: Request, res: Response) => {
  try {
    const clientId = Number(req.params.id);
    const { content, user_id } = req.body;
    if (isNaN(clientId) || !content || !user_id) return res.status(400).json({ message: 'Eksik parametre' });
    const note = await storage.addClientNote(clientId, user_id, content);
    res.status(201).json(note);
  } catch (error) {
    console.error('Add client note error:', error);
    res.status(500).json({ message: 'Not eklenirken hata oluştu' });
  }
});

// Not silme endpointi
clientsRouter.delete("/:id/notes/:noteId", requireAuth, async (req: Request, res: Response) => {
  console.log('DELETE /api/clients/:id/notes/:noteId', req.params);
  const clientId = req.params.id;
  const noteId = req.params.noteId;
  if (!clientId || !noteId) {
    return res.status(400).json({ message: "Eksik parametre" });
  }
  try {
    // Notun gerçekten bu client'a ait olup olmadığını kontrol et
    const notes = await storage.getClientNotes(Number(clientId));
    const note = notes.find((n: any) => n.id === Number(noteId));
    if (!note) {
      return res.status(404).json({ message: "Not bulunamadı" });
    }
    // Sil
    await storage.deleteClientNote(Number(noteId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Not silinemedi", error: (err as Error)?.message });
  }
});

export default clientsRouter;

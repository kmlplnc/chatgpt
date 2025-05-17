import { Request, Response, Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertClientSchema, insertMeasurementSchema, updateClientSchema } from "@shared/schema";

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
    // Giriş yapmış kullanıcının ID'sini al
    const userId = req.session.user!.id;
    
    // Admin kullanıcı kontrolü
    const admin = isAdmin(req);
    
    // Admin kullanıcıları tüm danışanları görebilir
    // Normal kullanıcılar sadece kendi danışanlarını görebilir
    const clients = admin
      ? await storage.getClients()
      : await storage.getClients(userId);
    
    // Her danışan için son ölçümü ekle
    const clientsWithLastMeasurement = await Promise.all(
      clients.map(async (client) => {
        const lastMeasurement = await storage.getLastMeasurement(client.id);
        return {
          ...client,
          lastMeasurement,
        };
      })
    );
    
    return res.json(clientsWithLastMeasurement);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.status(500).json({ message: "Failed to fetch clients" });
  }
});

// Admin - Get all users
clientsRouter.get("/admin/users", requireAuth, async (req: Request, res: Response) => {
  try {
    // Admin kontrolü
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Tüm kullanıcıları getir (mevcut kullanıcı dahil)
    const users = await storage.getAllUsers();
    console.log("Fetched users in route:", users); // Debug için
    
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

    return res.json(sanitizedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get a specific client by ID
clientsRouter.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    
    // Kullanıcı ID'sini al
    const userId = req.session.user!.id;

    const client = await storage.getClient(id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    // Admin kullanıcı kontrolü
    const admin = isAdmin(req);
    
    // Sadece admin kullanıcıları tüm danışanları görebilir
    // Normal kullanıcılar sadece kendi danışanlarını görebilir
    if (!admin && client.userId !== userId) {
      return res.status(403).json({ message: "Bu danışana erişim izniniz yok" });
    }

    return res.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return res.status(500).json({ message: "Failed to fetch client" });
  }
});

// Create a new client
clientsRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = insertClientSchema.parse(req.body);
    
    // Kullanıcının ID'sini al
    const userId = req.session.user!.id;
    
    // Danışanı kullanıcı ID'si ile ilişkilendir
    const client = await storage.createClient({
      ...validatedData,
      userId  // Add userId to associate client with current user
    });
    
    return res.status(201).json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    console.error("Error creating client:", error);
    return res.status(500).json({ message: "Failed to create client" });
  }
});

// Update a client
clientsRouter.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    
    // Kullanıcının ID'sini al
    const userId = req.session.user!.id;

    const client = await storage.getClient(id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    // Admin kullanıcı kontrolü
    const admin = isAdmin(req);
    
    // Sadece admin kullanıcıları tüm danışanları güncelleyebilir
    // Normal kullanıcılar sadece kendi danışanlarını güncelleyebilir
    if (!admin && client.userId !== userId) {
      return res.status(403).json({ message: "Bu danışanı güncelleme yetkiniz yok" });
    }

    // Log incoming data
    console.log("Route - Gelen ham veri:", req.body);
    console.log("Route - Gelen boy değeri tipi:", typeof req.body.height);
    console.log("Route - Gelen boy değeri:", req.body.height);

    // Convert height to string with correct precision if provided
    const requestData = {
      ...req.body,
      height: req.body.height ? String(Number(req.body.height).toFixed(2)) : undefined
    };

    // Log converted data
    console.log("Route - Dönüştürülmüş veri:", requestData);
    console.log("Route - Dönüştürülmüş boy değeri tipi:", typeof requestData.height);
    console.log("Route - Dönüştürülmüş boy değeri:", requestData.height);

    // Validate data with updateClientSchema
    const validatedData = updateClientSchema.parse(requestData);
    
    // Log validated data
    console.log("Route - Doğrulanmış veri:", validatedData);
    console.log("Route - Doğrulanmış boy değeri tipi:", typeof validatedData.height);
    console.log("Route - Doğrulanmış boy değeri:", validatedData.height);
    
    // Update client with validated data
    const updatedClient = await storage.updateClient(id, validatedData);

    // Log updated client
    console.log("Route - Güncellenmiş danışan:", updatedClient);
    console.log("Route - Güncellenmiş boy değeri:", updatedClient.height);

    return res.json(updatedClient);
  } catch (error) {
    console.error("Route - Güncelleme hatası:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Delete a client
clientsRouter.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    
    // Kullanıcının ID'sini al
    const userId = req.session.user!.id;
    
    // Danışanı kontrol et
    const client = await storage.getClient(id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    // Admin kullanıcı kontrolü
    const admin = isAdmin(req);
    
    // Sadece admin kullanıcıları tüm danışanları silebilir
    // Normal kullanıcılar sadece kendi danışanlarını silebilir
    if (!admin && client.userId !== userId) {
      return res.status(403).json({ message: "Bu danışanı silme yetkiniz yok" });
    }

    const success = await storage.deleteClient(id);
    if (!success) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(204).end();
  } catch (error) {
    console.error("Error deleting client:", error);
    return res.status(500).json({ message: "Failed to delete client" });
  }
});

// Get measurements for a client
clientsRouter.get("/:id/measurements", requireAuth, async (req: Request, res: Response) => {
  try {
    const clientId = Number(req.params.id);
    const userId = req.session.user!.id;
    
    // Danışanın kullanıcıya ait olup olmadığını kontrol et (admin değilse)
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ message: "Danışan bulunamadı" });
    }
    
    if (client.userId !== userId && !isAdmin(req)) {
      return res.status(403).json({ message: "Bu danışanın verilerine erişim izniniz yok" });
    }
    
    // Danışanın ölçümlerini getir
    const clientMeasurements = await storage.getMeasurements(clientId);
    
    res.json(clientMeasurements);
  } catch (error) {
    console.error("Error fetching client measurements:", error);
    res.status(500).json({ message: "Failed to fetch client measurements" });
  }
});

// Add measurement for a client
clientsRouter.post("/:id/measurements", async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Get client details for BMH calculation
    const birthDateStr = client.birthDate;
    let age = 30; // default age if not available
    
    if (birthDateStr) {
      const birthDate = new Date(birthDateStr);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      
      // Adjust age if birthday hasn't occurred yet this year
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Calculate BMI
    const weight = parseFloat(req.body.weight);
    const height = parseFloat(req.body.height) / 100; // convert to meters
    const bmi = weight / (height * height);
    
    // Calculate BMH (Bazal Metabolizma Hızı) using Harris-Benedict equation
    let bmh = 0;
    if (client.gender === 'male') {
      bmh = 88.362 + (13.397 * weight) + (4.799 * (height * 100)) - (5.677 * age);
    } else {
      bmh = 447.593 + (9.247 * weight) + (3.098 * (height * 100)) - (4.330 * age);
    }
    
    // Calculate TDEE (Total Daily Energy Expenditure)
    let tdee = 0;
    const activityLevel = req.body.activityLevel || 'moderate';
    
    switch(activityLevel) {
      case 'sedentary':
        tdee = bmh * 1.2;
        break;
      case 'light':
        tdee = bmh * 1.375;
        break;
      case 'moderate':
        tdee = bmh * 1.55;
        break;
      case 'active':
        tdee = bmh * 1.725;
        break;
      case 'very_active':
        tdee = bmh * 1.9;
        break;
      default:
        tdee = bmh * 1.55; // default to moderate
    }
    
    // Add client ID to the measurement data
    const measurementData = { 
      ...req.body,
      clientId,
      updatedAt: new Date(), // Şema gereksinimine uygun olarak updatedAt ekliyoruz
      bmi: bmi.toFixed(2),
      basalMetabolicRate: Math.round(bmh),
      totalDailyEnergyExpenditure: Math.round(tdee)
    };
    
    // Zorunlu alanları kontrol et
    if (!measurementData.date) {
      measurementData.date = new Date().toISOString().split('T')[0];
    }
    
    // Ölçüm oluştur ve yanıt döndür
    const measurement = await storage.createMeasurement(measurementData);
    console.log("Measurement created:", measurement);
    return res.status(201).json(measurement);
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

// Update measurement
clientsRouter.patch("/:id/measurements/:measurementId", async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    const measurementId = parseInt(req.params.measurementId);
    
    if (isNaN(clientId) || isNaN(measurementId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Check if client exists
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Check if measurement exists and belongs to the client
    const measurement = await storage.getMeasurement(measurementId);
    if (!measurement) {
      return res.status(404).json({ message: "Measurement not found" });
    }
    
    if (measurement.clientId !== clientId) {
      return res.status(403).json({ message: "Measurement does not belong to this client" });
    }

    // Log girişleri ile gelen verileri kontrol et
    console.log("Ölçüm güncelleme - gelen veri:", JSON.stringify(req.body, null, 2));
    
    // Veriyi manuel olarak temizle ve hazırla - şema validasyonu sorunlu olabilir
    const cleanedData: Partial<any> = {};
    
    // Temel alanlar
    if (req.body.date) cleanedData.date = req.body.date;
    
    // Sayısal değerler - string'e dönüştür
    if (req.body.weight !== undefined) cleanedData.weight = String(req.body.weight);
    if (req.body.height !== undefined) cleanedData.height = String(req.body.height);
    if (req.body.bmi !== undefined) cleanedData.bmi = String(req.body.bmi);
    
    // İsteğe bağlı ölçümler - null veya string
    const optionalNumericFields = [
      'bodyFatPercentage', 'waistCircumference', 'hipCircumference',
      'chestCircumference', 'armCircumference', 'thighCircumference',
      'calfCircumference'
    ];
    
    optionalNumericFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (req.body[field] === null) {
          cleanedData[field] = null;
        } else {
          cleanedData[field] = String(req.body[field]);
        }
      }
    });
    
    // Diğer alanlar
    if (req.body.notes !== undefined) cleanedData.notes = req.body.notes || null;
    if (req.body.activityLevel !== undefined) cleanedData.activityLevel = req.body.activityLevel || null;
    if (req.body.clientId !== undefined) cleanedData.clientId = req.body.clientId;
    
    // Güncellenme zamanı
    cleanedData.updatedAt = new Date();
    
    console.log("Temizlenmiş veri:", JSON.stringify(cleanedData, null, 2));
    
    // Update the measurement with cleaned data
    const updatedMeasurement = await storage.updateMeasurement(measurementId, cleanedData);

    if (!updatedMeasurement) {
      return res.status(404).json({ message: "Failed to update measurement" });
    }

    return res.status(200).json(updatedMeasurement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod validation error:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    console.error("Error updating measurement:", error);
    return res.status(500).json({ message: "Failed to update measurement: " + (error as Error).message });
  }
});

// Delete measurement
clientsRouter.delete("/:id/measurements/:measurementId", async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    const measurementId = parseInt(req.params.measurementId);
    
    if (isNaN(clientId) || isNaN(measurementId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Check if client exists
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Check if measurement exists and belongs to the client
    const measurement = await storage.getMeasurement(measurementId);
    if (!measurement) {
      return res.status(404).json({ message: "Measurement not found" });
    }
    
    if (measurement.clientId !== clientId) {
      return res.status(403).json({ message: "Measurement does not belong to this client" });
    }

    // Delete the measurement
    const success = await storage.deleteMeasurement(measurementId);
    if (!success) {
      return res.status(500).json({ message: "Failed to delete measurement" });
    }

    return res.status(200).json({ success: true });
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
    if (!admin && client.userId !== userId) {
      return res.status(403).json({ message: "Bu danışan için erişim kodu oluşturma yetkiniz yok" });
    }

    // Erişim kodu oluştur
    const accessCode = await storage.generateClientAccessCode(clientId);
    
    return res.status(200).json({ accessCode });
  } catch (error) {
    console.error("Error generating access code:", error);
    return res.status(500).json({ message: "Erişim kodu oluşturulamadı" });
  }
});

export { clientsRouter };
import { Request, Response, Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertClientSchema, insertMeasurementSchema } from "@shared/schema";

const clientsRouter = Router();

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
  }
  next();
};

// Get all clients for the authenticated user
clientsRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    // Giriş yapmış kullanıcının ID'sini al
    const userId = req.session.user!.id;
    
    // Sadece bu kullanıcıya ait danışanları getir
    const clients = await storage.getClients(userId);
    return res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.status(500).json({ message: "Failed to fetch clients" });
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
    
    // Sadece kullanıcının kendi danışanlarına erişmesine izin ver
    if (client.userId !== userId) {
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
    
    // Kullanıcının sadece kendi danışanlarını güncellemesine izin ver
    if (client.userId !== userId) {
      return res.status(403).json({ message: "Bu danışanı güncelleme yetkiniz yok" });
    }

    const validatedData = insertClientSchema.partial().parse(req.body);
    
    const updatedClient = await storage.updateClient(id, validatedData);
    return res.json(updatedClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    console.error("Error updating client:", error);
    return res.status(500).json({ message: "Failed to update client" });
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
    
    // Kullanıcının sadece kendi danışanlarını silmesine izin ver
    if (client.userId !== userId) {
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
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }
    
    // Kullanıcının ID'sini al
    const userId = req.session.user!.id;

    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    // Kullanıcının sadece kendi danışanlarına ait ölçümleri görmesine izin ver
    if (client.userId !== userId) {
      return res.status(403).json({ message: "Bu danışanın ölçümlerine erişim izniniz yok" });
    }

    const measurements = await storage.getMeasurements(clientId);
    return res.json(measurements);
  } catch (error) {
    console.error("Error fetching client measurements:", error);
    return res.status(500).json({ message: "Failed to fetch client measurements" });
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

    // Add client ID to the measurement data
    const measurementData = { 
      ...req.body, 
      clientId,
      updatedAt: new Date() // Şema gereksinimine uygun olarak updatedAt ekliyoruz
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

export { clientsRouter };
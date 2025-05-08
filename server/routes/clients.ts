import { Request, Response, Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertClientSchema, insertMeasurementSchema } from "@shared/schema";

const clientsRouter = Router();

// Get all clients
clientsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const clients = await storage.getClients();
    return res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.status(500).json({ message: "Failed to fetch clients" });
  }
});

// Get a specific client by ID
clientsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    const client = await storage.getClient(id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return res.status(500).json({ message: "Failed to fetch client" });
  }
});

// Create a new client
clientsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const validatedData = insertClientSchema.parse(req.body);
    
    const client = await storage.createClient(validatedData);
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
clientsRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    const client = await storage.getClient(id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
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
clientsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid client ID" });
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
clientsRouter.get("/:id/measurements", async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
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

    // Validate and sanitize data
    // Use partial schema validation since some fields might be missing
    const validatedData = insertMeasurementSchema.partial().parse(req.body);
    
    // Update the measurement
    const updatedMeasurement = await storage.updateMeasurement(measurementId, {
      ...validatedData,
      updatedAt: new Date()
    });

    if (!updatedMeasurement) {
      return res.status(404).json({ message: "Failed to update measurement" });
    }

    return res.status(200).json(updatedMeasurement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    console.error("Error updating measurement:", error);
    return res.status(500).json({ message: "Failed to update measurement" });
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
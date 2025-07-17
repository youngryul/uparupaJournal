import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDiaryEntrySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all diary entries
  app.get("/api/diary-entries", async (req, res) => {
    try {
      const entries = await storage.getDiaryEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch diary entries" });
    }
  });

  // Get a single diary entry
  app.get("/api/diary-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.getDiaryEntry(id);
      if (!entry) {
        return res.status(404).json({ message: "Diary entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch diary entry" });
    }
  });

  // Create a new diary entry
  app.post("/api/diary-entries", async (req, res) => {
    try {
      const validatedData = insertDiaryEntrySchema.parse(req.body);
      const entry = await storage.createDiaryEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create diary entry" });
    }
  });

  // Update a diary entry
  app.put("/api/diary-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDiaryEntrySchema.partial().parse(req.body);
      const entry = await storage.updateDiaryEntry(id, validatedData);
      if (!entry) {
        return res.status(404).json({ message: "Diary entry not found" });
      }
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update diary entry" });
    }
  });

  // Delete a diary entry
  app.delete("/api/diary-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDiaryEntry(id);
      if (!success) {
        return res.status(404).json({ message: "Diary entry not found" });
      }
      res.json({ message: "Diary entry deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete diary entry" });
    }
  });

  // Search diary entries
  app.get("/api/diary-entries/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const entries = await storage.searchDiaryEntries(query);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to search diary entries" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

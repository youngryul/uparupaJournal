import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDiaryEntrySchema, loginSchema, signupSchema } from "@shared/schema";
import { hashPassword, comparePassword, generateToken, authMiddleware, type AuthenticatedRequest } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "이미 존재하는 사용자명입니다" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword,
      });

      const token = generateToken(user.id);
      res.status(201).json({ 
        message: "회원가입이 완료되었습니다",
        token,
        user: { id: user.id, username: user.username }
      });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다", errors: error.errors });
      }
      res.status(500).json({ message: "회원가입에 실패했습니다" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ message: "사용자명 또는 비밀번호가 올바르지 않습니다" });
      }

      const isPasswordValid = await comparePassword(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "사용자명 또는 비밀번호가 올바르지 않습니다" });
      }

      const token = generateToken(user.id);
      res.json({ 
        message: "로그인이 완료되었습니다",
        token,
        user: { id: user.id, username: user.username }
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다", errors: error.errors });
      }
      res.status(500).json({ message: "로그인에 실패했습니다" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "사용자 정보를 가져오는데 실패했습니다" });
    }
  });

  // Get user's diary entries
  app.get("/api/diary-entries", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const entries = await storage.getDiaryEntries(req.userId!);
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
  app.post("/api/diary-entries", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertDiaryEntrySchema.parse({
        ...req.body,
        userId: req.userId
      });
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
  app.put("/api/diary-entries/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
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
  app.delete("/api/diary-entries/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
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
  app.get("/api/diary-entries/search/:query", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const query = req.params.query;
      const entries = await storage.searchDiaryEntries(query, req.userId!);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to search diary entries" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

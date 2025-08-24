import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDiaryEntrySchema, insertDiaryAnalysisSchema, insertMemoirEntrySchema, loginSchema, signupSchema, menuSelectionSchema } from "@shared/schema";
import { hashPassword, comparePassword, generateToken, authMiddleware, type AuthenticatedRequest } from "./auth";
import { analyzeDiary } from "./ai-analysis";
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
      res.json({ 
        id: user.id, 
        username: user.username,
        useDiary: user.useDiary,
        useMemoir: user.useMemoir,
        menuConfigured: user.menuConfigured
      });
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

  // AI Analysis Routes
  // Get AI analysis status for a diary entry
  app.get("/api/diary-entries/:id/analysis", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const diaryEntryId = parseInt(req.params.id);
      
      // Verify diary entry belongs to user
      const diaryEntry = await storage.getDiaryEntry(diaryEntryId);
      if (!diaryEntry || diaryEntry.userId !== req.userId!) {
        return res.status(404).json({ message: "일기를 찾을 수 없습니다" });
      }

      // Check if analysis exists
      const existingAnalysis = await storage.getDiaryAnalysis(diaryEntryId);
      if (existingAnalysis) {
        res.json({ 
          hasAnalysis: true, 
          analysis: existingAnalysis,
          message: "AI 분석이 완료되었습니다"
        });
      } else {
        res.json({ 
          hasAnalysis: false, 
          message: "AI 분석이 아직 완료되지 않았습니다"
        });
      }
    } catch (error) {
      console.error("Get analysis status error:", error);
      res.status(500).json({ message: "AI 분석 상태를 확인하는데 실패했습니다" });
    }
  });

  app.post("/api/diary-entries/:id/analysis", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const diaryEntryId = parseInt(req.params.id);
      
      // Verify diary entry belongs to user
      const diaryEntry = await storage.getDiaryEntry(diaryEntryId);
      if (!diaryEntry || diaryEntry.userId !== req.userId!) {
        return res.status(404).json({ message: "일기를 찾을 수 없습니다" });
      }

      // Check if analysis already exists
      const existingAnalysis = await storage.getDiaryAnalysis(diaryEntryId);
      if (existingAnalysis) {
        return res.status(409).json({ message: "이미 분석이 완료된 일기입니다", analysis: existingAnalysis });
      }

      // Perform AI analysis
      const aiResult = await analyzeDiary(diaryEntry.content, diaryEntry.emotion);
      
      // Save analysis to database
      const analysisData = {
        diaryEntryId,
        emotionAnalysis: aiResult.emotionAnalysis,
        sentimentScore: aiResult.sentimentScore,
        themes: aiResult.themes,
        keywords: aiResult.keywords,
        suggestions: aiResult.suggestions,
        summary: aiResult.summary,
      };

      const analysis = await storage.createDiaryAnalysis(analysisData);
      res.status(201).json(analysis);
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ message: "AI 분석 중 오류가 발생했습니다" });
    }
  });

  // Regenerate analysis for a diary entry
  app.put("/api/diary-entries/:id/analysis", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const diaryEntryId = parseInt(req.params.id);
      
      // Verify diary entry belongs to user
      const diaryEntry = await storage.getDiaryEntry(diaryEntryId);
      if (!diaryEntry || diaryEntry.userId !== req.userId!) {
        return res.status(404).json({ message: "일기를 찾을 수 없습니다" });
      }

      // Get existing analysis
      const existingAnalysis = await storage.getDiaryAnalysis(diaryEntryId);
      if (!existingAnalysis) {
        return res.status(404).json({ message: "기존 분석 결과를 찾을 수 없습니다" });
      }

      // Perform new AI analysis
      const aiResult = await analyzeDiary(diaryEntry.content, diaryEntry.emotion);
      
      // Update analysis in database
      const updatedAnalysis = await storage.updateDiaryAnalysis(existingAnalysis.id, {
        emotionAnalysis: aiResult.emotionAnalysis,
        sentimentScore: aiResult.sentimentScore,
        themes: aiResult.themes,
        keywords: aiResult.keywords,
        suggestions: aiResult.suggestions,
        summary: aiResult.summary,
      });

      if (!updatedAnalysis) {
        return res.status(404).json({ message: "분석 결과를 업데이트할 수 없습니다" });
      }

      res.json(updatedAnalysis);
    } catch (error) {
      console.error("AI re-analysis error:", error);
      res.status(500).json({ message: "AI 분석 재생성 중 오류가 발생했습니다" });
    }
  });

  // Delete analysis for a diary entry
  app.delete("/api/diary-entries/:id/analysis", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const diaryEntryId = parseInt(req.params.id);
      
      // Verify diary entry belongs to user
      const diaryEntry = await storage.getDiaryEntry(diaryEntryId);
      if (!diaryEntry || diaryEntry.userId !== req.userId!) {
        return res.status(404).json({ message: "일기를 찾을 수 없습니다" });
      }

      const success = await storage.deleteDiaryAnalysis(diaryEntryId);
      if (!success) {
        return res.status(404).json({ message: "삭제할 분석 결과를 찾을 수 없습니다" });
      }

      res.json({ message: "분석 결과가 삭제되었습니다" });
    } catch (error) {
      console.error("Delete analysis error:", error);
      res.status(500).json({ message: "분석 결과 삭제에 실패했습니다" });
    }
  });

  // Menu preferences API
  app.post("/api/auth/update-menu-preferences", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = menuSelectionSchema.parse(req.body);
      const user = await storage.updateUserPreferences(req.userId!, {
        ...validatedData,
        menuConfigured: true
      });
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      res.json({ 
        message: "메뉴 설정이 업데이트되었습니다",
        useDiary: user.useDiary,
        useMemoir: user.useMemoir,
        menuConfigured: user.menuConfigured
      });
    } catch (error) {
      console.error("Update menu preferences error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다", errors: error.errors });
      }
      res.status(500).json({ message: "메뉴 설정 업데이트에 실패했습니다" });
    }
  });

  app.get("/api/auth/user-preferences", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      res.json({
        useDiary: user.useDiary,
        useMemoir: user.useMemoir,
        menuConfigured: user.menuConfigured,
        showInstallPrompt: user.showInstallPrompt
      });
    } catch (error) {
      console.error("Get user preferences error:", error);
      res.status(500).json({ message: "사용자 설정을 가져오는데 실패했습니다" });
    }
  });

  // Update user preferences
  app.put("/api/auth/user-preferences", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { useDiary, useMemoir, menuConfigured, showInstallPrompt } = req.body;
      const user = await storage.updateUserPreferences(req.userId!, {
        useDiary,
        useMemoir,
        menuConfigured,
        showInstallPrompt
      });
      
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      
      res.json({
        useDiary: user.useDiary,
        useMemoir: user.useMemoir,
        menuConfigured: user.menuConfigured,
        showInstallPrompt: user.showInstallPrompt
      });
    } catch (error) {
      console.error("Update user preferences error:", error);
      res.status(500).json({ message: "사용자 설정 업데이트에 실패했습니다" });
    }
  });

  // Memoir entries API
  app.get("/api/memoir-entries", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const entries = await storage.getMemoirEntries(req.userId!);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "회고록을 불러오는데 실패했습니다" });
    }
  });

  app.get("/api/memoir-entries/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.getMemoirEntry(id);
      if (!entry) {
        return res.status(404).json({ message: "회고록을 찾을 수 없습니다" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "회고록을 불러오는데 실패했습니다" });
    }
  });

  app.post("/api/memoir-entries", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertMemoirEntrySchema.parse({
        ...req.body,
        userId: req.userId
      });
      const entry = await storage.createMemoirEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Create memoir entry error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다", errors: error.errors });
      }
      res.status(500).json({ message: "회고록 저장에 실패했습니다" });
    }
  });

  app.put("/api/memoir-entries/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMemoirEntrySchema.omit({ userId: true }).partial().parse(req.body);
      const entry = await storage.updateMemoirEntry(id, validatedData);
      if (!entry) {
        return res.status(404).json({ message: "회고록을 찾을 수 없습니다" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Update memoir entry error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다", errors: error.errors });
      }
      res.status(500).json({ message: "회고록 수정에 실패했습니다" });
    }
  });

  app.delete("/api/memoir-entries/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMemoirEntry(id);
      if (!success) {
        return res.status(404).json({ message: "회고록을 찾을 수 없습니다" });
      }
      res.json({ message: "회고록이 삭제되었습니다" });
    } catch (error) {
      console.error("Delete memoir entry error:", error);
      res.status(500).json({ message: "회고록 삭제에 실패했습니다" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDiaryEntrySchema, 
  insertDiaryAnalysisSchema, 
  insertMemoirEntrySchema, 
  insertEmotionRecordSchema,
  insertActivityRecordSchema,
  insertActivitySchema,
  insertUserSettingsSchema,
  loginSchema, 
  signupSchema, 
  menuSelectionSchema 
} from "@shared/schema";
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

  // Get user preferences
  app.get("/api/auth/user-preferences", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      res.json({ 
        useDiary: user.useDiary,
        useMemoir: user.useMemoir,
        useRecord: user.useRecord,
        menuConfigured: user.menuConfigured
      });
    } catch (error) {
      console.error("Get user preferences error:", error);
      res.status(500).json({ message: "사용자 설정을 가져오는데 실패했습니다" });
    }
  });

  // Update user preferences
  app.put("/api/auth/user-preferences", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = z.object({
        useDiary: z.boolean().optional(),
        useMemoir: z.boolean().optional(),
        useRecord: z.boolean().optional(),
        menuConfigured: z.boolean().optional()
      }).parse(req.body);

      const updatedUser = await storage.updateUserPreferences(req.userId!, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      
      res.json({ 
        message: "사용자 설정이 업데이트되었습니다",
        preferences: {
          useDiary: updatedUser.useDiary,
          useMemoir: updatedUser.useMemoir,
          useRecord: updatedUser.useRecord,
          menuConfigured: updatedUser.menuConfigured
        }
      });
    } catch (error) {
      console.error("Update user preferences error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다", errors: error.errors });
      }
      res.status(500).json({ message: "사용자 설정 업데이트에 실패했습니다" });
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
      
      // 사용자 통계 업데이트
      let userStats = await storage.getUserStats(req.userId!);
      if (!userStats) {
        userStats = await storage.createUserStats({
          userId: req.userId!,
        });
      }
      
      await storage.updateUserStats(req.userId!, {
        totalDiaryEntries: (userStats.totalDiaryEntries || 0) + 1,
      });

      // 업적 확인 및 해제
      const newAchievements = await storage.checkAndUnlockAchievements(req.userId!);
      
      res.status(201).json({ 
        entry, 
        newAchievements: newAchievements.length > 0 ? newAchievements : undefined 
      });
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
  // Get analysis for a diary entry
  app.get("/api/diary-entries/:id/analysis", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const diaryEntryId = parseInt(req.params.id);
      
      // Verify diary entry belongs to user
      const diaryEntry = await storage.getDiaryEntry(diaryEntryId);
      if (!diaryEntry || diaryEntry.userId !== req.userId!) {
        return res.status(404).json({ message: "일기를 찾을 수 없습니다" });
      }

      const analysis = await storage.getDiaryAnalysis(diaryEntryId);
      if (!analysis) {
        return res.status(404).json({ message: "분석 결과를 찾을 수 없습니다" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ message: "분석 결과를 가져오는데 실패했습니다" });
    }
  });

  // Create AI analysis for a diary entry
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
        useRecord: user.useRecord,
        menuConfigured: user.menuConfigured
      });
    } catch (error) {
      console.error("Get user preferences error:", error);
      res.status(500).json({ message: "사용자 설정을 가져오는데 실패했습니다" });
    }
  });

  app.put("/api/auth/user-preferences", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = menuSelectionSchema.parse(req.body);
      const user = await storage.updateUserPreferences(req.userId!, validatedData);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      res.json({ 
        message: "사용자 설정이 업데이트되었습니다",
        preferences: {
          useDiary: user.useDiary,
          useMemoir: user.useMemoir,
          useRecord: user.useRecord,
          menuConfigured: user.menuConfigured
        }
      });
    } catch (error) {
      console.error("Update user preferences error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다", errors: error.errors });
      }
      res.status(500).json({ message: "사용자 설정 업데이트에 실패했습니다" });
    }
  });

  // 게임화 - 업적 시스템 API
  app.get("/api/achievements", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "업적 목록을 가져오는데 실패했습니다" });
    }
  });

  app.get("/api/user-achievements", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userAchievements = await storage.getUserAchievements(req.userId!);
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "사용자 업적을 가져오는데 실패했습니다" });
    }
  });

  app.get("/api/user-stats", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      let userStats = await storage.getUserStats(req.userId!);
      
      // 사용자 통계가 없으면 생성
      if (!userStats) {
        userStats = await storage.createUserStats({
          userId: req.userId!,
        });
      }
      
      res.json(userStats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "사용자 통계를 가져오는데 실패했습니다" });
    }
  });

  app.post("/api/check-achievements", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const newAchievements = await storage.checkAndUnlockAchievements(req.userId!);
      res.json({ newAchievements });
    } catch (error) {
      console.error("Error checking achievements:", error);
      res.status(500).json({ message: "업적 확인에 실패했습니다" });
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
      
      // 사용자 통계 업데이트
      let userStats = await storage.getUserStats(req.userId!);
      if (!userStats) {
        userStats = await storage.createUserStats({
          userId: req.userId!,
        });
      }
      
      await storage.updateUserStats(req.userId!, {
        totalMemoirEntries: (userStats.totalMemoirEntries || 0) + 1,
      });

      // 업적 확인 및 해제
      const newAchievements = await storage.checkAndUnlockAchievements(req.userId!);
      
      res.status(201).json({ 
        entry, 
        newAchievements: newAchievements.length > 0 ? newAchievements : undefined 
      });
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

  // 기록 기능 - 감정 기록 API
  app.get("/api/emotion-records", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const records = await storage.getEmotionRecords(req.userId!, year, month);
      res.json(records);
    } catch (error) {
      console.error("Get emotion records error:", error);
      res.status(500).json({ message: "감정 기록을 불러오는데 실패했습니다" });
    }
  });

  app.post("/api/emotion-records", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertEmotionRecordSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const record = await storage.createEmotionRecord(validatedData);
      
      // 사용자 통계 업데이트
      let userStats = await storage.getUserStats(req.userId!);
      if (!userStats) {
        userStats = await storage.createUserStats({
          userId: req.userId!,
        });
      }
      
      await storage.updateUserStats(req.userId!, {
        totalEmotionRecords: (userStats.totalEmotionRecords || 0) + 1,
      });

      // 업적 확인 및 해제
      const newAchievements = await storage.checkAndUnlockAchievements(req.userId!);
      
      res.status(201).json({ 
        record, 
        newAchievements: newAchievements.length > 0 ? newAchievements : undefined 
      });
    } catch (error) {
      console.error("Create emotion record error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다", errors: error.errors });
      }
      res.status(500).json({ message: "감정 기록 저장에 실패했습니다" });
    }
  });

  // 기록 기능 - 활동 목록 API
  app.get("/api/activities", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const activities = await storage.getActivities(req.userId!);
      res.json(activities);
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ message: "활동 목록을 불러오는데 실패했습니다" });
    }
  });

  app.post("/api/activities", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertActivitySchema.parse({
        ...req.body,
        userId: req.userId
      });
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Create activity error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다", errors: error.errors });
      }
      res.status(500).json({ message: "활동 추가에 실패했습니다" });
    }
  });

  // 기록 기능 - 사용자 설정 API
  app.get("/api/user-settings", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await storage.getUserSettings(req.userId!);
      if (!settings) {
        // 기본 설정 생성
        const defaultSettings = await storage.createUserSettings({
          userId: req.userId!,
          theme: "blue",
          emotionIcon: "bean",
          dailyReminder: true,
          reminderTime: "21:00",
          weekStart: 0
        });
        return res.json(defaultSettings);
      }
      res.json(settings);
    } catch (error) {
      console.error("Get user settings error:", error);
      res.status(500).json({ message: "사용자 설정을 불러오는데 실패했습니다" });
    }
  });

  app.put("/api/user-settings", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertUserSettingsSchema.omit({ userId: true }).partial().parse(req.body);
      let settings = await storage.updateUserSettings(req.userId!, validatedData);
      
      // 설정이 없으면 새로 생성
      if (!settings) {
        settings = await storage.createUserSettings({
          userId: req.userId!,
          ...validatedData
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Update user settings error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다", errors: error.errors });
      }
      res.status(500).json({ message: "사용자 설정 저장에 실패했습니다" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

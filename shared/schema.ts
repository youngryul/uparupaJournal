import { pgTable, text, serial, integer, boolean, date, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for session management
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  useDiary: boolean("use_diary").default(false),
  useMemoir: boolean("use_memoir").default(false),
  useRecord: boolean("use_record").default(false),
  menuConfigured: boolean("menu_configured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const diaryEntries = pgTable("diary_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  emotion: text("emotion").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memoirEntries = pgTable("memoir_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  period: text("period"), // 예: "2024년 상반기", "대학교 시절" 등
  createdAt: timestamp("created_at").defaultNow(),
});

export const diaryAnalyses = pgTable("diary_analyses", {
  id: serial("id").primaryKey(),
  diaryEntryId: integer("diary_entry_id").notNull().references(() => diaryEntries.id),
  emotionAnalysis: jsonb("emotion_analysis"), // { primary: string, secondary: string[], confidence: number }
  sentimentScore: integer("sentiment_score"), // -100 to 100
  themes: text("themes").array(), // 주요 주제들
  keywords: text("keywords").array(), // 핵심 키워드
  suggestions: text("suggestions"), // AI 제안사항
  summary: text("summary"), // 일기 요약
  createdAt: timestamp("created_at").defaultNow(),
});

// 기록 기능 - 감정 기록
export const emotionRecords = pgTable("emotion_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  emotion: integer("emotion").notNull(), // 1(매우 나쁨) ~ 5(매우 좋음)
  memo: text("memo"), // 간단 메모
  photos: text("photos").array(), // 사진 경로들 (최대 3장)
  createdAt: timestamp("created_at").defaultNow(),
});

// 기록 기능 - 활동 기록
export const activityRecords = pgTable("activity_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  emotionRecordId: integer("emotion_record_id").notNull().references(() => emotionRecords.id),
  activityId: integer("activity_id").notNull().references(() => activities.id),
  duration: integer("duration"), // 활동 시간 (분)
  intensity: integer("intensity"), // 활동 강도 1-5
  notes: text("notes"), // 활동 메모
  createdAt: timestamp("created_at").defaultNow(),
});

// 기록 기능 - 활동 목록 (사용자 정의 가능)
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // null이면 기본 활동
  name: text("name").notNull(),
  icon: text("icon").notNull(), // 아이콘 이름 또는 이모지
  category: text("category").notNull(), // 운동, 수면, 공부, 여가 등
  isDefault: boolean("is_default").default(false), // 기본 제공 활동인지
  createdAt: timestamp("created_at").defaultNow(),
});

// 기록 기능 - 사용자 설정
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  theme: text("theme").default("blue"), // 테마 색상
  emotionIcon: text("emotion_icon").default("bean"), // 감정 아이콘 스타일
  dailyReminder: boolean("daily_reminder").default(true), // 일일 알림
  reminderTime: text("reminder_time").default("21:00"), // 알림 시간
  weekStart: integer("week_start").default(0), // 주 시작일 (0=일요일)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  useDiary: true,
  useMemoir: true,
  useRecord: true,
  menuConfigured: true,
});

export const insertEmotionRecordSchema = createInsertSchema(emotionRecords).pick({
  userId: true,
  date: true,
  emotion: true,
  memo: true,
  photos: true,
});

export const insertActivityRecordSchema = createInsertSchema(activityRecords).pick({
  userId: true,
  emotionRecordId: true,
  activityId: true,
  duration: true,
  intensity: true,
  notes: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  name: true,
  icon: true,
  category: true,
  isDefault: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  userId: true,
  theme: true,
  emotionIcon: true,
  dailyReminder: true,
  reminderTime: true,
  weekStart: true,
});

export const insertDiaryEntrySchema = createInsertSchema(diaryEntries).pick({
  userId: true,
  date: true,
  emotion: true,
  content: true,
});

export const insertMemoirEntrySchema = createInsertSchema(memoirEntries).pick({
  userId: true,
  title: true,
  content: true,
  period: true,
});

export const insertDiaryAnalysisSchema = createInsertSchema(diaryAnalyses).pick({
  diaryEntryId: true,
  emotionAnalysis: true,
  sentimentScore: true,
  themes: true,
  keywords: true,
  suggestions: true,
  summary: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "사용자명을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export const signupSchema = z.object({
  username: z.string().min(3, "사용자명은 3글자 이상이어야 합니다").max(20, "사용자명은 20글자 이하여야 합니다"),
  password: z.string().min(6, "비밀번호는 6글자 이상이어야 합니다"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

export const menuSelectionSchema = z.object({
  useDiary: z.boolean().default(true),
  useMemoir: z.boolean().default(false),
  useRecord: z.boolean().default(false),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertMemoirEntry = z.infer<typeof insertMemoirEntrySchema>;
export type MemoirEntry = typeof memoirEntries.$inferSelect;
export type InsertDiaryAnalysis = z.infer<typeof insertDiaryAnalysisSchema>;
export type DiaryAnalysis = typeof diaryAnalyses.$inferSelect;
export type InsertEmotionRecord = z.infer<typeof insertEmotionRecordSchema>;
export type EmotionRecord = typeof emotionRecords.$inferSelect;
export type InsertActivityRecord = z.infer<typeof insertActivityRecordSchema>;
export type ActivityRecord = typeof activityRecords.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type MenuSelectionData = z.infer<typeof menuSelectionSchema>;

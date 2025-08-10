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
  useDiary: boolean("use_diary").default(true),
  useMemoir: boolean("use_memoir").default(false),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  useDiary: true,
  useMemoir: true,
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
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertMemoirEntry = z.infer<typeof insertMemoirEntrySchema>;
export type MemoirEntry = typeof memoirEntries.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type MenuSelectionData = z.infer<typeof menuSelectionSchema>;

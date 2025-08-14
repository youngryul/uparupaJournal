import { 
  users, 
  diaryEntries,
  diaryAnalyses,
  memoirEntries,
  emotionRecords,
  activityRecords,
  activities,
  userSettings,
  achievements,
  userAchievements,
  userStats,
  type User, 
  type InsertUser, 
  type DiaryEntry, 
  type InsertDiaryEntry,
  type DiaryAnalysis,
  type InsertDiaryAnalysis,
  type MemoirEntry,
  type InsertMemoirEntry,
  type EmotionRecord,
  type InsertEmotionRecord,
  type ActivityRecord,
  type InsertActivityRecord,
  type Activity,
  type InsertActivity,
  type UserSettings,
  type InsertUserSettings,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement,
  type UserStats,
  type InsertUserStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPreferences(id: number, preferences: { useDiary?: boolean; useMemoir?: boolean; useRecord?: boolean; menuConfigured?: boolean }): Promise<User | undefined>;
  
  getDiaryEntries(userId: number): Promise<DiaryEntry[]>;
  getDiaryEntry(id: number): Promise<DiaryEntry | undefined>;
  createDiaryEntry(entry: InsertDiaryEntry): Promise<DiaryEntry>;
  updateDiaryEntry(id: number, entry: Partial<InsertDiaryEntry>): Promise<DiaryEntry | undefined>;
  deleteDiaryEntry(id: number): Promise<boolean>;
  searchDiaryEntries(query: string, userId: number): Promise<DiaryEntry[]>;
  
  getDiaryAnalysis(diaryEntryId: number): Promise<DiaryAnalysis | undefined>;
  createDiaryAnalysis(analysis: InsertDiaryAnalysis): Promise<DiaryAnalysis>;
  updateDiaryAnalysis(id: number, analysis: Partial<InsertDiaryAnalysis>): Promise<DiaryAnalysis | undefined>;
  deleteDiaryAnalysis(diaryEntryId: number): Promise<boolean>;

  getMemoirEntries(userId: number): Promise<MemoirEntry[]>;
  getMemoirEntry(id: number): Promise<MemoirEntry | undefined>;
  createMemoirEntry(entry: InsertMemoirEntry): Promise<MemoirEntry>;
  updateMemoirEntry(id: number, entry: Partial<InsertMemoirEntry>): Promise<MemoirEntry | undefined>;
  deleteMemoirEntry(id: number): Promise<boolean>;

  // 기록 기능 - 감정 기록
  getEmotionRecords(userId: number, year?: number, month?: number): Promise<EmotionRecord[]>;
  getEmotionRecord(id: number): Promise<EmotionRecord | undefined>;
  createEmotionRecord(record: InsertEmotionRecord): Promise<EmotionRecord>;
  updateEmotionRecord(id: number, record: Partial<InsertEmotionRecord>): Promise<EmotionRecord | undefined>;
  deleteEmotionRecord(id: number): Promise<boolean>;

  // 기록 기능 - 활동 기록
  getActivityRecords(userId: number, emotionRecordId?: number): Promise<ActivityRecord[]>;
  getActivityRecord(id: number): Promise<ActivityRecord | undefined>;
  createActivityRecord(record: InsertActivityRecord): Promise<ActivityRecord>;
  updateActivityRecord(id: number, record: Partial<InsertActivityRecord>): Promise<ActivityRecord | undefined>;
  deleteActivityRecord(id: number): Promise<boolean>;

  // 기록 기능 - 활동 목록
  getActivities(userId: number): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;

  // 기록 기능 - 사용자 설정
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: number, settings: Partial<InsertUserSettings>): Promise<UserSettings | undefined>;

  // 게임화 - 업적 시스템
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]>;
  createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievementProgress(userId: number, achievementId: number, progress: number): Promise<UserAchievement | undefined>;
  
  // 게임화 - 사용자 통계
  getUserStats(userId: number): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: number, stats: Partial<InsertUserStats>): Promise<UserStats | undefined>;
  checkAndUnlockAchievements(userId: number): Promise<Achievement[]>;
}

export class MemStorage implements IStorage {
  private users: User[] = [];
  private diaryEntries: DiaryEntry[] = [];
  private diaryAnalyses: DiaryAnalysis[] = [];
  private memoirEntries: MemoirEntry[] = [];
  private emotionRecords: EmotionRecord[] = [];
  private activityRecords: ActivityRecord[] = [];
  private activities: Activity[] = [];
  private userSettings: UserSettings[] = [];
  private nextUserId = 1;
  private nextEntryId = 1;
  private nextAnalysisId = 1;
  private nextMemoirId = 1;
  private nextEmotionRecordId = 1;
  private nextActivityRecordId = 1;
  private nextActivityId = 1;
  private nextUserSettingsId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      username: insertUser.username,
      password: insertUser.password,
      useDiary: insertUser.useDiary ?? false,
      useMemoir: insertUser.useMemoir ?? false,
      useRecord: insertUser.useRecord ?? false,
      menuConfigured: insertUser.menuConfigured ?? false,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateUserPreferences(id: number, preferences: { useDiary?: boolean; useMemoir?: boolean; useRecord?: boolean; menuConfigured?: boolean }): Promise<User | undefined> {
    const user = this.users.find(u => u.id === id);
    if (!user) return undefined;
    
    if (preferences.useDiary !== undefined) user.useDiary = preferences.useDiary;
    if (preferences.useMemoir !== undefined) user.useMemoir = preferences.useMemoir;
    if (preferences.useRecord !== undefined) user.useRecord = preferences.useRecord;
    if (preferences.menuConfigured !== undefined) user.menuConfigured = preferences.menuConfigured;
    
    return user;
  }

  async getDiaryEntries(userId: number): Promise<DiaryEntry[]> {
    return this.diaryEntries
      .filter(entry => entry.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getDiaryEntry(id: number): Promise<DiaryEntry | undefined> {
    return this.diaryEntries.find(entry => entry.id === id);
  }

  async createDiaryEntry(insertEntry: InsertDiaryEntry): Promise<DiaryEntry> {
    const entry: DiaryEntry = {
      id: this.nextEntryId++,
      userId: insertEntry.userId,
      date: insertEntry.date,
      emotion: insertEntry.emotion,
      content: insertEntry.content,
      createdAt: new Date(),
    };
    this.diaryEntries.push(entry);
    return entry;
  }

  async updateDiaryEntry(id: number, updateEntry: Partial<InsertDiaryEntry>): Promise<DiaryEntry | undefined> {
    const index = this.diaryEntries.findIndex(entry => entry.id === id);
    if (index === -1) return undefined;
    
    this.diaryEntries[index] = { ...this.diaryEntries[index], ...updateEntry };
    return this.diaryEntries[index];
  }

  async deleteDiaryEntry(id: number): Promise<boolean> {
    const index = this.diaryEntries.findIndex(entry => entry.id === id);
    if (index === -1) return false;
    
    this.diaryEntries.splice(index, 1);
    return true;
  }

  async searchDiaryEntries(query: string, userId: number): Promise<DiaryEntry[]> {
    const lowerQuery = query.toLowerCase();
    return this.diaryEntries
      .filter(entry => 
        entry.userId === userId && 
        (entry.content.toLowerCase().includes(lowerQuery) || 
         entry.emotion.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getDiaryAnalysis(diaryEntryId: number): Promise<DiaryAnalysis | undefined> {
    return this.diaryAnalyses.find(analysis => analysis.diaryEntryId === diaryEntryId);
  }

  async createDiaryAnalysis(insertAnalysis: InsertDiaryAnalysis): Promise<DiaryAnalysis> {
    const analysis: DiaryAnalysis = {
      id: this.nextAnalysisId++,
      diaryEntryId: insertAnalysis.diaryEntryId,
      emotionAnalysis: insertAnalysis.emotionAnalysis || null,
      sentimentScore: insertAnalysis.sentimentScore || null,
      themes: insertAnalysis.themes || null,
      keywords: insertAnalysis.keywords || null,
      suggestions: insertAnalysis.suggestions || null,
      summary: insertAnalysis.summary || null,
      createdAt: new Date(),
    };
    this.diaryAnalyses.push(analysis);
    return analysis;
  }

  async updateDiaryAnalysis(id: number, updateAnalysis: Partial<InsertDiaryAnalysis>): Promise<DiaryAnalysis | undefined> {
    const index = this.diaryAnalyses.findIndex(analysis => analysis.id === id);
    if (index === -1) return undefined;
    
    this.diaryAnalyses[index] = { ...this.diaryAnalyses[index], ...updateAnalysis };
    return this.diaryAnalyses[index];
  }

  async deleteDiaryAnalysis(diaryEntryId: number): Promise<boolean> {
    const index = this.diaryAnalyses.findIndex(analysis => analysis.diaryEntryId === diaryEntryId);
    if (index === -1) return false;
    
    this.diaryAnalyses.splice(index, 1);
    return true;
  }

  async getMemoirEntries(userId: number): Promise<MemoirEntry[]> {
    return this.memoirEntries
      .filter(entry => entry.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getMemoirEntry(id: number): Promise<MemoirEntry | undefined> {
    return this.memoirEntries.find(entry => entry.id === id);
  }

  async createMemoirEntry(insertEntry: InsertMemoirEntry): Promise<MemoirEntry> {
    const entry: MemoirEntry = {
      id: this.nextMemoirId++,
      userId: insertEntry.userId,
      title: insertEntry.title,
      content: insertEntry.content,
      period: insertEntry.period || null,
      createdAt: new Date(),
    };
    this.memoirEntries.push(entry);
    return entry;
  }

  async updateMemoirEntry(id: number, updateEntry: Partial<InsertMemoirEntry>): Promise<MemoirEntry | undefined> {
    const index = this.memoirEntries.findIndex(entry => entry.id === id);
    if (index === -1) return undefined;
    
    this.memoirEntries[index] = { ...this.memoirEntries[index], ...updateEntry };
    return this.memoirEntries[index];
  }

  async deleteMemoirEntry(id: number): Promise<boolean> {
    const index = this.memoirEntries.findIndex(entry => entry.id === id);
    if (index === -1) return false;
    
    this.memoirEntries.splice(index, 1);
    return true;
  }

  // 기록 기능 - 감정 기록
  async getEmotionRecords(userId: number, year?: number, month?: number): Promise<EmotionRecord[]> {
    return this.emotionRecords
      .filter(record => {
        if (record.userId !== userId) return false;
        if (year && month) {
          const recordDate = new Date(record.date);
          return recordDate.getFullYear() === year && recordDate.getMonth() + 1 === month;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getEmotionRecord(id: number): Promise<EmotionRecord | undefined> {
    return this.emotionRecords.find(record => record.id === id);
  }

  async createEmotionRecord(insertRecord: InsertEmotionRecord): Promise<EmotionRecord> {
    const record: EmotionRecord = {
      id: this.nextEmotionRecordId++,
      userId: insertRecord.userId,
      date: insertRecord.date,
      emotion: insertRecord.emotion,
      memo: insertRecord.memo || null,
      photos: insertRecord.photos || [],
      createdAt: new Date(),
    };
    this.emotionRecords.push(record);
    return record;
  }

  async updateEmotionRecord(id: number, updateRecord: Partial<InsertEmotionRecord>): Promise<EmotionRecord | undefined> {
    const index = this.emotionRecords.findIndex(record => record.id === id);
    if (index === -1) return undefined;
    
    this.emotionRecords[index] = { ...this.emotionRecords[index], ...updateRecord };
    return this.emotionRecords[index];
  }

  async deleteEmotionRecord(id: number): Promise<boolean> {
    const index = this.emotionRecords.findIndex(record => record.id === id);
    if (index === -1) return false;
    
    this.emotionRecords.splice(index, 1);
    return true;
  }

  // 기록 기능 - 활동 기록
  async getActivityRecords(userId: number, emotionRecordId?: number): Promise<ActivityRecord[]> {
    return this.activityRecords
      .filter(record => {
        if (record.userId !== userId) return false;
        if (emotionRecordId && record.emotionRecordId !== emotionRecordId) return false;
        return true;
      })
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getActivityRecord(id: number): Promise<ActivityRecord | undefined> {
    return this.activityRecords.find(record => record.id === id);
  }

  async createActivityRecord(insertRecord: InsertActivityRecord): Promise<ActivityRecord> {
    const record: ActivityRecord = {
      id: this.nextActivityRecordId++,
      userId: insertRecord.userId,
      emotionRecordId: insertRecord.emotionRecordId,
      activityId: insertRecord.activityId,
      duration: insertRecord.duration || null,
      intensity: insertRecord.intensity || null,
      notes: insertRecord.notes || null,
      createdAt: new Date(),
    };
    this.activityRecords.push(record);
    return record;
  }

  async updateActivityRecord(id: number, updateRecord: Partial<InsertActivityRecord>): Promise<ActivityRecord | undefined> {
    const index = this.activityRecords.findIndex(record => record.id === id);
    if (index === -1) return undefined;
    
    this.activityRecords[index] = { ...this.activityRecords[index], ...updateRecord };
    return this.activityRecords[index];
  }

  async deleteActivityRecord(id: number): Promise<boolean> {
    const index = this.activityRecords.findIndex(record => record.id === id);
    if (index === -1) return false;
    
    this.activityRecords.splice(index, 1);
    return true;
  }

  // 기록 기능 - 활동 목록
  async getActivities(userId: number): Promise<Activity[]> {
    return this.activities
      .filter(activity => activity.userId === userId || activity.isDefault)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.find(activity => activity.id === id);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const activity: Activity = {
      id: this.nextActivityId++,
      userId: insertActivity.userId || null,
      name: insertActivity.name,
      icon: insertActivity.icon,
      category: insertActivity.category,
      isDefault: insertActivity.isDefault ?? false,
      createdAt: new Date(),
    };
    this.activities.push(activity);
    return activity;
  }

  async updateActivity(id: number, updateActivity: Partial<InsertActivity>): Promise<Activity | undefined> {
    const index = this.activities.findIndex(activity => activity.id === id);
    if (index === -1) return undefined;
    
    this.activities[index] = { ...this.activities[index], ...updateActivity };
    return this.activities[index];
  }

  async deleteActivity(id: number): Promise<boolean> {
    const index = this.activities.findIndex(activity => activity.id === id);
    if (index === -1) return false;
    
    this.activities.splice(index, 1);
    return true;
  }

  // 기록 기능 - 사용자 설정
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return this.userSettings.find(settings => settings.userId === userId);
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const settings: UserSettings = {
      id: this.nextUserSettingsId++,
      userId: insertSettings.userId,
      theme: insertSettings.theme || "blue",
      emotionIcon: insertSettings.emotionIcon || "bean",
      dailyReminder: insertSettings.dailyReminder ?? true,
      reminderTime: insertSettings.reminderTime || "21:00",
      weekStart: insertSettings.weekStart ?? 0,
      createdAt: new Date(),
    };
    this.userSettings.push(settings);
    return settings;
  }

  async updateUserSettings(userId: number, updateSettings: Partial<InsertUserSettings>): Promise<UserSettings | undefined> {
    const index = this.userSettings.findIndex(settings => settings.userId === userId);
    if (index === -1) return undefined;
    
    this.userSettings[index] = { ...this.userSettings[index], ...updateSettings };
    return this.userSettings[index];
  }

  // 게임화 - 업적 시스템 (MemStorage 구현)
  async getAchievements(): Promise<Achievement[]> {
    return Promise.resolve([]);
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return Promise.resolve([]);
  }

  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    return Promise.resolve({} as UserAchievement);
  }

  async updateUserAchievementProgress(userId: number, achievementId: number, progress: number): Promise<UserAchievement | undefined> {
    return Promise.resolve(undefined);
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    return Promise.resolve(undefined);
  }

  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    return Promise.resolve({} as UserStats);
  }

  async updateUserStats(userId: number, stats: Partial<InsertUserStats>): Promise<UserStats | undefined> {
    return Promise.resolve(undefined);
  }

  async checkAndUnlockAchievements(userId: number): Promise<Achievement[]> {
    return Promise.resolve([]);
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserPreferences(id: number, preferences: { useDiary?: boolean; useMemoir?: boolean; useRecord?: boolean; menuConfigured?: boolean }): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(preferences)
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async getDiaryEntries(userId: number): Promise<DiaryEntry[]> {
    return await db
      .select()
      .from(diaryEntries)
      .where(eq(diaryEntries.userId, userId))
      .orderBy(desc(diaryEntries.createdAt));
  }

  async getDiaryEntry(id: number): Promise<DiaryEntry | undefined> {
    const [entry] = await db.select().from(diaryEntries).where(eq(diaryEntries.id, id));
    return entry || undefined;
  }

  async createDiaryEntry(insertEntry: InsertDiaryEntry): Promise<DiaryEntry> {
    const [entry] = await db
      .insert(diaryEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async updateDiaryEntry(id: number, updateEntry: Partial<InsertDiaryEntry>): Promise<DiaryEntry | undefined> {
    const [updated] = await db
      .update(diaryEntries)
      .set(updateEntry)
      .where(eq(diaryEntries.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDiaryEntry(id: number): Promise<boolean> {
    const result = await db.delete(diaryEntries).where(eq(diaryEntries.id, id));
    return result.length > 0;
  }

  async searchDiaryEntries(query: string, userId: number): Promise<DiaryEntry[]> {
    return await db
      .select()
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.userId, userId),
          or(
            like(diaryEntries.content, `%${query}%`),
            like(diaryEntries.emotion, `%${query}%`)
          )
        )
      )
      .orderBy(desc(diaryEntries.createdAt));
  }

  async getMemoirEntries(userId: number): Promise<MemoirEntry[]> {
    return await db
      .select()
      .from(memoirEntries)
      .where(eq(memoirEntries.userId, userId))
      .orderBy(desc(memoirEntries.createdAt));
  }

  async getMemoirEntry(id: number): Promise<MemoirEntry | undefined> {
    const [entry] = await db.select().from(memoirEntries).where(eq(memoirEntries.id, id));
    return entry || undefined;
  }

  async createMemoirEntry(insertEntry: InsertMemoirEntry): Promise<MemoirEntry> {
    const [entry] = await db
      .insert(memoirEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async updateMemoirEntry(id: number, updateEntry: Partial<InsertMemoirEntry>): Promise<MemoirEntry | undefined> {
    const [updated] = await db
      .update(memoirEntries)
      .set(updateEntry)
      .where(eq(memoirEntries.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMemoirEntry(id: number): Promise<boolean> {
    const result = await db.delete(memoirEntries).where(eq(memoirEntries.id, id));
    return result.length > 0;
  }

  async getDiaryAnalysis(diaryEntryId: number): Promise<DiaryAnalysis | undefined> {
    const [analysis] = await db.select().from(diaryAnalyses).where(eq(diaryAnalyses.diaryEntryId, diaryEntryId));
    return analysis || undefined;
  }

  async createDiaryAnalysis(insertAnalysis: InsertDiaryAnalysis): Promise<DiaryAnalysis> {
    const [analysis] = await db
      .insert(diaryAnalyses)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async updateDiaryAnalysis(id: number, updateAnalysis: Partial<InsertDiaryAnalysis>): Promise<DiaryAnalysis | undefined> {
    const [updated] = await db
      .update(diaryAnalyses)
      .set(updateAnalysis)
      .where(eq(diaryAnalyses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDiaryAnalysis(diaryEntryId: number): Promise<boolean> {
    const result = await db.delete(diaryAnalyses).where(eq(diaryAnalyses.diaryEntryId, diaryEntryId));
    return result.length > 0;
  }

  // 기록 기능 - 감정 기록
  async getEmotionRecords(userId: number, year?: number, month?: number): Promise<EmotionRecord[]> {
    let conditions = [eq(emotionRecords.userId, userId)];
    
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      conditions.push(
        sql`${emotionRecords.date} >= ${startDate.toISOString().split('T')[0]} AND ${emotionRecords.date} <= ${endDate.toISOString().split('T')[0]}`
      );
    }

    return await db
      .select()
      .from(emotionRecords)
      .where(and(...conditions))
      .orderBy(desc(emotionRecords.date));
  }

  async getEmotionRecord(id: number): Promise<EmotionRecord | undefined> {
    const [record] = await db.select().from(emotionRecords).where(eq(emotionRecords.id, id));
    return record || undefined;
  }

  async createEmotionRecord(insertRecord: InsertEmotionRecord): Promise<EmotionRecord> {
    const [record] = await db
      .insert(emotionRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  async updateEmotionRecord(id: number, updateRecord: Partial<InsertEmotionRecord>): Promise<EmotionRecord | undefined> {
    const [updated] = await db
      .update(emotionRecords)
      .set(updateRecord)
      .where(eq(emotionRecords.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEmotionRecord(id: number): Promise<boolean> {
    const result = await db.delete(emotionRecords).where(eq(emotionRecords.id, id));
    return result.length > 0;
  }

  // 기록 기능 - 활동 기록
  async getActivityRecords(userId: number, emotionRecordId?: number): Promise<ActivityRecord[]> {
    let conditions = [eq(activityRecords.userId, userId)];
    
    if (emotionRecordId) {
      conditions.push(eq(activityRecords.emotionRecordId, emotionRecordId));
    }

    return await db
      .select()
      .from(activityRecords)
      .where(and(...conditions))
      .orderBy(desc(activityRecords.createdAt));
  }

  async getActivityRecord(id: number): Promise<ActivityRecord | undefined> {
    const [record] = await db.select().from(activityRecords).where(eq(activityRecords.id, id));
    return record || undefined;
  }

  async createActivityRecord(insertRecord: InsertActivityRecord): Promise<ActivityRecord> {
    const [record] = await db
      .insert(activityRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  async updateActivityRecord(id: number, updateRecord: Partial<InsertActivityRecord>): Promise<ActivityRecord | undefined> {
    const [updated] = await db
      .update(activityRecords)
      .set(updateRecord)
      .where(eq(activityRecords.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteActivityRecord(id: number): Promise<boolean> {
    const result = await db.delete(activityRecords).where(eq(activityRecords.id, id));
    return result.length > 0;
  }

  // 기록 기능 - 활동 목록
  async getActivities(userId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(or(eq(activities.userId, userId), eq(activities.isDefault, true)))
      .orderBy(activities.name);
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async updateActivity(id: number, updateActivity: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [updated] = await db
      .update(activities)
      .set(updateActivity)
      .where(eq(activities.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return result.length > 0;
  }

  // 기록 기능 - 사용자 설정
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async updateUserSettings(userId: number, updateSettings: Partial<InsertUserSettings>): Promise<UserSettings | undefined> {
    const [updated] = await db
      .update(userSettings)
      .set(updateSettings)
      .where(eq(userSettings.userId, userId))
      .returning();
    return updated || undefined;
  }

  // 게임화 - 업적 시스템
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.isActive, true)).orderBy(achievements.points);
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const results = await db.select()
      .from(userAchievements)
      .leftJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));
    
    return results.map(result => ({
      ...result.user_achievements,
      achievement: result.achievements!
    }));
  }

  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const [result] = await db.insert(userAchievements).values(userAchievement).returning();
    return result;
  }

  async updateUserAchievementProgress(userId: number, achievementId: number, progress: number): Promise<UserAchievement | undefined> {
    const [result] = await db.update(userAchievements)
      .set({ progress, isCompleted: progress >= 100 })
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)))
      .returning();
    return result;
  }

  // 게임화 - 사용자 통계
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const [result] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return result;
  }

  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    const [result] = await db.insert(userStats).values(stats).returning();
    return result;
  }

  async updateUserStats(userId: number, stats: Partial<InsertUserStats>): Promise<UserStats | undefined> {
    const [result] = await db.update(userStats)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(userStats.userId, userId))
      .returning();
    return result;
  }

  async checkAndUnlockAchievements(userId: number): Promise<Achievement[]> {
    const userStatsData = await this.getUserStats(userId);
    if (!userStatsData) return [];

    const achievementsList = await this.getAchievements();
    const userAchievementsList = await this.getUserAchievements(userId);
    const unlockedIds = userAchievementsList.map(ua => ua.achievementId);
    
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of achievementsList) {
      if (unlockedIds.includes(achievement.id)) continue;

      const condition = achievement.condition as any;
      let isUnlocked = false;

      switch (achievement.type) {
        case 'diary':
          if (condition.count && (userStatsData.totalDiaryEntries || 0) >= condition.count) {
            isUnlocked = true;
          }
          break;
        case 'memoir':
          if (condition.count && (userStatsData.totalMemoirEntries || 0) >= condition.count) {
            isUnlocked = true;
          }
          break;
        case 'record':
          if (condition.count && (userStatsData.totalEmotionRecords || 0) >= condition.count) {
            isUnlocked = true;
          }
          break;
        case 'streak':
          if (condition.days && (userStatsData.currentStreak || 0) >= condition.days) {
            isUnlocked = true;
          }
          break;
      }

      if (isUnlocked) {
        await this.createUserAchievement({
          userId,
          achievementId: achievement.id,
          isCompleted: true,
        });
        
        // 포인트 추가
        await this.updateUserStats(userId, {
          totalPoints: (userStatsData.totalPoints || 0) + (achievement.points || 0),
        });
        
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  // 업적 초기화 (첫 실행 시)
  async initializeAchievements(): Promise<void> {
    const existingAchievements = await db.select().from(achievements);
    if (existingAchievements.length > 0) return;

    const defaultAchievements = [
      {
        name: "첫 번째 일기",
        description: "첫 번째 일기를 작성했습니다",
        icon: "🌱",
        type: "diary",
        condition: { count: 1 },
        points: 10,
        rarity: "common"
      },
      {
        name: "일기 애호가",
        description: "일기를 10번 작성했습니다",
        icon: "📝",
        type: "diary",
        condition: { count: 10 },
        points: 50,
        rarity: "rare"
      },
      {
        name: "일기 마스터",
        description: "일기를 50번 작성했습니다",
        icon: "📚",
        type: "diary",
        condition: { count: 50 },
        points: 200,
        rarity: "epic"
      },
      {
        name: "첫 번째 회고",
        description: "첫 번째 회고록을 작성했습니다",
        icon: "🎯",
        type: "memoir",
        condition: { count: 1 },
        points: 15,
        rarity: "common"
      },
      {
        name: "회고의 달인",
        description: "회고록을 20번 작성했습니다",
        icon: "🏆",
        type: "memoir",
        condition: { count: 20 },
        points: 150,
        rarity: "epic"
      },
      {
        name: "감정 기록자",
        description: "첫 번째 감정을 기록했습니다",
        icon: "💙",
        type: "record",
        condition: { count: 1 },
        points: 10,
        rarity: "common"
      },
      {
        name: "감정 추적자",
        description: "감정을 30번 기록했습니다",
        icon: "📊",
        type: "record",
        condition: { count: 30 },
        points: 100,
        rarity: "rare"
      },
      {
        name: "3일 연속",
        description: "3일 연속으로 기록했습니다",
        icon: "🔥",
        type: "streak",
        condition: { days: 3 },
        points: 30,
        rarity: "rare"
      },
      {
        name: "일주일 챌린지",
        description: "7일 연속으로 기록했습니다",
        icon: "⚡",
        type: "streak",
        condition: { days: 7 },
        points: 100,
        rarity: "epic"
      },
      {
        name: "한 달 챌린지",
        description: "30일 연속으로 기록했습니다",
        icon: "👑",
        type: "streak",
        condition: { days: 30 },
        points: 500,
        rarity: "legendary"
      }
    ];

    try {
      for (const achievement of defaultAchievements) {
        await db.insert(achievements).values(achievement).onConflictDoNothing();
      }
    } catch (error) {
      console.error('Failed to initialize achievements:', error);
    }
  }
}

// Use DatabaseStorage with Supabase
export const storage = new DatabaseStorage();

// Initialize default activities and achievements on startup
(async () => {
  try {
    // Initialize achievements
    await storage.initializeAchievements();
    
    const defaultActivities = [
      { name: "운동", icon: "🏃‍♀️", category: "건강", isDefault: true },
      { name: "독서", icon: "📚", category: "학습", isDefault: true },
      { name: "요리", icon: "🍳", category: "생활", isDefault: true },
      { name: "영화감상", icon: "🎬", category: "여가", isDefault: true },
      { name: "음악듣기", icon: "🎵", category: "여가", isDefault: true },
      { name: "산책", icon: "🚶‍♀️", category: "건강", isDefault: true },
      { name: "공부", icon: "📖", category: "학습", isDefault: true },
      { name: "친구만남", icon: "👥", category: "사회", isDefault: true },
      { name: "게임", icon: "🎮", category: "여가", isDefault: true },
      { name: "쇼핑", icon: "🛍️", category: "생활", isDefault: true },
      { name: "청소", icon: "🧹", category: "생활", isDefault: true },
      { name: "잠자기", icon: "😴", category: "건강", isDefault: true },
    ];

    for (const activity of defaultActivities) {
      try {
        await db.insert(activities).values({
          ...activity,
          userId: 0 // 기본 활동은 userId 0으로 설정
        }).onConflictDoNothing();
      } catch (error) {
        // 활동이 이미 존재하는 경우 무시
      }
    }
  } catch (error) {
    console.log("Default data initialization skipped");
  }
})();

// MemStorage is still available as backup
// export const storage = new MemStorage();

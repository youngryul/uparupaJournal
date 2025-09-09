import { 
  users, 
  diaryEntries,
  diaryAnalyses,
  memoirEntries,
  periodRecords,
  type User, 
  type InsertUser, 
  type DiaryEntry, 
  type InsertDiaryEntry,
  type DiaryAnalysis,
  type InsertDiaryAnalysis,
  type MemoirEntry,
  type InsertMemoirEntry,
  type PeriodRecord,
  type InsertPeriodRecord,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPreferences(id: number, preferences: { useDiary?: boolean; useMemoir?: boolean; usePeriodTracker?: boolean; menuConfigured?: boolean; showInstallPrompt?: boolean }): Promise<User | undefined>;
  
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

  getPeriodRecords(userId: number): Promise<PeriodRecord[]>;
  getPeriodRecord(id: number): Promise<PeriodRecord | undefined>;
  createPeriodRecord(record: InsertPeriodRecord): Promise<PeriodRecord>;
  updatePeriodRecord(id: number, record: Partial<InsertPeriodRecord>): Promise<PeriodRecord | undefined>;
  deletePeriodRecord(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: User[] = [];
  private diaryEntries: DiaryEntry[] = [];
  private diaryAnalyses: DiaryAnalysis[] = [];
  private memoirEntries: MemoirEntry[] = [];
  private periodRecords: PeriodRecord[] = [];
  private nextUserId = 1;
  private nextEntryId = 1;
  private nextAnalysisId = 1;
  private nextMemoirId = 1;
  private nextPeriodRecordId = 1;

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
      usePeriodTracker: insertUser.usePeriodTracker ?? false,
      menuConfigured: insertUser.menuConfigured ?? false,
      showInstallPrompt: insertUser.showInstallPrompt ?? true,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateUserPreferences(id: number, preferences: { useDiary?: boolean; useMemoir?: boolean; usePeriodTracker?: boolean; menuConfigured?: boolean; showInstallPrompt?: boolean }): Promise<User | undefined> {
    const user = this.users.find(u => u.id === id);
    if (!user) return undefined;
    
    if (preferences.useDiary !== undefined) user.useDiary = preferences.useDiary;
    if (preferences.useMemoir !== undefined) user.useMemoir = preferences.useMemoir;
    if (preferences.usePeriodTracker !== undefined) user.usePeriodTracker = preferences.usePeriodTracker;
    if (preferences.menuConfigured !== undefined) user.menuConfigured = preferences.menuConfigured;
    if (preferences.showInstallPrompt !== undefined) user.showInstallPrompt = preferences.showInstallPrompt;
    
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

  async getPeriodRecords(userId: number): Promise<PeriodRecord[]> {
    return this.periodRecords
      .filter(record => record.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getPeriodRecord(id: number): Promise<PeriodRecord | undefined> {
    return this.periodRecords.find(record => record.id === id);
  }

  async createPeriodRecord(insertRecord: InsertPeriodRecord): Promise<PeriodRecord> {
    const record: PeriodRecord = {
      id: this.nextPeriodRecordId++,
      userId: insertRecord.userId,
      date: insertRecord.date,
      type: insertRecord.type,
      flow: insertRecord.flow || null,
      symptoms: insertRecord.symptoms || null,
      mood: insertRecord.mood || null,
      notes: insertRecord.notes || null,
      createdAt: new Date(),
    };
    this.periodRecords.push(record);
    return record;
  }

  async updatePeriodRecord(id: number, updateRecord: Partial<InsertPeriodRecord>): Promise<PeriodRecord | undefined> {
    const index = this.periodRecords.findIndex(record => record.id === id);
    if (index === -1) return undefined;
    
    this.periodRecords[index] = { ...this.periodRecords[index], ...updateRecord };
    return this.periodRecords[index];
  }

  async deletePeriodRecord(id: number): Promise<boolean> {
    const index = this.periodRecords.findIndex(record => record.id === id);
    if (index === -1) return false;
    
    this.periodRecords.splice(index, 1);
    return true;
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

  async updateUserPreferences(id: number, preferences: { useDiary?: boolean; useMemoir?: boolean; usePeriodTracker?: boolean; menuConfigured?: boolean; showInstallPrompt?: boolean }): Promise<User | undefined> {
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

  async getPeriodRecords(userId: number): Promise<PeriodRecord[]> {
    return await db
      .select()
      .from(periodRecords)
      .where(eq(periodRecords.userId, userId))
      .orderBy(desc(periodRecords.createdAt));
  }

  async getPeriodRecord(id: number): Promise<PeriodRecord | undefined> {
    const [record] = await db.select().from(periodRecords).where(eq(periodRecords.id, id));
    return record || undefined;
  }

  async createPeriodRecord(insertRecord: InsertPeriodRecord): Promise<PeriodRecord> {
    const [record] = await db
      .insert(periodRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  async updatePeriodRecord(id: number, updateRecord: Partial<InsertPeriodRecord>): Promise<PeriodRecord | undefined> {
    const [updated] = await db
      .update(periodRecords)
      .set(updateRecord)
      .where(eq(periodRecords.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePeriodRecord(id: number): Promise<boolean> {
    const result = await db.delete(periodRecords).where(eq(periodRecords.id, id));
    return result.length > 0;
  }
}

// Use DatabaseStorage with Supabase
export const storage = new DatabaseStorage();

// MemStorage is still available as backup
// export const storage = new MemStorage();

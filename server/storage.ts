import { 
  users, 
  diaryEntries, 
  type User, 
  type InsertUser, 
  type DiaryEntry, 
  type InsertDiaryEntry 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getDiaryEntries(userId: number): Promise<DiaryEntry[]>;
  getDiaryEntry(id: number): Promise<DiaryEntry | undefined>;
  createDiaryEntry(entry: InsertDiaryEntry): Promise<DiaryEntry>;
  updateDiaryEntry(id: number, entry: Partial<InsertDiaryEntry>): Promise<DiaryEntry | undefined>;
  deleteDiaryEntry(id: number): Promise<boolean>;
  searchDiaryEntries(query: string, userId: number): Promise<DiaryEntry[]>;
}

export class MemStorage implements IStorage {
  private users: User[] = [];
  private diaryEntries: DiaryEntry[] = [];
  private nextUserId = 1;
  private nextEntryId = 1;

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
      createdAt: new Date(),
    };
    this.users.push(user);
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
    return (result.rowCount ?? 0) > 0;
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
}

// Use DatabaseStorage with Supabase
export const storage = new DatabaseStorage();

// MemStorage is still available as backup
// export const storage = new MemStorage();

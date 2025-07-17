import { users, diaryEntries, type User, type InsertUser, type DiaryEntry, type InsertDiaryEntry } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getDiaryEntries(): Promise<DiaryEntry[]>;
  getDiaryEntry(id: number): Promise<DiaryEntry | undefined>;
  createDiaryEntry(entry: InsertDiaryEntry): Promise<DiaryEntry>;
  updateDiaryEntry(id: number, entry: Partial<InsertDiaryEntry>): Promise<DiaryEntry | undefined>;
  deleteDiaryEntry(id: number): Promise<boolean>;
  searchDiaryEntries(query: string): Promise<DiaryEntry[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private diaryEntries: Map<number, DiaryEntry>;
  private currentUserId: number;
  private currentDiaryId: number;

  constructor() {
    this.users = new Map();
    this.diaryEntries = new Map();
    this.currentUserId = 1;
    this.currentDiaryId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDiaryEntries(): Promise<DiaryEntry[]> {
    return Array.from(this.diaryEntries.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getDiaryEntry(id: number): Promise<DiaryEntry | undefined> {
    return this.diaryEntries.get(id);
  }

  async createDiaryEntry(insertEntry: InsertDiaryEntry): Promise<DiaryEntry> {
    const id = this.currentDiaryId++;
    const entry: DiaryEntry = { 
      ...insertEntry, 
      id,
      createdAt: new Date().toISOString()
    };
    this.diaryEntries.set(id, entry);
    return entry;
  }

  async updateDiaryEntry(id: number, updateEntry: Partial<InsertDiaryEntry>): Promise<DiaryEntry | undefined> {
    const existing = this.diaryEntries.get(id);
    if (!existing) return undefined;

    const updated: DiaryEntry = { ...existing, ...updateEntry };
    this.diaryEntries.set(id, updated);
    return updated;
  }

  async deleteDiaryEntry(id: number): Promise<boolean> {
    return this.diaryEntries.delete(id);
  }

  async searchDiaryEntries(query: string): Promise<DiaryEntry[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.diaryEntries.values())
      .filter(entry => 
        entry.content.toLowerCase().includes(lowercaseQuery) ||
        entry.emotion.toLowerCase().includes(lowercaseQuery)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const storage = new MemStorage();

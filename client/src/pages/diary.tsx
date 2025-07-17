import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Menu, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiaryEntryForm } from "@/components/diary-entry-form";
import { DiaryEntriesList } from "@/components/diary-entries-list";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DiaryEntry } from "@shared/schema";

export default function DiaryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showWriteForm, setShowWriteForm] = useState(true);
  const isMobile = useIsMobile();

  const { data: entries = [], isLoading, refetch } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/diary-entries"],
  });

  const filteredEntries = entries.filter(entry => 
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.emotion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft to-cloud-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-sky-light rounded-full flex items-center justify-center text-2xl animate-float">
                🌸
              </div>
              <h1 className="text-2xl font-bold text-sky-800">우파루파 일기장</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-600 w-4 h-4" />
                <Input
                  placeholder="일기 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-48 bg-sky-light/10 border-sky-light/50 focus:border-sky-light"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 bg-sky-light/30 hover:bg-sky-light/50 text-sky-700"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Write Form */}
        {showWriteForm && (
          <DiaryEntryForm onSuccess={() => {
            refetch();
            setShowWriteForm(false);
          }} />
        )}

        {/* Entries List */}
        <DiaryEntriesList 
          entries={filteredEntries} 
          isLoading={isLoading}
          onEntryUpdated={refetch}
        />
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setShowWriteForm(true)}
          className="w-16 h-16 bg-gradient-to-r from-sky-light to-sky-soft text-white rounded-full shadow-2xl hover:from-sky-soft hover:to-sky-light transition-all transform hover:scale-110"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-sky-light/30 z-30">
          <div className="flex justify-around items-center py-4">
            <Button 
              variant="ghost" 
              className="flex flex-col items-center space-y-1 text-sky-700"
              onClick={() => setShowWriteForm(true)}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">일기쓰기</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center space-y-1 text-sky-600"
              onClick={() => setShowWriteForm(false)}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs">일기목록</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center space-y-1 text-sky-600"
            >
              <Search className="h-5 w-5" />
              <span className="text-xs">검색</span>
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}

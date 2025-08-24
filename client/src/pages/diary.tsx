import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDiaryEntrySchema, type InsertDiaryEntry, type DiaryEntry } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Plus, Clock, Edit3, Trash2, Brain } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { EmotionSelector } from "@/components/emotion-selector";
import { AIAnalysisModal } from "@/components/ai-analysis-modal";

export default function DiaryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [analysisStatuses, setAnalysisStatuses] = useState<Record<number, boolean>>({});

  const { data: diaryEntries = [], isLoading } = useQuery<DiaryEntry[]>({
    queryKey: ['/api/diary-entries'],
    enabled: !!user,
  });

  // AI 분석 상태 확인
  const checkAnalysisStatuses = async () => {
    const statuses: Record<number, boolean> = {};
    
    for (const entry of diaryEntries) {
      try {
        const response = await apiRequest('GET', `/api/diary-entries/${entry.id}/analysis`);
        if (response.ok) {
          const data = await response.json();
          statuses[entry.id] = data.hasAnalysis;
        }
      } catch (error) {
        console.error(`일기 ${entry.id} 분석 상태 확인 실패:`, error);
        statuses[entry.id] = false;
      }
    }
    
    setAnalysisStatuses(statuses);
  };

  // 일기 목록이 로드되면 AI 분석 상태 확인
  useEffect(() => {
    if (diaryEntries.length > 0) {
      checkAnalysisStatuses();
    }
  }, [diaryEntries]);

  const form = useForm<InsertDiaryEntry>({
    resolver: zodResolver(insertDiaryEntrySchema.omit({ userId: true })),
    defaultValues: {
      content: "",
      emotion: "happy",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertDiaryEntry, "userId">) => {
      const response = await apiRequest('POST', '/api/diary-entries', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diary-entries'] });
      setIsFormOpen(false);
      setEditingEntry(null);
      form.reset();
      toast({
        title: "일기 작성 완료! 💝",
        description: "오늘의 소중한 마음이 저장되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "저장 실패",
        description: error.message || "일기 저장에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Omit<InsertDiaryEntry, "userId">) => {
      const response = await apiRequest('PUT', `/api/diary-entries/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diary-entries'] });
      setIsFormOpen(false);
      setEditingEntry(null);
      form.reset();
      toast({
        title: "일기 수정 완료! ✏️",
        description: "변경사항이 저장되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "수정 실패",
        description: error.message || "일기 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/diary-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diary-entries'] });
      toast({
        title: "일기 삭제 완료",
        description: "일기가 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "삭제 실패",
        description: error.message || "일기 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertDiaryEntry, "userId">) => {
    console.log("폼 제출 데이터:", data); // 디버깅용 로그
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    form.setValue("content", entry.content);
    form.setValue("emotion", entry.emotion);
    form.setValue("date", entry.date || new Date().toISOString().split('T')[0]);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("정말로 이 일기를 삭제하시겠습니까?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewDiary = () => {
    setEditingEntry(null);
    form.reset();
    form.setValue("date", new Date().toISOString().split('T')[0]);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-soft to-cloud-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-sky-light rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-float">
            🌸
          </div>
          <p className="text-sky-600">일기를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft to-cloud-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-sky-light rounded-full flex items-center justify-center text-4xl mx-auto mb-4 animate-float">
            🌸
          </div>
          <h1 className="text-3xl font-bold text-sky-800 mb-2">나의 일기장</h1>
          <p className="text-sky-600">오늘의 소중한 마음과 기억을 기록해보세요</p>
        </div>

        {/* 새 일기 작성 버튼 */}
        {!isFormOpen && (
          <div className="text-center mb-8">
            <Button
              onClick={handleNewDiary}
              data-testid="button-new-diary"
              className="px-8 py-4 bg-gradient-to-r from-sky-light to-sky-soft text-white rounded-2xl font-semibold hover:from-sky-soft hover:to-sky-light transition-all transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              새 일기 작성
            </Button>
          </div>
        )}

        {/* 일기 작성 폼 */}
        {isFormOpen && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
            <CardHeader>
              <CardTitle className="text-sky-800 flex items-center gap-2">
                <Heart className="w-6 h-6" />
                {editingEntry ? "일기 수정" : "새 일기 작성"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="emotion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sky-700 font-semibold">오늘의 감정</FormLabel>
                        <FormControl>
                          <EmotionSelector
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sky-700 font-semibold">일기 날짜</FormLabel>
                        <FormControl>
                          <input
                            type="date"
                            {...field}
                            data-testid="input-diary-date"
                            className="w-full p-4 border-2 border-sky-light/50 rounded-2xl focus:border-sky-light bg-sky-light/5 text-sky-800 focus:outline-none"
                            value={field.value || new Date().toISOString().split('T')[0]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sky-700 font-semibold">일기 내용</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            data-testid="textarea-diary-content"
                            placeholder="오늘 하루는 어땠나요? 기쁜 일, 슬픈 일, 특별했던 순간들을 자유롭게 적어보세요..."
                            rows={8}
                            className="p-4 border-2 border-sky-light/50 rounded-2xl focus:border-sky-light bg-sky-light/5 text-sky-800 resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-diary"
                      className="flex-1 py-4 bg-gradient-to-r from-sky-light to-sky-soft text-white rounded-2xl font-semibold hover:from-sky-soft hover:to-sky-light transition-all transform hover:scale-105 shadow-lg"
                    >
                      {createMutation.isPending || updateMutation.isPending 
                        ? "저장 중..." 
                        : editingEntry ? "수정 완료" : "저장하기"
                      }
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingEntry(null);
                        form.reset();
                      }}
                      data-testid="button-cancel-diary"
                      className="px-8 py-4 border-2 border-sky-light/50 text-sky-700 rounded-2xl font-semibold hover:bg-sky-light/10 transition-colors"
                    >
                      취소
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* 일기 목록 */}
        <div className="space-y-6">
          {diaryEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-sky-light/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                📝
              </div>
              <p className="text-sky-600 mb-4">아직 작성된 일기가 없습니다</p>
              <p className="text-sky-500 text-sm">첫 번째 일기를 작성해보세요!</p>
            </div>
          ) : (
            diaryEntries.map((entry: DiaryEntry) => (
              <Card key={entry.id} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow hover:shadow-2xl transition-shadow">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-sky-light/20 rounded-full flex items-center justify-center">
                          <img 
                            src={`/images/${entry.emotion}.png`} 
                            alt={entry.emotion}
                            className="w-8 h-8"
                            onError={(e) => {
                              // 이미지 로드 실패 시 기본 아이콘 표시
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'w-8 h-8 flex items-center justify-center text-sky-600';
                                fallback.innerHTML = entry.emotion === 'happy' ? '😊' : 
                                                   entry.emotion === 'sad' ? '😢' : 
                                                   entry.emotion === 'angry' ? '😠' : 
                                                   entry.emotion === 'peace' ? '😌' :
                                                   entry.emotion === 'soso' ? '😐' : '😐';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-sky-800 mb-2">
                            {entry.emotion === 'happy' ? '행복한 하루' : 
                             entry.emotion === 'sad' ? '슬픈 하루' : 
                             entry.emotion === 'angry' ? '화난 하루' : 
                             entry.emotion === 'peace' ? '평온한 하루' : 
                             entry.emotion === 'soso' ? '보통인 하루' : '보통인 하루'}
                          </h3>
                          {entry.date && (
                            <p className="text-sky-600 text-xs mb-2 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(entry.date), 'yyyy년 MM월 dd일', { locale: ko })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AIAnalysisModal
                        diaryId={entry.id}
                        content={entry.content}
                        emotion={entry.emotion}
                        onAnalysisComplete={() => {
                          // AI 분석 완료 시 해당 일기의 상태 업데이트
                          setAnalysisStatuses(prev => ({
                            ...prev,
                            [entry.id]: true
                          }));
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-ai-analysis-${entry.id}`}
                            className="text-sky-600 hover:text-sky-700 hover:bg-sky-light/10"
                          >
                            <Brain className={`w-4 h-4 ${analysisStatuses[entry.id] ? 'text-blue-600' : 'text-sky-600'}`} />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                        data-testid={`button-edit-diary-${entry.id}`}
                        className="text-sky-600 hover:text-sky-700 hover:bg-sky-light/10"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        data-testid={`button-delete-diary-${entry.id}`}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="prose prose-sky max-w-none mb-4">
                    <p className="text-sky-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                  </div>
                  
                 
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

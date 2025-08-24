import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMemoirEntrySchema, type InsertMemoirEntry, type MemoirEntry } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BookOpen, Plus, Clock, Edit3, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function MemoirPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MemoirEntry | null>(null);

  const { data: memoirEntries = [], isLoading } = useQuery<MemoirEntry[]>({
    queryKey: ['/api/memoir-entries'],
    enabled: !!user,
  });

  const form = useForm<InsertMemoirEntry>({
    resolver: zodResolver(insertMemoirEntrySchema.omit({ userId: true })),
    defaultValues: {
      title: "",
      content: "",
      period: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertMemoirEntry, "userId">) => {
      const response = await apiRequest('POST', '/api/memoir-entries', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memoir-entries'] });
      setIsFormOpen(false);
      setEditingEntry(null);
      form.reset();
      toast({
        title: "회고록 작성 완료! 📚",
        description: "소중한 기억이 저장되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "저장 실패",
        description: error.message || "회고록 저장에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Omit<InsertMemoirEntry, "userId">) => {
      const response = await apiRequest('PUT', `/api/memoir-entries/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memoir-entries'] });
      setIsFormOpen(false);
      setEditingEntry(null);
      form.reset();
      toast({
        title: "회고록 수정 완료! ✏️",
        description: "변경사항이 저장되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "수정 실패",
        description: error.message || "회고록 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/memoir-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memoir-entries'] });
      toast({
        title: "회고록 삭제 완료",
        description: "회고록이 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "삭제 실패",
        description: error.message || "회고록 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertMemoirEntry, "userId">) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (entry: MemoirEntry) => {
    setEditingEntry(entry);
    form.setValue("title", entry.title);
    form.setValue("content", entry.content);
    form.setValue("period", entry.period || "");
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("정말로 이 회고록을 삭제하시겠습니까?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewMemoir = () => {
    setEditingEntry(null);
    form.reset();
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-soft to-cloud-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-sky-light rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-float">
            📚
          </div>
          <p className="text-sky-600">회고록을 불러오는 중...</p>
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
            📚
          </div>
          <h1 className="text-3xl font-bold text-sky-800 mb-2">나의 회고록</h1>
          <p className="text-sky-600">인생의 소중한 순간들을 되돌아보며 기록해보세요</p>
        </div>

        {/* 새 회고록 작성 버튼 */}
        {!isFormOpen && (
          <div className="text-center mb-8">
            <Button
              onClick={handleNewMemoir}
              data-testid="button-new-memoir"
              className="px-8 py-4 bg-gradient-to-r from-sky-light to-sky-soft text-white rounded-2xl font-semibold hover:from-sky-soft hover:to-sky-light transition-all transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              새 회고록 작성
            </Button>
          </div>
        )}

        {/* 회고록 작성 폼 */}
        {isFormOpen && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
            <CardHeader>
              <CardTitle className="text-sky-800 flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                {editingEntry ? "회고록 수정" : "새 회고록 작성"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sky-700 font-semibold">제목</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-memoir-title"
                            placeholder="예: 대학교 시절의 추억들"
                            className="p-4 border-2 border-sky-light/50 rounded-2xl focus:border-sky-light bg-sky-light/5 text-sky-800"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sky-700 font-semibold">시기 (선택)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-memoir-period"
                            placeholder="예: 2020-2024, 20대 후반, 회사 첫 해 등"
                            value={field.value || ""}
                            className="p-4 border-2 border-sky-light/50 rounded-2xl focus:border-sky-light bg-sky-light/5 text-sky-800"
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
                        <FormLabel className="text-sky-700 font-semibold">내용</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            data-testid="textarea-memoir-content"
                            placeholder="그 시절을 되돌아보며 느낀 것들, 배운 것들, 소중한 기억들을 자유롭게 적어보세요..."
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
                      data-testid="button-save-memoir"
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
                      data-testid="button-cancel-memoir"
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

        {/* 회고록 목록 */}
        <div className="space-y-6">
          {memoirEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-sky-light/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                📝
              </div>
              <p className="text-sky-600 mb-4">아직 작성된 회고록이 없습니다</p>
              <p className="text-sky-500 text-sm">첫 번째 회고록을 작성해보세요!</p>
            </div>
          ) : (
            memoirEntries.map((entry: MemoirEntry) => (
              <Card key={entry.id} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow hover:shadow-2xl transition-shadow">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-sky-800 mb-2">{entry.title}</h3>
                      {entry.period && (
                        <p className="text-sky-600 text-sm mb-2 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {entry.period}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                        data-testid={`button-edit-memoir-${entry.id}`}
                        className="text-sky-600 hover:text-sky-700 hover:bg-sky-light/10"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        data-testid={`button-delete-memoir-${entry.id}`}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="prose prose-sky max-w-none mb-4">
                    <p className="text-sky-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sky-500 text-xs">
                      {entry.createdAt && format(new Date(entry.createdAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                    </p>
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
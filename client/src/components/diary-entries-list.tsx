import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Heart, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DiaryAnalysisComponent } from "./diary-analysis";
import type { DiaryEntry } from "@shared/schema";

interface DiaryEntriesListProps {
  entries: DiaryEntry[];
  isLoading: boolean;
  onEntryUpdated: () => void;
}

export function DiaryEntriesList({ entries, isLoading, onEntryUpdated }: DiaryEntriesListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log("일기 삭제 요청:", id);
      await apiRequest("DELETE", `/api/diary-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diary-entries"] });
      // 즉시 새로고침을 위해 refetch 실행
      queryClient.refetchQueries({ queryKey: ["/api/diary-entries"] });
      toast({
        title: "일기가 삭제되었습니다",
        description: "선택한 일기가 삭제되었어요.",
      });
      onEntryUpdated();
    },
    onError: (error: any) => {
      console.error("일기 삭제 오류:", error);
      toast({
        title: "삭제에 실패했습니다",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const getEmotionLabel = (emotion: string) => {
    const labels = {
      'happy': '행복한 하루',
      'sad': '슬픈 하루',
      'angry': '화난 하루',
      'peace': '평온한 하루',
      'soso': '평범한 하루'
    };
    return labels[emotion as keyof typeof labels] || emotion;
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojis = {
      'happy': '💗',
      'sad': '💙',
      'angry': '❤️',
      'peace': '🌿',
      'soso': '🎉'
    };
    return emojis[emotion as keyof typeof emojis] || '💙';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
        <CardContent className="p-8">
          <div className="text-center text-sky-600">
            <div className="animate-spin w-8 h-8 border-2 border-sky-light border-t-transparent rounded-full mx-auto mb-4"></div>
            일기를 불러오는 중...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-sky-800 flex items-center space-x-2">
            <span>지난 일기들</span>
            <div className="text-2xl animate-wiggle">📖</div>
          </h2>
          <div className="flex items-center space-x-3">
            <Select defaultValue="newest">
              <SelectTrigger className="px-4 py-2 border-2 border-sky-light/50 rounded-full text-sky-700 bg-sky-light/5 focus:border-sky-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">최신순</SelectItem>
                <SelectItem value="oldest">오래된순</SelectItem>
                <SelectItem value="emotion">감정별</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="bg-sky-light/30 text-sky-700 rounded-full hover:bg-sky-light/50 border-sky-light/50"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌸</div>
            <p className="text-sky-600 text-lg">아직 작성된 일기가 없어요</p>
            <p className="text-sky-500 text-sm mt-2">첫 번째 일기를 작성해보세요!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="space-y-4"
              >
                <div className="bg-gradient-to-r from-sky-light/10 to-pink-soft/10 rounded-2xl p-6 border-2 border-sky-light/30 hover:border-sky-light/50 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-sky-800 group-hover:text-sky-600 transition-colors">
                          {formatDate(entry.date)}
                        </h3>
                        <p className="text-sm text-sky-600 flex items-center space-x-2">
                          <span>{getEmotionLabel(entry.emotion)}</span>
                          <span>{getEmotionEmoji(entry.emotion)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 bg-sky-light/30 rounded-full hover:bg-sky-light/50"
                      >
                        <Edit className="h-4 w-4 text-sky-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(entry.id)}
                        disabled={deleteMutation.isPending}
                        className="w-8 h-8 bg-coral-soft/30 rounded-full hover:bg-coral-soft/50"
                        data-testid={`button-delete-${entry.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sky-700 line-clamp-3 mb-4" data-testid={`text-content-${entry.id}`}>
                    {entry.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-sky-600">
                    <span>{entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '시간'}에 작성</span>
                    <span className="flex items-center space-x-1">
                      <Heart className="h-4 w-4 text-pink-500" />
                      <span>♡</span>
                    </span>
                  </div>
                </div>
                
                {/* AI 분석 컴포넌트 */}
                <DiaryAnalysisComponent diaryEntry={entry} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

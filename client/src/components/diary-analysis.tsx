import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Sparkles, RefreshCw, Trash2, Eye, EyeOff, TrendingUp, Tag, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DiaryEntry, DiaryAnalysis } from "@shared/schema";

interface DiaryAnalysisProps {
  diaryEntry: DiaryEntry;
}

export function DiaryAnalysisComponent({ diaryEntry }: DiaryAnalysisProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: analysis, isLoading: isAnalysisLoading, error: analysisError } = useQuery<DiaryAnalysis>({
    queryKey: ["/api/diary-entries", diaryEntry.id, "analysis"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/diary-entries/${diaryEntry.id}/analysis`);
      return response.json();
    },
    retry: false,
  });

  const createAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/diary-entries/${diaryEntry.id}/analysis`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diary-entries", diaryEntry.id, "analysis"] });
      toast({
        title: "AI 분석이 완료되었습니다! 🌸",
        description: "일기 내용을 분석하여 인사이트를 제공합니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "분석에 실패했습니다",
        description: error?.message || "다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const regenerateAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/diary-entries/${diaryEntry.id}/analysis`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diary-entries", diaryEntry.id, "analysis"] });
      toast({
        title: "분석이 새로 생성되었습니다! ✨",
        description: "업데이트된 AI 분석 결과를 확인해보세요.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "재분석에 실패했습니다",
        description: error?.message || "다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const deleteAnalysisMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/diary-entries/${diaryEntry.id}/analysis`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diary-entries", diaryEntry.id, "analysis"] });
      toast({
        title: "분석 결과가 삭제되었습니다",
        description: "필요할 때 다시 분석을 요청할 수 있습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "삭제에 실패했습니다",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const getSentimentColor = (score: number) => {
    if (score >= 50) return "text-green-600";
    if (score >= 0) return "text-blue-600";
    if (score >= -50) return "text-orange-600";
    return "text-red-600";
  };

  const getSentimentEmoji = (score: number) => {
    if (score >= 50) return "😊";
    if (score >= 0) return "😐";
    if (score >= -50) return "😔";
    return "😢";
  };

  const hasAnalysis = analysis && !analysisError;

  return (
    <Card className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border-sky-light/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-sky-700">
            <Brain className="h-5 w-5" />
            AI 일기 분석
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {hasAnalysis && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="button-toggle-analysis">
                    {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            )}
            
            {!hasAnalysis && !isAnalysisLoading && (
              <Button
                onClick={() => createAnalysisMutation.mutate()}
                disabled={createAnalysisMutation.isPending}
                size="sm"
                className="bg-sky-light hover:bg-sky-600 text-white"
                data-testid="button-create-analysis"
              >
                {createAnalysisMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    분석중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    분석 시작
                  </>
                )}
              </Button>
            )}

            {hasAnalysis && (
              <>
                <Button
                  onClick={() => regenerateAnalysisMutation.mutate()}
                  disabled={regenerateAnalysisMutation.isPending}
                  variant="outline"
                  size="sm"
                  data-testid="button-regenerate-analysis"
                >
                  {regenerateAnalysisMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => deleteAnalysisMutation.mutate()}
                  disabled={deleteAnalysisMutation.isPending}
                  variant="outline"
                  size="sm"
                  data-testid="button-delete-analysis"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isAnalysisLoading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-sky-light border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sky-600">AI가 일기를 분석하고 있습니다...</p>
          </div>
        )}

        {!hasAnalysis && !isAnalysisLoading && !createAnalysisMutation.isPending && (
          <div className="text-center py-6">
            <Brain className="h-12 w-12 text-sky-light mx-auto mb-3" />
            <p className="text-sky-600 mb-2">AI가 당신의 일기를 분석해드립니다</p>
            <p className="text-sm text-sky-500">감정 분석, 주제 추출, 개선 제안을 받아보세요</p>
          </div>
        )}

        {hasAnalysis && (
          <>
            {/* 간단한 요약 표시 */}
            <div className="mb-4">
              {analysis.summary && (
                <div className="bg-sky-soft/30 rounded-lg p-3 mb-3">
                  <p className="text-sm text-sky-700 font-medium" data-testid="text-summary">
                    📝 {analysis.summary}
                  </p>
                </div>
              )}

              {analysis.sentimentScore !== null && (
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-sky-600">감정 점수:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${getSentimentColor(analysis.sentimentScore)}`}>
                      {getSentimentEmoji(analysis.sentimentScore)}
                    </span>
                    <span className={`font-medium ${getSentimentColor(analysis.sentimentScore)}`} data-testid="text-sentiment-score">
                      {analysis.sentimentScore > 0 ? '+' : ''}{analysis.sentimentScore}
                    </span>
                    <Progress 
                      value={(analysis.sentimentScore + 100) / 2} 
                      className="w-20 h-2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 상세 분석 결과 */}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleContent className="space-y-4">
                {/* 감정 분석 */}
                {analysis.emotionAnalysis && typeof analysis.emotionAnalysis === 'object' && (
                  <div className="bg-gradient-to-br from-sky-50 to-cloud-white rounded-lg p-4">
                    <h4 className="flex items-center gap-2 text-sm font-medium text-sky-700 mb-3">
                      <TrendingUp className="h-4 w-4" />
                      감정 분석
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-sky-600">주요 감정:</span>
                        <Badge variant="secondary" className="ml-2 bg-sky-light text-white" data-testid="text-primary-emotion">
                          {(analysis.emotionAnalysis as any).primary || '알 수 없음'}
                        </Badge>
                      </div>
                      {(analysis.emotionAnalysis as any).secondary && Array.isArray((analysis.emotionAnalysis as any).secondary) && (analysis.emotionAnalysis as any).secondary.length > 0 && (
                        <div>
                          <span className="text-xs text-sky-600">보조 감정:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {((analysis.emotionAnalysis as any).secondary as string[]).map((emotion: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs" data-testid={`text-secondary-emotion-${index}`}>
                                {emotion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-sky-600">신뢰도:</span>
                        <span className="ml-2 text-sm" data-testid="text-confidence">
                          {Math.round(((analysis.emotionAnalysis as any).confidence || 0) * 100)}%
                        </span>
                        <Progress 
                          value={((analysis.emotionAnalysis as any).confidence || 0) * 100} 
                          className="w-full h-2 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 주제 및 키워드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.themes && analysis.themes.length > 0 && (
                    <div className="bg-gradient-to-br from-sky-50 to-cloud-white rounded-lg p-4">
                      <h4 className="flex items-center gap-2 text-sm font-medium text-sky-700 mb-3">
                        <Tag className="h-4 w-4" />
                        주요 주제
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {analysis.themes.map((theme: string, index: number) => (
                          <Badge key={index} variant="outline" data-testid={`text-theme-${index}`}>
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.keywords && analysis.keywords.length > 0 && (
                    <div className="bg-gradient-to-br from-sky-50 to-cloud-white rounded-lg p-4">
                      <h4 className="flex items-center gap-2 text-sm font-medium text-sky-700 mb-3">
                        <Sparkles className="h-4 w-4" />
                        핵심 키워드
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {analysis.keywords.map((keyword: string, index: number) => (
                          <Badge key={index} variant="secondary" data-testid={`text-keyword-${index}`}>
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI 제안사항 */}
                {analysis.suggestions && (
                  <div className="bg-gradient-to-br from-sky-50 to-cloud-white rounded-lg p-4">
                    <h4 className="flex items-center gap-2 text-sm font-medium text-sky-700 mb-3">
                      <Lightbulb className="h-4 w-4" />
                      AI 제안사항
                    </h4>
                    <p className="text-sm text-sky-600 leading-relaxed" data-testid="text-suggestions">
                      {analysis.suggestions}
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
}
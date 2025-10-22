import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, TrendingUp, Lightbulb, MessageSquare, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIAnalysisModalProps {
  diaryId: number;
  content: string;
  emotion: string;
  trigger: React.ReactNode;
  onAnalysisComplete?: () => void;
}

interface AIAnalysisResult {
  emotionAnalysis: {
    primary: string;
    secondary: string[];
    confidence: number;
  };
  sentimentScore: number;
  themes: string[];
  keywords: string[];
  suggestions: string;
  summary: string;
}

export function AIAnalysisModal({ diaryId, content, emotion, trigger, onAnalysisComplete }: AIAnalysisModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [existingAnalysis, setExistingAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async () => {
      // console.log("AI 분석 요청 시작:", { diaryId, content, emotion });
      const response = await apiRequest('POST', `/api/diary-entries/${diaryId}/analysis`, {
        content,
        emotion
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      // console.log("AI 분석 응답:", data);
      return data;
    },
    onSuccess: (data: AIAnalysisResult) => {
      // console.log("AI 분석 성공:", data);
      setHasAnalysis(true);
      setExistingAnalysis(data);
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
      toast({
        title: "AI 분석 완료! 🧠",
        description: "일기를 분석하여 인사이트를 제공합니다.",
      });
    },
    onError: (error: any) => {
      // console.error("AI 분석 오류:", error);
      toast({
        title: "분석 실패",
        description: error.message || "AI 분석에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // AI 분석 상태 확인
  useEffect(() => {
    const checkAnalysisStatus = async () => {
      try {
        // console.log(`일기 ${diaryId}의 AI 분석 상태 확인 시작`);
        const response = await apiRequest('GET', `/api/diary-entries/${diaryId}/analysis`);
        // console.log('API 응답 상태:', response.status, response.ok);
        
        if (response.ok) {
          const data = await response.json();
          // console.log('AI 분석 상태 확인 결과:', data);
          
          if (data.hasAnalysis && data.analysis) {
            // console.log('기존 분석 결과 발견:', data.analysis);
            setHasAnalysis(true);
            setExistingAnalysis(data.analysis);
            // console.log('상태 설정 완료: hasAnalysis=true, existingAnalysis=설정됨');
          } else {
            // console.log('기존 분석 결과 없음');
            setHasAnalysis(false);
            setExistingAnalysis(null);
            // console.log('상태 설정 완료: hasAnalysis=false, existingAnalysis=null');
          }
        } else {
          // console.log('AI 분석 상태 확인 실패:', response.status);
          setHasAnalysis(false);
          setExistingAnalysis(null);
        }
      } catch (error) {
        // console.error('AI 분석 상태 확인 실패:', error);
        setHasAnalysis(false);
        setExistingAnalysis(null);
      }
    };

    // 모달이 열릴 때마다 상태 확인
    if (isOpen) {
      // console.log('모달 열림, AI 분석 상태 확인 시작');
      // 상태 초기화
      setHasAnalysis(false);
      setExistingAnalysis(null);
      // 약간의 지연 후 상태 확인 (상태 초기화 완료 후)
      setTimeout(() => {
        checkAnalysisStatus();
      }, 100);
    }
  }, [diaryId, isOpen]);

  // 상태 변화 추적
  useEffect(() => {
    // console.log('=== AI 분석 모달 상태 변화 ===');
    // console.log('diaryId:', diaryId);
    // console.log('isOpen:', isOpen);
    // console.log('hasAnalysis:', hasAnalysis);
    // console.log('existingAnalysis:', existingAnalysis ? '있음' : '없음');
    // if (existingAnalysis) {
    //   console.log('existingAnalysis 상세:', {
    //     id: existingAnalysis.id,
    //     diaryEntryId: existingAnalysis.diaryEntryId,
    //     emotionAnalysis: existingAnalysis.emotionAnalysis?.primary
    //   });
    // }
    // console.log('analysisMutation.data:', analysisMutation.data ? '있음' : '없음');
    // console.log('분석 버튼 표시 여부:', !existingAnalysis && !hasAnalysis && !analysisMutation.data);
    // console.log('========================');
  }, [diaryId, isOpen, hasAnalysis, existingAnalysis, analysisMutation.data]);

  const handleAnalyze = () => {
    if (existingAnalysis) {
      // console.log('기존 분석이 있으므로 재분석 진행');
    } else {
      // console.log('새로운 분석 시작');
    }
    analysisMutation.mutate();
  };

  const getSentimentColor = (score: number) => {
    if (score >= 50) return "text-green-600";
    if (score >= 0) return "text-yellow-600";
    return "text-red-600";
  };

  const getSentimentIcon = (score: number) => {
    if (score >= 50) return "😊";
    if (score >= 0) return "😐";
    return "😢";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-sky-800 flex items-center gap-2">
            <Brain className={`w-6 h-6 ${hasAnalysis ? 'text-blue-600' : 'text-sky-800'}`} />
            AI 일기 분석
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기존 분석 결과가 있는 경우 */}
          {existingAnalysis && (
            <div className="space-y-6">
              {/* 감정 분석 */}
              <Card className="bg-gradient-to-r from-pink-soft/20 to-pink-soft/10 border-2 border-pink-soft/50">
                <CardHeader>
                  <CardTitle className="text-pink-700 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    감정 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">주요 감정:</span>
                    <span className="text-pink-700 font-semibold">
                      {existingAnalysis.emotionAnalysis?.primary || "분석 완료"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">감정 점수:</span>
                    <span className={`font-semibold ${getSentimentColor(existingAnalysis.sentimentScore || 0)}`}>
                      {getSentimentIcon(existingAnalysis.sentimentScore || 0)} {existingAnalysis.sentimentScore || 0}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">신뢰도:</span>
                    <span className="text-sky-700 font-semibold">
                      {Math.round((existingAnalysis.emotionAnalysis?.confidence || 0) * 100)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 주요 주제 */}
              <Card className="bg-gradient-to-r from-mint-soft/20 to-mint-soft/10 border-2 border-mint-soft/50">
                <CardHeader>
                  <CardTitle className="text-mint-700 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    주요 주제
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(existingAnalysis.themes || []).map((theme: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-mint-soft/30 text-mint-700 rounded-full text-sm font-medium"
                      >
                        {theme}
                      </span>
                    ))}
                    {(!existingAnalysis.themes || existingAnalysis.themes.length === 0) && (
                      <span className="text-mint-500 text-sm">분석 완료</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 키워드 */}
              <Card className="bg-gradient-to-r from-peach-soft/20 to-peach-soft/10 border-2 border-peach-soft/50">
                <CardHeader>
                  <CardTitle className="text-peach-700 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    핵심 키워드
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(existingAnalysis.keywords || []).map((keyword: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-peach-soft/30 text-peach-700 rounded-full text-sm font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                    {(!existingAnalysis.keywords || existingAnalysis.keywords.length === 0) && (
                      <span className="text-mint-500 text-sm">분석 완료</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 요약 */}
              <Card className="bg-gradient-to-r from-sky-soft/20 to-sky-soft/10 border-2 border-sky-soft/50">
                <CardHeader>
                  <CardTitle className="text-sky-700 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    일기 요약
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sky-700 leading-relaxed">
                    {existingAnalysis.summary || "분석 완료"}
                  </p>
                </CardContent>
              </Card>

              {/* 개선 제안 */}
              <Card className="bg-gradient-to-r from-coral-soft/20 to-coral-soft/10 border-2 border-coral-soft/50">
                <CardHeader>
                  <CardTitle className="text-coral-700 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    AI 제안사항
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-coral-700 leading-relaxed">
                    {existingAnalysis.suggestions || "분석 완료"}
                  </p>
                </CardContent>
              </Card>

              {/* 재분석 버튼 */}
              <div className="text-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={analysisMutation.isPending}
                  variant="outline"
                  className="px-6 py-2 border-2 border-sky-light/50 text-sky-700 rounded-xl hover:bg-sky-light/10"
                >
                  {analysisMutation.isPending ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      재분석 중...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      다시 분석하기
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* 분석 버튼 (기존 분석이 없는 경우에만) */}
          {!existingAnalysis && !hasAnalysis && !analysisMutation.data && (
            <Card className="bg-gradient-to-r from-sky-soft to-sky-light/20 border-2 border-sky-light/50">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-sky-light/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🧠
                </div>
                <h3 className="text-xl font-bold text-sky-800 mb-2">AI로 일기를 분석해보세요</h3>
                <p className="text-sky-600 mb-4">
                  감정 분석, 주요 주제, 키워드 추출, 개선 제안 등을 제공합니다
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={analysisMutation.isPending}
                  className="px-8 py-3 bg-gradient-to-r from-sky-light to-sky-soft text-white rounded-2xl font-semibold hover:from-sky-soft hover:to-sky-light transition-all transform hover:scale-105 shadow-lg"
                >
                  {analysisMutation.isPending ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      AI 분석 시작
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 디버깅 정보 (개발 모드에서만) - 주석 처리됨 */}
          {/* {process.env.NODE_ENV === 'development' && (
            <Card className="bg-gray-100 border border-gray-300">
              <CardContent className="p-4">
                <h4 className="font-bold mb-2">디버깅 정보</h4>
                <div className="text-sm space-y-1">
                  <div>existingAnalysis: {existingAnalysis ? '있음' : '없음'}</div>
                  <div>hasAnalysis: {hasAnalysis ? 'true' : 'false'}</div>
                  <div>analysisMutation.data: {analysisMutation.data ? '있음' : '없음'}</div>
                  <div>분석 버튼 표시: {(!existingAnalysis && !hasAnalysis && !analysisMutation.data) ? '예' : '아니오'}</div>
                </div>
              </CardContent>
            </Card>
          )} */}
        </div>
      </DialogContent>
    </Dialog>
  );
}

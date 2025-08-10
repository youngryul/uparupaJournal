import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDiaryEntrySchema, type InsertDiaryEntry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EmotionSelector } from "./emotion-selector";
import { useToast } from "@/hooks/use-toast";
import { Heart, Save, Eye, TrendingUp, BarChart3 } from "lucide-react";

interface DiaryEntryFormProps {
  onSuccess: () => void;
}

// Emotion analysis keywords for real-time detection
const emotionKeywords = {
  happy: ['행복', '기쁘', '좋', '즐거', '웃', '사랑', '감사', '만족', '신나', '재미', '활기', '밝', '희망', '축하', '성공'],
  sad: ['슬프', '우울', '울', '힘들', '아프', '외로', '절망', '실망', '답답', '괴로', '고통', '불안', '두려', '걱정', '후회'],
  angry: ['화', '짜증', '분노', '열받', '빡치', '성질', '약올', '억울', '분하', '미치', '돌아버리', '열폭', '빈정'],
  calm: ['평온', '차분', '조용', '평화', '안정', '편안', '고요', '여유', '느긋', '담담', '무덤덤', '평범'],
  excited: ['신나', '흥미', '설레', '기대', '열정', '활발', '에너지', '동기', '의욕', '자극', '활력']
};

export function DiaryEntryForm({ onSuccess }: DiaryEntryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");
  const [emotionHistory, setEmotionHistory] = useState<Array<{time: number, emotion: string, intensity: number}>>([]);
  const [currentContent, setCurrentContent] = useState<string>("");

  const form = useForm<Omit<InsertDiaryEntry, 'userId'>>({
    resolver: zodResolver(insertDiaryEntrySchema.omit({ userId: true })),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      emotion: "",
      content: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertDiaryEntry, 'userId'>) => {
      const response = await apiRequest("POST", "/api/diary-entries", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diary-entries"] });
      toast({
        title: "일기가 저장되었습니다! 🌸",
        description: "소중한 하루가 기록되었어요.",
      });
      form.reset();
      setSelectedEmotion("");
      onSuccess();
    },
    onError: () => {
      toast({
        title: "저장에 실패했습니다",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertDiaryEntry, 'userId'>) => {
    createMutation.mutate(data);
  };

  const currentDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Real-time emotion analysis function
  const analyzeEmotion = useMemo(() => {
    return (text: string) => {
      if (!text.trim()) return { emotion: 'neutral', intensity: 0 };
      
      const emotions = Object.entries(emotionKeywords).map(([emotion, keywords]) => {
        const matches = keywords.filter(keyword => text.includes(keyword)).length;
        return { emotion, intensity: matches };
      });
      
      const strongestEmotion = emotions.reduce((prev, current) => 
        prev.intensity > current.intensity ? prev : current
      );
      
      return strongestEmotion.intensity > 0 ? strongestEmotion : { emotion: 'neutral', intensity: 0 };
    };
  }, []);

  // Track emotion changes as user types
  useEffect(() => {
    if (currentContent.length > 10) { // Only analyze after some content
      const analysis = analyzeEmotion(currentContent);
      const now = Date.now();
      
      setEmotionHistory(prev => {
        const newHistory = [...prev, { time: now, emotion: analysis.emotion, intensity: analysis.intensity }];
        // Keep only last 20 entries for performance
        return newHistory.slice(-20);
      });
    }
  }, [currentContent, analyzeEmotion]);

  // Get emotion color for visualization
  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'happy': return 'bg-yellow-400';
      case 'sad': return 'bg-blue-400';
      case 'angry': return 'bg-red-400';
      case 'calm': return 'bg-green-400';
      case 'excited': return 'bg-orange-400';
      default: return 'bg-gray-300';
    }
  };

  // Get emotion emoji
  const getEmotionEmoji = (emotion: string) => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'calm': return '😌';
      case 'excited': return '🤩';
      default: return '😐';
    }
  };

  // Current dominant emotion
  const currentEmotion = useMemo(() => {
    if (emotionHistory.length === 0) return 'neutral';
    const recentEmotions = emotionHistory.slice(-5); // Last 5 entries
    const emotionCounts = recentEmotions.reduce((acc, entry) => {
      acc[entry.emotion] = (acc[entry.emotion] || 0) + entry.intensity;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(emotionCounts).reduce((prev, current) => 
      prev[1] > current[1] ? prev : current
    )[0] || 'neutral';
  }, [emotionHistory]);

  return (
    <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl mb-8 axolotl-shadow">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-sky-800 flex items-center space-x-2">
            <span>오늘의 일기</span>
            <div className="text-2xl animate-bounce-gentle">💙</div>
          </h2>
          
          {/* Real-time emotion indicator */}
          {currentContent.length > 10 && (
            <div className="flex items-center space-x-2 bg-sky-50 px-3 py-2 rounded-2xl border border-sky-200">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span className="text-sm text-sky-700">현재 감정:</span>
              <div className="flex items-center space-x-1">
                <span className="text-lg">{getEmotionEmoji(currentEmotion)}</span>
                <span className="text-sm font-medium text-sky-800 capitalize">
                  {currentEmotion === 'neutral' ? '평온' : 
                   currentEmotion === 'happy' ? '행복' :
                   currentEmotion === 'sad' ? '슬픔' :
                   currentEmotion === 'angry' ? '화남' :
                   currentEmotion === 'calm' ? '차분' :
                   currentEmotion === 'excited' ? '흥미' : '평온'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Emotion visualization chart */}
        {emotionHistory.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl border border-sky-200">
            <div className="flex items-center space-x-2 mb-3">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span className="text-sm font-medium text-sky-700">감정 변화 흐름</span>
            </div>
            
            <div className="flex items-end space-x-1 h-16 overflow-hidden">
              {emotionHistory.slice(-15).map((entry, index) => (
                <div key={index} className="flex flex-col items-center space-y-1">
                  <div 
                    className={`w-3 rounded-t transition-all duration-300 ${getEmotionColor(entry.emotion)}`}
                    style={{ height: `${Math.max(8, (entry.intensity / 3) * 40)}px` }}
                    title={`${getEmotionEmoji(entry.emotion)} ${entry.emotion} (강도: ${entry.intensity})`}
                  />
                  <div className="text-xs opacity-70">
                    {getEmotionEmoji(entry.emotion)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-2 text-xs text-sky-600 text-center">
              글을 쓰면서 감정이 어떻게 변화하는지 실시간으로 보여줍니다
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Field */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sky-700 font-semibold">날짜 선택</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      className="p-4 border-2 border-sky-light/50 rounded-2xl focus:border-sky-light bg-sky-light/5 text-sky-800"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Emotion Selector */}
            <FormField
              control={form.control}
              name="emotion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sky-700 font-semibold">
                    오늘의 기분을 우파루파로 표현해주세요
                  </FormLabel>
                  <FormControl>
                    <EmotionSelector
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        setSelectedEmotion(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Field */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sky-700 font-semibold">
                    오늘 하루는 어떠셨나요?
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setCurrentContent(e.target.value);
                        }}
                        placeholder="오늘 있었던 일들을 자유롭게 적어보세요... 🌸"
                        className="h-48 p-4 border-2 border-sky-light/50 rounded-2xl focus:border-sky-light bg-sky-light/5 text-sky-800 resize-none"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-8 py-3 bg-gradient-to-r from-sky-light to-sky-soft text-white rounded-2xl font-semibold hover:from-sky-soft hover:to-sky-light transition-all transform hover:scale-105 shadow-lg"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? "저장 중..." : "일기 저장"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

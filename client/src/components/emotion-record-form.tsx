import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertEmotionRecordSchema, insertActivityRecordSchema, type InsertEmotionRecord, type Activity } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface EmotionRecordFormProps {
  onClose: () => void;
  onSuccess: () => void;
  date: Date;
}

const EMOTION_LEVELS = [
  { level: 1, label: "매우 나쁨", icon: "😰", color: "bg-red-500" },
  { level: 2, label: "나쁨", icon: "😞", color: "bg-orange-500" },
  { level: 3, label: "보통", icon: "😐", color: "bg-yellow-500" },
  { level: 4, label: "좋음", icon: "😊", color: "bg-green-500" },
  { level: 5, label: "매우 좋음", icon: "😍", color: "bg-blue-500" },
];

export function EmotionRecordForm({ onClose, onSuccess, date }: EmotionRecordFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);

  const form = useForm<InsertEmotionRecord>({
    resolver: zodResolver(insertEmotionRecordSchema.omit({ userId: true })),
    defaultValues: {
      date: date.toISOString().split('T')[0],
      emotion: 3,
      memo: "",
    },
  });

  // 활동 목록 조회
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  // 감정 기록 생성
  const createEmotionRecord = useMutation({
    mutationFn: (data: InsertEmotionRecord) => 
      apiRequest('POST', '/api/emotion-records', data),
    onSuccess: async (emotionRecord) => {
      // 선택된 활동들을 활동 기록으로 저장
      if (selectedActivities.length > 0) {
        const activityPromises = selectedActivities.map(activityId =>
          apiRequest('POST', '/api/activity-records', {
            emotionRecordId: emotionRecord.id,
            activityId,
            userId: emotionRecord.userId,
          })
        );
        await Promise.all(activityPromises);
      }

      queryClient.invalidateQueries({ queryKey: ['/api/emotion-records'] });
      onSuccess();
      toast({
        title: "기록 완료!",
        description: "오늘의 감정과 활동이 성공적으로 기록되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "기록 실패",
        description: error.message || "기록 저장에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmotionRecord) => {
    createEmotionRecord.mutate(data);
  };

  const toggleActivity = (activityId: number) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg bg-white rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold text-sky-800">
            오늘의 기록
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-form"
            className="rounded-full w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 날짜 */}
              <div className="text-center">
                <p className="text-lg font-semibold text-sky-700">
                  {date.toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {/* 감정 레벨 선택 */}
              <FormField
                control={form.control}
                name="emotion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sky-700 font-semibold">
                      오늘의 기분은 어떠세요?
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-5 gap-2">
                        {EMOTION_LEVELS.map((emotion) => (
                          <button
                            key={emotion.level}
                            type="button"
                            onClick={() => field.onChange(emotion.level)}
                            data-testid={`emotion-${emotion.level}`}
                            className={`p-3 rounded-2xl text-center transition-all border-2 ${
                              field.value === emotion.level
                                ? `${emotion.color} border-sky-400 text-white shadow-lg scale-105`
                                : "bg-gray-100 border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            <div className="text-2xl mb-1">{emotion.icon}</div>
                            <div className="text-xs font-medium">{emotion.label}</div>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 활동 선택 */}
              <div className="space-y-3">
                <FormLabel className="text-sky-700 font-semibold">
                  오늘 한 활동을 선택해주세요
                </FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {activities.map((activity) => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => toggleActivity(activity.id)}
                      data-testid={`activity-${activity.id}`}
                      className={`p-3 rounded-xl text-left transition-all border ${
                        selectedActivities.includes(activity.id)
                          ? "bg-sky-100 border-sky-400 text-sky-700"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="text-lg mb-1">{activity.icon}</div>
                      <div className="text-sm font-medium">{activity.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 메모 */}
              <FormField
                control={form.control}
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sky-700 font-semibold">
                      메모 (선택사항)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="오늘 있었던 특별한 일이나 느낌을 자유롭게 적어보세요..."
                        data-testid="input-note"
                        className="rounded-xl border-gray-200 focus:border-sky-400"
                        rows={3}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 제출 버튼 */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="button-cancel"
                  className="flex-1 rounded-2xl"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={createEmotionRecord.isPending}
                  data-testid="button-save-record"
                  className="flex-1 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-2xl hover:from-green-500 hover:to-green-600"
                >
                  {createEmotionRecord.isPending ? "저장 중..." : "기록하기"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
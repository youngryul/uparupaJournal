import { useState } from "react";
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
import { Heart, Save, Eye } from "lucide-react";

interface DiaryEntryFormProps {
  onSuccess: () => void;
}

export function DiaryEntryForm({ onSuccess }: DiaryEntryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");

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



  return (
    <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl mb-8 axolotl-shadow">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-sky-800 flex items-center space-x-2">
            <span>오늘의 일기</span>
            <div className="text-2xl animate-bounce-gentle">💙</div>
          </h2>
          

        </div>



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

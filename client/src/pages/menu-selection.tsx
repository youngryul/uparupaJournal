import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { menuSelectionSchema, type MenuSelectionData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Heart, ArrowRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MenuSelectionProps {
  onComplete: (data: MenuSelectionData) => void;
}

export default function MenuSelectionPage({ onComplete }: MenuSelectionProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MenuSelectionData>({
    resolver: zodResolver(menuSelectionSchema),
    defaultValues: {
      useDiary: true,
      useMemoir: false,
    },
  });

  const onSubmit = async (data: MenuSelectionData) => {
    // 최소 하나의 메뉴는 선택해야 함
    if (!data.useDiary && !data.useMemoir) {
      toast({
        title: "메뉴 선택 필요",
        description: "최소 하나의 메뉴는 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // 사용자 메뉴 설정 업데이트
      const response = await apiRequest('POST', '/api/auth/update-menu-preferences', data);
      
      // 사용자 설정 쿼리 캐시 무효화하여 새로운 설정 반영
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "메뉴 설정 완료!",
        description: "선택하신 메뉴로 우파루파 일기장을 시작하세요!",
      });
      
      onComplete(data);
      
      // 메인 페이지로 이동
      setLocation("/");
      
    } catch (error: any) {
      toast({
        title: "설정 실패",
        description: error.message || "메뉴 설정에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft to-cloud-white flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-peach-soft rounded-full flex items-center justify-center text-4xl mx-auto mb-4 animate-bounce-gentle">
            🌸
          </div>
          <CardTitle className="text-2xl font-bold text-sky-800">
            사용할 메뉴를 선택해주세요
          </CardTitle>
          <p className="text-sky-600 text-sm">
            나중에 언제든 변경할 수 있어요
          </p>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <FormField
                control={form.control}
                name="useDiary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-sky-light/30 p-6 bg-sky-light/5 hover:bg-sky-light/10 transition-colors">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-diary"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none flex-1">
                      <FormLabel className="text-sky-700 font-semibold text-lg flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-soft" />
                        일기장
                      </FormLabel>
                      <p className="text-sky-600 text-sm">
                        매일의 감정과 소중한 순간들을 우파루파와 함께 기록해요
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="useMemoir"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-sky-light/30 p-6 bg-sky-light/5 hover:bg-sky-light/10 transition-colors">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-memoir"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none flex-1">
                      <FormLabel className="text-sky-700 font-semibold text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-sky-600" />
                        회고록
                      </FormLabel>
                      <p className="text-sky-600 text-sm">
                        인생의 중요한 시기와 경험들을 깊이 있게 되돌아보고 정리해요
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                data-testid="button-continue"
                className="w-full py-4 bg-gradient-to-r from-sky-light to-sky-soft text-white rounded-2xl font-semibold hover:from-sky-soft hover:to-sky-light transition-all transform hover:scale-105 shadow-lg"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                {isLoading ? "설정 중..." : "시작하기"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <p className="text-sky-500 text-xs">
              최소 하나의 메뉴는 선택해야 합니다
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
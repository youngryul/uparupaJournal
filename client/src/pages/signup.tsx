import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { signupSchema, type SignupData } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, User, Lock } from "lucide-react";

export default function SignupPage() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupData) => {
    try {
      setIsLoading(true);
      await signup(data);
      toast({
        title: "회원가입 완료! 🎉",
        description: "우파루파 일기장에 오신 것을 환영합니다!",
      });
      // 회원가입 성공 후 메인 페이지로 리다이렉트
      setTimeout(() => {
        setLocation("/");
      }, 1000); // 토스트 메시지를 보여준 후 리다이렉트
    } catch (error: any) {
      toast({
        title: "회원가입 실패",
        description: error.message || "회원가입에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft to-cloud-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-pink-soft rounded-full flex items-center justify-center text-4xl mx-auto mb-4 animate-bounce-gentle">
            🌸
          </div>
          <CardTitle className="text-2xl font-bold text-sky-800">
            우파루파 일기장
          </CardTitle>
          <p className="text-sky-600 text-sm">
            새로운 계정을 만들어보세요
          </p>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sky-700 font-semibold">사용자명</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-600 w-5 h-5" />
                        <Input
                          {...field}
                          placeholder="3-20자 사용자명"
                          className="pl-12 pr-4 py-4 border-2 border-sky-light/50 rounded-2xl focus:border-sky-light bg-sky-light/5 text-sky-800"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sky-700 font-semibold">비밀번호</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-600 w-5 h-5" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="6자 이상 비밀번호"
                          className="pl-12 pr-4 py-4 border-2 border-sky-light/50 rounded-2xl focus:border-sky-light bg-sky-light/5 text-sky-800"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sky-700 font-semibold">비밀번호 확인</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-600 w-5 h-5" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="비밀번호를 다시 입력하세요"
                          className="pl-12 pr-4 py-4 border-2 border-sky-light/50 rounded-2xl focus:border-sky-light bg-sky-light/5 text-sky-800"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-pink-soft to-peach-soft text-white rounded-2xl font-semibold hover:from-peach-soft hover:to-pink-soft transition-all transform hover:scale-105 shadow-lg"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                {isLoading ? "가입 중..." : "회원가입"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sky-600 text-sm">
              이미 계정이 있으신가요?{" "}
              <Link href="/login">
                <span className="text-sky-700 font-semibold hover:text-sky-800 cursor-pointer">
                  로그인
                </span>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
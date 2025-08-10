import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { loginSchema, type LoginData } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { LogIn, User } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    try {
      setIsLoading(true);
      await login(data);
      toast({
        title: "로그인 성공! 🌸",
        description: "우파루파 일기장에 오신 것을 환영합니다!",
      });
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.message || "로그인에 실패했습니다. 다시 시도해주세요.",
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
          <div className="w-20 h-20 bg-sky-light rounded-full flex items-center justify-center text-4xl mx-auto mb-4 animate-float">
            🌸
          </div>
          <CardTitle className="text-2xl font-bold text-sky-800">
            우파루파 일기장
          </CardTitle>
          <p className="text-sky-600 text-sm">
            소중한 추억을 기록해보세요
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
                          placeholder="사용자명을 입력하세요"
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
                        <LogIn className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-600 w-5 h-5" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="비밀번호를 입력하세요"
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
                className="w-full py-4 bg-gradient-to-r from-sky-light to-sky-soft text-white rounded-2xl font-semibold hover:from-sky-soft hover:to-sky-light transition-all transform hover:scale-105 shadow-lg"
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sky-600 text-sm">
              아직 계정이 없으신가요?{" "}
              <Link href="/signup">
                <span className="text-sky-700 font-semibold hover:text-sky-800 cursor-pointer">
                  회원가입
                </span>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
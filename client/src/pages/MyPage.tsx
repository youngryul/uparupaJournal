import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, BookOpen, Heart, Calendar, Save } from "lucide-react";

interface UserPreferences {
  useDiary?: boolean;
  useMemoir?: boolean;
  useRecord?: boolean;
  menuConfigured?: boolean;
}

export default function MyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 사용자 설정 조회
  const { data: userPreferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ['/api/auth/user-preferences'],
    enabled: !!user,
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    useDiary: true,
    useMemoir: false,
    useRecord: false,
    ...userPreferences,
  });

  // 사용자 설정이 로드되면 로컬 상태 업데이트
  useEffect(() => {
    if (userPreferences) {
      setPreferences({
        useDiary: true,
        useMemoir: false,
        useRecord: false,
        ...userPreferences,
      });
    }
  }, [userPreferences]);

  // 설정 저장
  const savePreferences = useMutation({
    mutationFn: (data: UserPreferences) =>
      apiRequest('PUT', '/api/auth/user-preferences', {
        ...data,
        menuConfigured: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user-preferences'] });
      toast({
        title: "설정이 저장되었습니다",
        description: "변경된 설정이 적용되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "설정 저장에 실패했습니다",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const handlePreferenceChange = (key: keyof UserPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    savePreferences.mutate(preferences);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sky-600">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-green-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 헤더 */}
        <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border-sky-light/20 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-sky-light to-sky-soft rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-sky-700">마이페이지</h1>
              <p className="text-sky-600">{user.username}님, 안녕하세요!</p>
            </div>
          </div>
        </Card>

        {/* 기능 설정 */}
        <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border-sky-light/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-semibold text-sky-700">기능 설정</h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* 일기장 설정 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">일기장</Label>
                    <p className="text-xs text-gray-500">일상을 기록하고 AI 분석을 받아보세요</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.useDiary}
                  onCheckedChange={(value) => handlePreferenceChange('useDiary', value)}
                  data-testid="switch-diary"
                />
              </div>

              {/* 회고록 설정 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">회고록</Label>
                    <p className="text-xs text-gray-500">주기적으로 돌아보고 성찰하세요</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.useMemoir}
                  onCheckedChange={(value) => handlePreferenceChange('useMemoir', value)}
                  data-testid="switch-memoir"
                />
              </div>

              {/* 기록 설정 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">기록</Label>
                    <p className="text-xs text-gray-500">감정과 활동을 추적하고 통계를 확인하세요</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.useRecord}
                  onCheckedChange={(value) => handlePreferenceChange('useRecord', value)}
                  data-testid="switch-record"
                />
              </div>
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleSave}
              disabled={savePreferences.isPending}
              data-testid="button-save-preferences"
              className="bg-gradient-to-r from-sky-light to-sky-soft text-white px-8 py-2 rounded-2xl hover:from-sky-600 hover:to-sky-700 transition-all transform hover:scale-105"
            >
              <Save className="w-4 h-4 mr-2" />
              {savePreferences.isPending ? "저장 중..." : "설정 저장"}
            </Button>
          </div>
        </Card>

        {/* 사용자 정보 */}
        <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border-sky-light/20 p-6">
          <h3 className="text-lg font-semibold text-sky-700 mb-4">사용자 정보</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">사용자명</span>
              <span className="font-medium text-gray-800">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">계정 상태</span>
              <span className="font-medium text-green-600">활성</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
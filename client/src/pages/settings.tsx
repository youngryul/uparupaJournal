import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Download, HelpCircle, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    showInstallPrompt: true
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/user-preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences({
            showInstallPrompt: data.showInstallPrompt ?? true
          });
        }
      } catch (error) {
        console.error('설정 로드 실패:', error);
      }
    };

    loadPreferences();
  }, []);

  const handlePreferenceChange = async (key: string, value: boolean) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('PUT', '/api/auth/user-preferences', {
        [key]: value
      });

      if (response.ok) {
        setPreferences(prev => ({ ...prev, [key]: value }));
        toast({
          title: "설정 저장됨",
          description: "변경사항이 저장되었습니다.",
        });
      } else {
        throw new Error('설정 저장 실패');
      }
    } catch (error) {
      console.error('설정 저장 오류:', error);
      toast({
        title: "설정 저장 실패",
        description: "나중에 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft to-cloud-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-sky-light rounded-full flex items-center justify-center text-4xl mx-auto mb-4 animate-float">
            ⚙️
          </div>
          <h1 className="text-3xl font-bold text-sky-800 mb-2">설정</h1>
          <p className="text-sky-600">앱 사용 환경을 맞춤 설정하세요</p>
        </div>

        <div className="space-y-6">
          {/* 계정 설정 */}
          <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
            <CardHeader>
              <CardTitle className="text-sky-800 flex items-center gap-2">
                <User className="w-6 h-6" />
                계정 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-sky-light/10 rounded-2xl">
                <div>
                  <p className="font-semibold text-sky-800">{user?.username}</p>
                  <p className="text-sm text-sky-600">사용자명</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 앱 설정 */}
          <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
            <CardHeader>
              <CardTitle className="text-sky-800 flex items-center gap-2">
                <Palette className="w-6 h-6" />
                앱 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-sky-light/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-sky-600" />
                  <div>
                    <Label htmlFor="showInstallPrompt" className="font-semibold text-sky-800">
                      PWA 설치 배너 표시
                    </Label>
                    <p className="text-sm text-sky-600">앱 설치 안내 배너를 표시합니다</p>
                  </div>
                </div>
                <Switch
                  id="showInstallPrompt"
                  checked={preferences.showInstallPrompt}
                  onCheckedChange={(checked) => handlePreferenceChange('showInstallPrompt', checked)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* 기타 설정 */}
          <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
            <CardHeader>
              <CardTitle className="text-sky-800 flex items-center gap-2">
                <HelpCircle className="w-6 h-6" />
                기타
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={logout}
                variant="outline"
                className="w-full py-3 border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-2xl font-semibold"
              >
                로그아웃
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // PWA 설치 조건 확인
    const checkPWAInstallability = () => {
      console.log('=== PWA 설치 조건 확인 ===');
      console.log('navigator.standalone:', (navigator as any).standalone);
      console.log('window.matchMedia("(display-mode: standalone)"):', window.matchMedia('(display-mode: standalone)').matches);
      console.log('window.matchMedia("(display-mode: window-controls-overlay)"):', window.matchMedia('(display-mode: window-controls-overlay)').matches);
      console.log('window.matchMedia("(display-mode: minimal-ui)"):', window.matchMedia('(display-mode: minimal-ui)').matches);
      
      // 이미 PWA로 실행 중인지 확인
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.matchMedia('(display-mode: window-controls-overlay)').matches ||
          window.matchMedia('(display-mode: minimal-ui)').matches) {
        console.log('이미 PWA 모드로 실행 중입니다.');
        return false;
      }
      
      // iOS Safari에서 standalone 체크
      if ((navigator as any).standalone) {
        console.log('iOS Safari에서 이미 홈 화면에 추가됨');
        return false;
      }
      
      console.log('PWA 설치 가능한 상태입니다.');
      return true;
    };

    // 사용자 설정 확인
    const checkUserPreferences = async () => {
      if (!user) return;
      
      try {
        const response = await apiRequest('GET', '/api/auth/user-preferences');
        if (response.ok) {
          const preferences = await response.json();
          console.log('사용자 설정 확인:', preferences);
          if (!preferences.showInstallPrompt) {
            console.log('showInstallPrompt가 false이므로 배너 숨김');
            setShowPrompt(false);
            setDeferredPrompt(null); // 이벤트 무시
            return;
          }
        }
      } catch (error) {
        console.error('사용자 설정 확인 실패:', error);
      }
    };

    checkUserPreferences();
    const isInstallable = checkPWAInstallability();

    const handler = async (e: Event) => {
      console.log('beforeinstallprompt 이벤트 발생!');
      e.preventDefault();
      
      // 사용자 설정 확인 후 배너 표시 여부 결정
      if (user) {
        try {
          const response = await apiRequest('GET', '/api/auth/user-preferences');
          if (response.ok) {
            const preferences = await response.json();
            console.log('이벤트 핸들러에서 사용자 설정 확인:', preferences);
            if (!preferences.showInstallPrompt) {
              console.log('showInstallPrompt가 false이므로 배너 표시하지 않음');
              return; // 배너 표시하지 않음
            }
          }
        } catch (error) {
          console.error('사용자 설정 확인 실패:', error);
        }
      }
      
      console.log('배너 표시 설정');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // beforeinstallprompt 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', handler);
    console.log('beforeinstallprompt 이벤트 리스너 등록됨');

    // 디버깅: 이벤트가 발생하지 않는 경우를 위한 체크
    setTimeout(() => {
      console.log('5초 후 deferredPrompt 상태:', deferredPrompt);
      console.log('5초 후 showPrompt 상태:', showPrompt);
      console.log('PWA 설치 가능 여부:', isInstallable);
      
      // PWA 설치 가능하고 사용자 설정이 true인데 이벤트가 발생하지 않은 경우
      if (isInstallable && user) {
        checkUserPreferences().then(() => {
          // 수동으로 배너 표시 테스트 (개발용)
          console.log('개발 모드: 수동으로 배너 표시 테스트');
          // setShowPrompt(true); // 주석 해제하여 테스트 가능
        });
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [user]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: "앱 설치 시작! 📱",
        description: "홈 화면에 앱이 추가됩니다.",
      });
    } else {
      toast({
        title: "설치 취소됨",
        description: "나중에 다시 시도할 수 있습니다.",
        variant: "destructive",
      });
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  const handleDontShowAgain = async () => {
    if (!user) return;

    try {
      const response = await apiRequest('PUT', '/api/auth/user-preferences', {
        showInstallPrompt: false
      });

      if (response.ok) {
        toast({
          title: "설정 저장됨",
          description: "앱 설치 배너가 더 이상 표시되지 않습니다.",
        });
        setShowPrompt(false);
        setDeferredPrompt(null); // 이벤트 완전히 무시
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
    }
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <Card className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm border-2 border-sky-light/50 rounded-3xl shadow-xl z-50 max-w-sm w-full mx-4">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 bg-sky-light/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          📱
        </div>
        <h3 className="text-lg font-bold text-sky-800 mb-2">앱 설치하기</h3>
        <p className="text-sky-600 mb-4 text-sm">
          홈 화면에 추가하여 더 빠르게 접근하세요
        </p>
        
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleInstall}
            className="w-full py-3 bg-gradient-to-r from-sky-light to-sky-soft text-white rounded-2xl font-semibold hover:from-sky-soft hover:to-sky-light transition-all transform hover:scale-105 shadow-lg"
          >
            <Download className="w-5 h-5 mr-2" />
            설치하기
          </Button>
          
          <Button
            onClick={handleDontShowAgain}
            variant="ghost"
            size="sm"
            className="text-sky-500 hover:text-sky-600 hover:bg-sky-light/10 text-sm"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            다시 보지 않기
          </Button>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-sky-400 hover:text-sky-500 hover:bg-sky-light/10 text-sm"
          >
            <X className="w-4 h-4 mr-2" />
            닫기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

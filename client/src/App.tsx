import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import DiaryPage from "@/pages/diary";
import MemoirPage from "@/pages/memoir";
import RecordPage from "@/pages/record";
import MyPage from "@/pages/MyPage";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import MenuSelectionPage from "@/pages/menu-selection";
import { Navigation } from "@/components/navigation";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Redirect component for authenticated users
function AuthRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/");
  }, [setLocation]);
  
  return null;
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showMenuSelection, setShowMenuSelection] = useState(false);

  // 사용자의 메뉴 설정 확인
  const { data: userPreferences, isLoading: isPreferencesLoading } = useQuery<{ useDiary?: boolean; useMemoir?: boolean; useRecord?: boolean; menuConfigured?: boolean }>({
    queryKey: ['/api/auth/user-preferences'],
    enabled: !!user,
  });

  // 새로 가입한 사용자에게 메뉴 선택 화면 표시
  useEffect(() => {
    if (isAuthenticated && userPreferences && !isPreferencesLoading) {
      // 메뉴를 아직 설정하지 않은 사용자는 메뉴 선택 페이지 표시
      if (!userPreferences.menuConfigured) {
        setShowMenuSelection(true);
      }
    }
  }, [isAuthenticated, userPreferences, isPreferencesLoading]);

  if (isLoading || (isAuthenticated && isPreferencesLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-soft to-cloud-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-sky-light rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-float">
            🌸
          </div>
          <p className="text-sky-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 메뉴 선택 페이지 표시
  if (showMenuSelection && isAuthenticated) {
    return (
      <MenuSelectionPage 
        onComplete={() => {
          setShowMenuSelection(false);
        }} 
      />
    );
  }

  return (
    <div className="relative">
      <Switch>
        {!isAuthenticated ? (
          <>
            <Route path="/login" component={LoginPage} />
            <Route path="/signup" component={SignupPage} />
            <Route path="/" component={LoginPage} />
          </>
        ) : (
          <>
            <Route path="/" component={DiaryPage} />
            <Route path="/diary" component={DiaryPage} />
            <Route path="/memoir" component={MemoirPage} />
            <Route path="/record" component={RecordPage} />
            <Route path="/mypage" component={MyPage} />
            <Route path="/login" component={AuthRedirect} />
            <Route path="/signup" component={AuthRedirect} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      
      {/* 네비게이션은 로그인한 사용자에게만 표시 */}
      {isAuthenticated && !showMenuSelection && <Navigation />}
      
      {/* PWA 설치 프롬프트 */}
      <PWAInstallPrompt />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

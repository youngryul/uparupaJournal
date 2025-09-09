import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, BookOpen, BarChart3, Settings, Menu, User, LogOut, Bell, Shield, HelpCircle, Palette, Download, CalendarDays } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 사용자의 메뉴 설정 조회  
  const { data: userPreferences } = useQuery<{ useDiary?: boolean; useMemoir?: boolean; usePeriodTracker?: boolean }>({
    queryKey: ['/api/auth/user-preferences'],
    enabled: !!user,
  });

  if (!user) return null;

  const navItems = [
    ...(userPreferences?.useDiary !== false ? [{
      path: "/",
      label: "일기장",
      icon: Heart,
      isActive: location === "/",
    }] : []),
    ...(userPreferences?.useMemoir === true ? [{
      path: "/memoir",
      label: "회고록", 
      icon: BookOpen,
      isActive: location === "/memoir",
    }] : []),
    ...((userPreferences?.usePeriodTracker ?? true) ? [{
      path: "/period-tracker",
      label: "생리추적",
      icon: CalendarDays,
      isActive: location === "/period-tracker",
    }] : []),
    // 향후 확장을 위한 메뉴들
    {
      path: "/settings",
      label: "설정",
      icon: Settings,
      isActive: location === "/settings",
    },
  ];

  // 생리 추적 활성화 뮤테이션
  const enablePeriodTrackerMutation = useMutation({
    mutationFn: () => apiRequest('PUT', '/api/auth/user-preferences', {
      usePeriodTracker: true
    }),
    onSuccess: () => {
      // 쿼리 캐시 무효화하여 새로운 설정 반영
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user-preferences'] });
    },
  });

  // 디버깅을 위한 로그
  console.log('Navigation - userPreferences:', userPreferences);
  console.log('Navigation - usePeriodTracker:', userPreferences?.usePeriodTracker);
  console.log('Navigation - navItems length:', navItems.length);

  // 하단에 고정된 탭 형태
  const navClasses = "fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-sky-light/20 shadow-lg z-40";

  return (
    <Card className={navClasses}>
      <div className="p-2">
        {/* 탭 네비게이션 */}
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid={`nav-${item.path === "/" ? "diary" : item.path.slice(1)}`}
                  className={`flex flex-col items-center gap-1 px-3 py-2 h-auto min-h-0 rounded-xl transition-all ${
                    item.isActive 
                      ? "text-sky-600 bg-sky-light/20" 
                      : "text-sky-500 hover:text-sky-600 hover:bg-sky-light/10"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${item.isActive ? 'text-sky-600' : 'text-sky-500'}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}

          {/* 햄버거 메뉴 - 오른쪽에 배치 */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center gap-1 px-3 py-2 h-auto min-h-0 rounded-xl text-sky-500 hover:text-sky-600 hover:bg-sky-light/10"
              >
                <Menu className="w-5 h-5" />
                <span className="text-xs font-medium">더보기</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-white/95 backdrop-blur-sm border border-sky-light/20 rounded-2xl shadow-xl"
              side="top"
            >
              {/* 사용자 정보 */}
              <DropdownMenuItem className="flex items-center gap-3 p-3 text-sky-700 hover:bg-sky-light/10 rounded-xl mx-2 my-1">
                <User className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{user.username}</span>
                  <span className="text-xs text-sky-500">사용자</span>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-sky-light/20 mx-2" />
              
              {/* 추가 메뉴들 */}
              <DropdownMenuItem className="flex items-center gap-3 p-3 text-sky-700 hover:bg-sky-light/10 rounded-xl mx-2 my-1">
                <Bell className="w-4 h-4" />
                <span>알림 설정</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="flex items-center gap-3 p-3 text-sky-700 hover:bg-sky-light/10 rounded-xl mx-2 my-1">
                <Palette className="w-4 h-4" />
                <span>테마 설정</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="flex items-center gap-3 p-3 text-sky-700 hover:bg-sky-light/10 rounded-xl mx-2 my-1">
                <Download className="w-4 h-4" />
                <span>데이터 백업</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="flex items-center gap-3 p-3 text-sky-700 hover:bg-sky-light/10 rounded-xl mx-2 my-1">
                <HelpCircle className="w-4 h-4" />
                <span>도움말</span>
              </DropdownMenuItem>
              
              {/* 임시: 생리 추적 활성화 버튼 */}
              {userPreferences?.usePeriodTracker !== true && (
                <DropdownMenuItem 
                  className="flex items-center gap-3 p-3 text-pink-600 hover:bg-pink-50 rounded-xl mx-2 my-1"
                  onClick={() => enablePeriodTrackerMutation.mutate()}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>생리 추적 활성화</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator className="bg-sky-light/20 mx-2" />
              
              {/* 로그아웃 */}
              <DropdownMenuItem 
                className="flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-xl mx-2 my-1"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
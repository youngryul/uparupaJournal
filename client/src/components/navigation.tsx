import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, BookOpen, LogOut, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  // 사용자의 메뉴 설정 조회  
  const { data: userPreferences } = useQuery<{ useDiary?: boolean; useMemoir?: boolean }>({
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
  ];

  return (
    <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow border-sky-light/20">
      <div className="flex items-center gap-2 p-4">
        {/* 네비게이션 메뉴 */}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant={item.isActive ? "default" : "ghost"}
                size="sm"
                data-testid={`nav-${item.path === "/" ? "diary" : item.path.slice(1)}`}
                className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                  item.isActive 
                    ? "bg-gradient-to-r from-sky-light to-sky-soft text-white shadow-lg transform scale-105" 
                    : "text-sky-600 hover:bg-sky-light/10 hover:text-sky-700"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          );
        })}

        {/* 구분선 */}
        {navItems.length > 0 && (
          <div className="w-px h-8 bg-sky-light/30 mx-2" />
        )}

        {/* 사용자 정보 */}
        <div className="flex items-center gap-2 text-sky-700">
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">{user.username}</span>
        </div>

        {/* 로그아웃 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          data-testid="button-logout"
          className="text-sky-600 hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded-2xl"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Flame, Crown, Target } from "lucide-react";

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: string;
  condition: any;
  points: number;
  rarity: string;
  isActive: boolean;
}

interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  unlockedAt: string;
  progress: number;
  isCompleted: boolean;
  achievement: Achievement;
}

interface UserStats {
  id: number;
  userId: number;
  totalDiaryEntries: number;
  totalMemoirEntries: number;
  totalEmotionRecords: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  lastActiveDate: string;
}

export default function AchievementsPage() {
  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
  });

  const { data: userAchievements = [] } = useQuery<UserAchievement[]>({
    queryKey: ['/api/user-achievements'],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ['/api/user-stats'],
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Star className="w-4 h-4" />;
      case 'rare': return <Target className="w-4 h-4" />;
      case 'epic': return <Flame className="w-4 h-4" />;
      case 'legendary': return <Crown className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const isAchievementUnlocked = (achievementId: number) => {
    return userAchievements.some(ua => ua.achievementId === achievementId && ua.isCompleted);
  };

  const getAchievementProgress = (achievement: Achievement) => {
    if (!userStats) return 0;
    
    const condition = achievement.condition;
    switch (achievement.type) {
      case 'diary':
        return Math.min(100, (userStats.totalDiaryEntries / condition.count) * 100);
      case 'memoir':
        return Math.min(100, (userStats.totalMemoirEntries / condition.count) * 100);
      case 'record':
        return Math.min(100, (userStats.totalEmotionRecords / condition.count) * 100);
      case 'streak':
        return Math.min(100, (userStats.currentStreak / condition.days) * 100);
      default:
        return 0;
    }
  };

  const unlockedAchievements = achievements.filter(a => isAchievementUnlocked(a.id));
  const lockedAchievements = achievements.filter(a => !isAchievementUnlocked(a.id));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text text-transparent">
            업적 시스템
          </h1>
        </div>
        <p className="text-gray-600 mb-6">
          일기 작성과 기록을 통해 다양한 업적을 달성해보세요!
        </p>
        
        {/* 사용자 통계 카드 */}
        {userStats && (
          <Card className="mb-8 bg-gradient-to-r from-sky-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-xl">나의 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-sky-600">{userStats.totalDiaryEntries}</div>
                  <div className="text-sm text-gray-600">일기 작성</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">{userStats.totalMemoirEntries}</div>
                  <div className="text-sm text-gray-600">회고록 작성</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600">{userStats.totalEmotionRecords}</div>
                  <div className="text-sm text-gray-600">감정 기록</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-orange-600">{userStats.totalPoints}</div>
                  <div className="text-sm text-gray-600">총 포인트</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-lg font-semibold text-red-600 flex items-center justify-center gap-2">
                  <Flame className="w-5 h-5" />
                  현재 연속 기록: {userStats.currentStreak}일
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  최고 기록: {userStats.longestStreak}일
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 달성한 업적 */}
      {unlockedAchievements.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-700">🎉 달성한 업적</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unlockedAchievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg"
                data-testid={`achievement-unlocked-${achievement.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl">{achievement.icon}</div>
                    <Badge className={`${getRarityColor(achievement.rarity)} border-2`}>
                      <span className="flex items-center gap-1">
                        {getRarityIcon(achievement.rarity)}
                        {achievement.rarity}
                      </span>
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-green-800">{achievement.name}</CardTitle>
                  <CardDescription className="text-green-700">
                    {achievement.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">완료!</span>
                    <span className="text-sm font-semibold text-green-800">
                      +{achievement.points} 포인트
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 아직 달성하지 못한 업적 */}
      {lockedAchievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-700">🎯 도전할 업적</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lockedAchievements.map((achievement) => {
              const progress = getAchievementProgress(achievement);
              return (
                <Card 
                  key={achievement.id} 
                  className="bg-gray-50 border-gray-200"
                  data-testid={`achievement-locked-${achievement.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="text-3xl grayscale">{achievement.icon}</div>
                      <Badge className="bg-gray-100 text-gray-600 border-gray-300">
                        <span className="flex items-center gap-1">
                          {getRarityIcon(achievement.rarity)}
                          {achievement.rarity}
                        </span>
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-gray-700">{achievement.name}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {achievement.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">진행도</span>
                        <span className="text-gray-700 font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          목표: {achievement.condition.count || achievement.condition.days}
                          {achievement.type === 'streak' ? '일' : '회'}
                        </span>
                        <span className="text-sm font-semibold text-gray-600">
                          +{achievement.points} 포인트
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {achievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">업적을 불러오는 중...</p>
        </div>
      )}
    </div>
  );
}
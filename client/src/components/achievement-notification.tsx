import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Trophy } from "lucide-react";

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

interface AchievementNotificationProps {
  newAchievements?: Achievement[];
}

export function AchievementNotification({ newAchievements }: AchievementNotificationProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (newAchievements && newAchievements.length > 0) {
      newAchievements.forEach((achievement) => {
        toast({
          title: "🎉 새로운 업적 달성!",
          description: (
            <div className="flex items-center gap-3">
              <div className="text-2xl">{achievement.icon}</div>
              <div>
                <div className="font-semibold text-green-700">{achievement.name}</div>
                <div className="text-sm text-gray-600">{achievement.description}</div>
                <div className="text-sm text-orange-600 font-medium">+{achievement.points} 포인트</div>
              </div>
            </div>
          ),
          duration: 5000,
        });
      });
    }
  }, [newAchievements, toast]);

  return null;
}
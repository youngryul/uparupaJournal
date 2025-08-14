import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Activity, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmotionRecordForm } from "@/components/emotion-record-form";
import { EmotionCalendar } from "@/components/emotion-calendar";
import { ActivityChart } from "@/components/activity-chart";
import { type EmotionRecord } from "@shared/schema";

export default function RecordPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"calendar" | "chart">("calendar");

  // 현재 월의 감정 기록 조회
  const { data: emotionRecords, isLoading } = useQuery<EmotionRecord[]>({
    queryKey: ['/api/emotion-records', selectedDate.getFullYear(), selectedDate.getMonth() + 1],
  });

  const handleRecordCreated = () => {
    setShowForm(false);
    toast({
      title: "기록 완료!",
      description: "오늘의 감정과 활동이 기록되었습니다.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft to-cloud-white p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow border-sky-light/20">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-sky-800">
              기록
            </CardTitle>
            <p className="text-sky-600 text-sm">
              매일의 감정과 활동을 콩 모양 아이콘으로 기록하고 시각화해보세요
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 액션 버튼 */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => setShowForm(true)}
                data-testid="button-add-record"
                className="bg-gradient-to-r from-green-400 to-green-500 text-white rounded-2xl hover:from-green-500 hover:to-green-600 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                오늘 기록하기
              </Button>

              <Button
                variant={view === "calendar" ? "default" : "outline"}
                onClick={() => setView("calendar")}
                data-testid="button-calendar-view"
                className="rounded-2xl"
              >
                <Calendar className="w-4 h-4 mr-2" />
                달력 보기
              </Button>

              <Button
                variant={view === "chart" ? "default" : "outline"}
                onClick={() => setView("chart")}
                data-testid="button-chart-view"
                className="rounded-2xl"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                차트 보기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 메인 콘텐츠 */}
        {view === "calendar" ? (
          <EmotionCalendar
            emotionRecords={emotionRecords || []}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            isLoading={isLoading}
          />
        ) : (
          <ActivityChart
            emotionRecords={emotionRecords || []}
            selectedDate={selectedDate}
            isLoading={isLoading}
          />
        )}

        {/* 기록 폼 모달 */}
        {showForm && (
          <EmotionRecordForm
            onClose={() => setShowForm(false)}
            onSuccess={handleRecordCreated}
            date={new Date()}
          />
        )}
      </div>
    </div>
  );
}
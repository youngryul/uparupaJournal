import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { type EmotionRecord } from "@shared/schema";

interface ActivityChartProps {
  emotionRecords: EmotionRecord[];
  selectedDate: Date;
  isLoading: boolean;
}

const EMOTION_COLORS = {
  1: "#ef4444", // red-500
  2: "#f97316", // orange-500  
  3: "#eab308", // yellow-500
  4: "#22c55e", // green-500
  5: "#3b82f6", // blue-500
};

const EMOTION_LABELS = {
  1: "매우 나쁨",
  2: "나쁨",
  3: "보통", 
  4: "좋음",
  5: "매우 좋음",
};

export function ActivityChart({ emotionRecords, selectedDate, isLoading }: ActivityChartProps) {
  // 감정 분포 데이터 계산
  const emotionDistribution = useMemo(() => {
    const distribution = emotionRecords.reduce((acc, record) => {
      const level = record.emotion;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(EMOTION_LABELS).map(([level, label]) => ({
      level: parseInt(level),
      label,
      count: distribution[parseInt(level)] || 0,
      color: EMOTION_COLORS[parseInt(level) as keyof typeof EMOTION_COLORS],
    }));
  }, [emotionRecords]);

  // 주간 트렌드 데이터 계산
  const weeklyTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const record = emotionRecords.find(r => r.date === dateStr);
      
      return {
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        emotion: record?.emotion || 0,
        hasRecord: !!record,
      };
    });
  }, [emotionRecords]);

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow border-sky-light/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 감정 분포 차트 */}
      <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow border-sky-light/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-sky-800">
            감정 분포
          </CardTitle>
          <p className="text-sky-600 text-sm">
            이번 달 감정 상태 분포를 확인해보세요
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emotionDistribution.filter(item => item.count > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, count }) => `${label}: ${count}일`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {emotionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 주간 트렌드 차트 */}
      <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow border-sky-light/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-sky-800">
            최근 7일 감정 변화
          </CardTitle>
          <p className="text-sky-600 text-sm">
            일주일간의 감정 변화 추이를 확인해보세요
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  domain={[0, 5]} 
                  tickFormatter={(value) => EMOTION_LABELS[value as keyof typeof EMOTION_LABELS] || ''}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value > 0 ? EMOTION_LABELS[value as keyof typeof EMOTION_LABELS] : '기록 없음',
                    '감정 상태'
                  ]}
                />
                <Bar 
                  dataKey="emotion" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 통계 요약 */}
      <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow border-sky-light/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-sky-800">
            이번 달 요약
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-sky-50 rounded-2xl">
              <div className="text-2xl font-bold text-sky-700">
                {emotionRecords.length}
              </div>
              <div className="text-sm text-sky-600">총 기록일</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-2xl">
              <div className="text-2xl font-bold text-green-700">
                {emotionRecords.filter(r => r.emotion >= 4).length}
              </div>
              <div className="text-sm text-green-600">좋은 날</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-2xl">
              <div className="text-2xl font-bold text-blue-700">
                {emotionRecords.length > 0 ? 
                  (emotionRecords.reduce((sum, r) => sum + r.emotion, 0) / emotionRecords.length).toFixed(1)
                  : '0'
                }
              </div>
              <div className="text-sm text-blue-600">평균 감정</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-2xl">
              <div className="text-2xl font-bold text-purple-700">
                {Math.round((emotionRecords.length / new Date().getDate()) * 100)}%
              </div>
              <div className="text-sm text-purple-600">기록률</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Calendar, TrendingUp, Clock, Heart, Activity } from "lucide-react";

interface PeriodRecord {
  id: number;
  date: string;
  type: 'start' | 'end' | 'symptom' | 'mood';
  flow?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
  mood?: string;
  notes?: string;
}

interface CycleData {
  cycleLength: number;
  periodLength: number;
  lastPeriod: string;
  nextPeriod: string;
  ovulation: string;
}

interface PeriodAnalysisProps {
  records: PeriodRecord[];
  cycleData: CycleData | null;
}

export function PeriodAnalysis({ records, cycleData }: PeriodAnalysisProps) {
  // 주기 통계 계산
  const getCycleStats = () => {
    if (!cycleData) return null;
    
    const periodStarts = records
      .filter(r => r.type === 'start')
      .map(r => new Date(r.date))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (periodStarts.length < 2) return null;
    
    const cycles = [];
    for (let i = 1; i < periodStarts.length; i++) {
      const cycleLength = Math.floor((periodStarts[i].getTime() - periodStarts[i-1].getTime()) / (1000 * 60 * 60 * 24));
      cycles.push(cycleLength);
    }
    
    const avgCycle = Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);
    const minCycle = Math.min(...cycles);
    const maxCycle = Math.max(...cycles);
    
    return {
      average: avgCycle,
      min: minCycle,
      max: maxCycle,
      count: cycles.length,
      cycles
    };
  };

  // 증상 통계
  const getSymptomStats = () => {
    const symptomCounts: { [key: string]: number } = {};
    
    records
      .filter(r => r.type === 'symptom' && r.symptoms && r.symptoms.length > 0)
      .forEach(r => {
        r.symptoms!.forEach(symptom => {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
        });
      });
    
    return Object.entries(symptomCounts)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // 기분 통계
  const getMoodStats = () => {
    const moodCounts: { [key: string]: number } = {};
    
    records
      .filter(r => r.type === 'mood' && r.mood)
      .forEach(r => {
        moodCounts[r.mood!] = (moodCounts[r.mood!] || 0) + 1;
      });
    
    return Object.entries(moodCounts)
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count);
  };

  // 차트 데이터 생성
  const getChartData = () => {
    if (!cycleData) return [];
    
    const cycleStats = getCycleStats();
    if (!cycleStats) return [];
    
    return cycleStats.cycles.map((cycle, index) => ({
      cycle: `주기 ${index + 1}`,
      length: cycle
    }));
  };

  const cycleStats = getCycleStats();
  const symptomStats = getSymptomStats();
  const moodStats = getMoodStats();
  const chartData = getChartData();

  if (!cycleData || !cycleStats) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">분석 데이터가 부족합니다</h3>
        <p className="text-gray-500">생리 기록을 더 추가하면 상세한 분석을 제공할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 요약 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">평균 주기</p>
                <p className="text-2xl font-bold text-blue-600">{cycleStats.average}일</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-pink-600" />
              <div>
                <p className="text-sm text-gray-600">기간</p>
                <p className="text-2xl font-bold text-pink-600">{cycleData.periodLength}일</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">기록된 주기</p>
                <p className="text-2xl font-bold text-green-600">{cycleStats.count}개</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">주기 범위</p>
                <p className="text-lg font-bold text-purple-600">{cycleStats.min}-{cycleStats.max}일</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 주기 길이 차트 */}
        <Card>
          <CardHeader>
            <CardTitle>주기 길이 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cycle" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="length" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 증상 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>자주 나타나는 증상</CardTitle>
          </CardHeader>
          <CardContent>
            {symptomStats.length > 0 ? (
              <div className="space-y-3">
                {symptomStats.map(({ symptom, count }) => (
                  <div key={symptom} className="flex items-center justify-between">
                    <span className="text-sm">{symptom}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={(count / Math.max(...symptomStats.map(s => s.count))) * 100} className="w-20" />
                      <Badge variant="secondary">{count}회</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">증상 기록이 없습니다</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 기분 통계 */}
      {moodStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>기분 패턴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {moodStats.map(({ mood, count }) => (
                <div key={mood} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl mb-1">{mood.split(' ')[0]}</p>
                  <p className="text-sm text-gray-600">{mood.split(' ').slice(1).join(' ')}</p>
                  <Badge variant="outline" className="mt-2">{count}회</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 다음 예정일 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>다음 예정일 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">다음 생리 예정일</p>
              <p className="text-xl font-bold text-pink-600">
                {new Date(cycleData.nextPeriod).toLocaleDateString('ko-KR', { 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">배란 예상일</p>
              <p className="text-xl font-bold text-blue-600">
                {new Date(cycleData.ovulation).toLocaleDateString('ko-KR', { 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">가임기</p>
              <p className="text-lg font-bold text-purple-600">
                배란일 ±3일
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

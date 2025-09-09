import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PeriodRecordModal } from "@/components/period-record-modal";
import { PeriodAnalysis } from "@/components/period-analysis";
import { addDays, format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, BarChart3, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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

export default function PeriodTrackerPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showRecordModal, setShowRecordModal] = useState(false);
  const queryClient = useQueryClient();

  // 생리 기록 조회
  const { data: records = [], isLoading: isRecordsLoading } = useQuery<PeriodRecord[]>({
    queryKey: ['/api/period-records'],
  });

  // 생리 기록 생성/수정/삭제 뮤테이션
  const createRecordMutation = useMutation({
    mutationFn: (record: Omit<PeriodRecord, 'id'>) => 
      apiRequest('POST', '/api/period-records', record),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/period-records'] });
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: ({ id, ...record }: Partial<PeriodRecord> & { id: number }) => 
      apiRequest('PUT', `/api/period-records/${id}`, record),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/period-records'] });
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/period-records/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/period-records'] });
    },
  });

  // 색상 시스템
  const getDateColor = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const today = new Date();
    
    // 오늘 날짜 강조
    if (isSameDay(date, today)) {
      return 'bg-blue-100 border-2 border-blue-500 text-blue-900 font-semibold';
    }
    
    // 생리일 (진한 붉은색)
    const periodRecord = records.find(r => r.type === 'start' && r.date === dateStr);
    if (periodRecord) {
      return 'bg-red-600 text-white font-medium';
    }
    
    // 예정일 (연분홍/보라)
    if (cycleData?.nextPeriod && isSameDay(date, new Date(cycleData.nextPeriod))) {
      return 'bg-pink-200 text-pink-800 font-medium';
    }
    
    // 가임기 (파란색 계열)
    if (cycleData?.ovulation && isSameDay(date, new Date(cycleData.ovulation))) {
      return 'bg-blue-200 text-blue-800 font-medium';
    }
    
    return 'hover:bg-gray-100';
  };

  // 생리주기 계산
  const calculateCycle = () => {
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
    
    const avgCycleLength = Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);
    const lastPeriod = periodStarts[periodStarts.length - 1];
    const nextPeriod = addDays(lastPeriod, avgCycleLength);
    const ovulation = addDays(nextPeriod, -14);
    
    return {
      cycleLength: avgCycleLength,
      periodLength: 5, // 기본값, 실제로는 기록에서 계산
      lastPeriod: format(lastPeriod, 'yyyy-MM-dd'),
      nextPeriod: format(nextPeriod, 'yyyy-MM-dd'),
      ovulation: format(ovulation, 'yyyy-MM-dd')
    };
  };

  // 주기 데이터 계산
  const cycleData = calculateCycle();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setShowRecordModal(true);
    }
  };

  const handleRecordSave = (record: Omit<PeriodRecord, 'id'>) => {
    createRecordMutation.mutate(record, {
      onSuccess: () => {
        setShowRecordModal(false);
      }
    });
  };

  if (isRecordsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-float">
            🌸
          </div>
          <p className="text-pink-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-pink-600" />
            생리 추적
          </h1>
          <p className="text-gray-600">당신의 생리주기를 건강하게 관리하세요</p>
        </div>

        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              캘린더
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              분석
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 캘린더 */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>생리주기 캘린더</span>
                      <Button 
                        onClick={() => setShowRecordModal(true)}
                        size="sm"
                        className="bg-pink-600 hover:bg-pink-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        기록 추가
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      className="rounded-md border"
                      classNames={{
                        day: (date) => getDateColor(date),
                        day_selected: "bg-pink-600 text-white font-semibold",
                      }}
                      locale={ko}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* 사이드 정보 */}
              <div className="space-y-4">
                {/* 현재 상태 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">현재 상태</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {cycleData ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">다음 생리 예정일</span>
                          <Badge variant="outline" className="bg-pink-100 text-pink-800">
                            {format(new Date(cycleData.nextPeriod), 'M월 d일')}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">배란 예상일</span>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {format(new Date(cycleData.ovulation), 'M월 d일')}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">평균 주기</span>
                          <Badge variant="outline">
                            {cycleData.cycleLength}일
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">생리 기록을 추가하면 분석이 시작됩니다</p>
                    )}
                  </CardContent>
                </Card>

                {/* 색상 범례 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">색상 범례</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-600 rounded"></div>
                      <span className="text-sm">생리일</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-pink-200 rounded"></div>
                      <span className="text-sm">예정일</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-200 rounded"></div>
                      <span className="text-sm">가임기</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
                      <span className="text-sm">오늘</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis">
            <PeriodAnalysis records={records} cycleData={cycleData} />
          </TabsContent>
        </Tabs>

        {/* 기록 모달 */}
        <PeriodRecordModal
          isOpen={showRecordModal}
          onClose={() => setShowRecordModal(false)}
          onSave={handleRecordSave}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}

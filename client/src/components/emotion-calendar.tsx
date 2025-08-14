import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type EmotionRecord } from "@shared/schema";
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'ko': ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface EmotionCalendarProps {
  emotionRecords: EmotionRecord[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  isLoading: boolean;
}

const EMOTION_COLORS = {
  1: "#ef4444", // red-500
  2: "#f97316", // orange-500
  3: "#eab308", // yellow-500
  4: "#22c55e", // green-500
  5: "#3b82f6", // blue-500
};

const EMOTION_ICONS = {
  1: "😰",
  2: "😞", 
  3: "😐",
  4: "😊",
  5: "😍",
};

export function EmotionCalendar({ emotionRecords, selectedDate, onDateSelect, isLoading }: EmotionCalendarProps) {
  // 감정 기록을 캘린더 이벤트로 변환
  const events = emotionRecords.map(record => ({
    id: record.id,
    title: EMOTION_ICONS[record.emotion as keyof typeof EMOTION_ICONS],
    start: new Date(record.date),
    end: new Date(record.date),
    resource: record,
  }));

  const eventStyleGetter = (event: any) => {
    const emotionLevel = event.resource.emotion;
    return {
      style: {
        backgroundColor: EMOTION_COLORS[emotionLevel as keyof typeof EMOTION_COLORS],
        borderRadius: '8px',
        border: 'none',
        color: 'white',
        fontSize: '18px',
        textAlign: 'center' as const,
      }
    };
  };

  const dayPropGetter = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    return {
      style: {
        backgroundColor: isToday ? '#f0f9ff' : 'white',
      }
    };
  };

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
    <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow border-sky-light/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-sky-800 text-center">
          감정 달력
        </CardTitle>
        <p className="text-sky-600 text-sm text-center">
          매일의 감정을 한눈에 확인해보세요
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="mb-4 flex justify-center gap-2 flex-wrap">
          {Object.entries(EMOTION_ICONS).map(([level, icon]) => (
            <div key={level} className="flex items-center gap-1 text-sm">
              <span className="text-lg">{icon}</span>
              <span className="text-gray-600">
                {level === '1' && '매우 나쁨'}
                {level === '2' && '나쁨'}
                {level === '3' && '보통'}
                {level === '4' && '좋음'}
                {level === '5' && '매우 좋음'}
              </span>
            </div>
          ))}
        </div>

        <div style={{ height: '500px' }} className="emotion-calendar">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            culture="ko"
            date={selectedDate}
            onNavigate={onDateSelect}
            views={['month']}
            defaultView="month"
            eventPropGetter={eventStyleGetter}
            dayPropGetter={dayPropGetter}
            showMultiDayTimes={false}
            popup={false}
            messages={{
              next: "다음",
              previous: "이전",
              today: "오늘",
              month: "월",
              week: "주", 
              day: "일",
              date: "날짜",
              time: "시간",
              event: "이벤트",
            }}
            formats={{
              monthHeaderFormat: (date: Date) => 
                format(date, 'yyyy년 M월', { locale: ko }),
              dayHeaderFormat: (date: Date) => 
                format(date, 'E', { locale: ko }),
              dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => 
                `${format(start, 'M월 d일', { locale: ko })} - ${format(end, 'M월 d일', { locale: ko })}`,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
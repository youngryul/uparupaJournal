import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { X, Save } from "lucide-react";

interface PeriodRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: any) => void;
  selectedDate: Date;
}

const SYMPTOMS = [
  "복통",
  "두통",
  "메스꺼움",
  "피로감",
  "유방 통증",
  "복부 팽만",
  "기분 변화",
  "불안감",
  "우울감",
  "식욕 변화"
];

const MOODS = [
  "😊 기분 좋음",
  "😐 보통",
  "😔 우울함",
  "😤 짜증남",
  "😰 불안함",
  "😴 피곤함",
  "💪 활력",
  "😌 평온함"
];

export function PeriodRecordModal({ isOpen, onClose, onSave, selectedDate }: PeriodRecordModalProps) {
  const [recordType, setRecordType] = useState<'start' | 'end' | 'symptom' | 'mood'>('start');
  const [flow, setFlow] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const record = {
      date: format(selectedDate, 'yyyy-MM-dd'),
      type: recordType,
      flow: recordType === 'start' ? flow : undefined,
      symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
      mood: mood || undefined,
      notes: notes.trim() || undefined
    };
    
    onSave(record);
    
    // 폼 초기화
    setRecordType('start');
    setFlow('medium');
    setSelectedSymptoms([]);
    setMood('');
    setNotes('');
  };

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>생리 기록</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 날짜 표시 */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">선택한 날짜</p>
            <p className="font-semibold text-lg">
              {format(selectedDate, 'yyyy년 M월 d일 (E)', { locale: ko })}
            </p>
          </div>

          {/* 기록 유형 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">기록 유형</Label>
            <RadioGroup value={recordType} onValueChange={(value: any) => setRecordType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="start" id="start" />
                <Label htmlFor="start" className="text-red-600 font-medium">생리 시작</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="end" id="end" />
                <Label htmlFor="end" className="text-red-600 font-medium">생리 종료</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="symptom" id="symptom" />
                <Label htmlFor="symptom" className="text-orange-600 font-medium">증상 기록</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mood" id="mood" />
                <Label htmlFor="mood" className="text-blue-600 font-medium">기분 기록</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 생리량 (생리 시작일 때만) */}
          {recordType === 'start' && (
            <div className="space-y-3">
              <Label className="text-base font-medium">생리량</Label>
              <RadioGroup value={flow} onValueChange={(value: any) => setFlow(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="text-pink-600">적음 (연분홍)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="text-red-600">보통 (빨간색)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="heavy" id="heavy" />
                  <Label htmlFor="heavy" className="text-red-800">많음 (진한 빨간색)</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* 증상 선택 (증상 기록일 때만) */}
          {recordType === 'symptom' && (
            <div className="space-y-3">
              <Label className="text-base font-medium">증상 선택</Label>
              <div className="grid grid-cols-2 gap-2">
                {SYMPTOMS.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={selectedSymptoms.includes(symptom)}
                      onCheckedChange={() => handleSymptomToggle(symptom)}
                    />
                    <Label htmlFor={symptom} className="text-sm">{symptom}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 기분 선택 (기분 기록일 때만) */}
          {recordType === 'mood' && (
            <div className="space-y-3">
              <Label className="text-base font-medium">기분 선택</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger>
                  <SelectValue placeholder="기분을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map((moodOption) => (
                    <SelectItem key={moodOption} value={moodOption}>
                      {moodOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-medium">메모</Label>
            <Textarea
              id="notes"
              placeholder="추가적인 기록이나 메모를 작성하세요..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              className="flex-1 bg-pink-600 hover:bg-pink-700"
            >
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

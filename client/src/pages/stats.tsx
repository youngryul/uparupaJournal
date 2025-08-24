import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar, Heart } from "lucide-react";

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft to-cloud-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-sky-light rounded-full flex items-center justify-center text-4xl mx-auto mb-4 animate-float">
            📊
          </div>
          <h1 className="text-3xl font-bold text-sky-800 mb-2">나의 통계</h1>
          <p className="text-sky-600">일기와 회고록을 통해 나를 알아가보세요</p>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-sky-800 flex items-center justify-center gap-2">
                <Heart className="w-6 h-6" />
                일기 작성 통계
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-sky-600 mb-2">0</div>
              <p className="text-sky-500">총 작성된 일기</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-sky-800 flex items-center justify-center gap-2">
                <BookOpen className="w-6 h-6" />
                회고록 통계
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-sky-600 mb-2">0</div>
              <p className="text-sky-500">총 작성된 회고록</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-sky-800 flex items-center justify-center gap-2">
                <TrendingUp className="w-6 h-6" />
                연속 작성
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-sky-600 mb-2">0</div>
              <p className="text-sky-500">연속 작성 일수</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-sky-800 flex items-center justify-center gap-2">
                <Calendar className="w-6 h-6" />
                이번 달
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-sky-600 mb-2">0</div>
              <p className="text-sky-500">이번 달 작성 수</p>
            </CardContent>
          </Card>
        </div>

        {/* 향후 확장을 위한 안내 */}
        <Card className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl axolotl-shadow">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-sky-light/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              🚀
            </div>
            <h3 className="text-xl font-bold text-sky-800 mb-2">더 많은 통계가 곧 추가됩니다!</h3>
            <p className="text-sky-600">감정 분석, 월별 트렌드, 개인 성장 차트 등 다양한 인사이트를 제공할 예정입니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

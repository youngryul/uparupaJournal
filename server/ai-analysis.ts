import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DiaryAnalysisResult {
  emotionAnalysis: {
    primary: string;
    secondary: string[];
    confidence: number;
  };
  sentimentScore: number; // -100 to 100
  themes: string[];
  keywords: string[];
  suggestions: string;
  summary: string;
}

export async function analyzeDiary(content: string, emotion: string): Promise<DiaryAnalysisResult> {
  try {
    const prompt = `다음 일기 내용을 한국어로 분석해주세요:

일기 내용: "${content}"
작성자가 선택한 감정: "${emotion}"

다음 형식의 JSON으로 분석 결과를 제공해주세요:
{
  "emotionAnalysis": {
    "primary": "주요 감정 (한국어)",
    "secondary": ["보조 감정들 (한국어 배열)"],
    "confidence": 0.85
  },
  "sentimentScore": 75,
  "themes": ["주요 주제들 (한국어 배열)"],
  "keywords": ["핵심 키워드들 (한국어 배열)"],
  "suggestions": "일기 작성자를 위한 따뜻하고 건설적인 제안사항 (한국어, 2-3문장)",
  "summary": "일기 내용을 한 문장으로 요약 (한국어)"
}

분석 기준:
- emotionAnalysis: 일기에서 느껴지는 감정을 세밀하게 분석 (confidence는 0-1 범위)
- sentimentScore: -100(매우 부정적) ~ 100(매우 긍정적) 범위의 감정 점수
- themes: 일기의 주요 주제나 상황 (최대 5개)
- keywords: 중요한 키워드나 감정 표현 (최대 8개)
- suggestions: 작성자의 마음을 이해하고 공감하는 따뜻한 조언
- summary: 일기의 핵심 내용을 간결하게 요약

따뜻하고 공감적인 톤으로 분석해주세요.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "당신은 일기 분석 전문가입니다. 사용자의 감정을 이해하고 따뜻하게 공감하며 건설적인 피드백을 제공합니다. JSON 형식으로만 응답해주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    // 데이터 검증 및 기본값 설정
    return {
      emotionAnalysis: {
        primary: result.emotionAnalysis?.primary || "알 수 없음",
        secondary: Array.isArray(result.emotionAnalysis?.secondary) ? result.emotionAnalysis.secondary : [],
        confidence: typeof result.emotionAnalysis?.confidence === 'number' ? result.emotionAnalysis.confidence : 0.5
      },
      sentimentScore: typeof result.sentimentScore === 'number' ? Math.max(-100, Math.min(100, result.sentimentScore)) : 0,
      themes: Array.isArray(result.themes) ? result.themes : [],
      keywords: Array.isArray(result.keywords) ? result.keywords : [],
      suggestions: result.suggestions || "오늘도 소중한 일기를 써주셔서 감사합니다.",
      summary: result.summary || "오늘의 일기"
    };
  } catch (error) {
    console.error("AI 분석 오류:", error);
    throw new Error("일기 분석 중 오류가 발생했습니다.");
  }
}
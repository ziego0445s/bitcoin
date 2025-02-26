import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface TradingAdvice {
  buyTarget: string;
  stopLoss: string;
  takeProfit: string;
  analysis: {
    trend: string;
    technical: string;
    volume: string;
    conclusion: string;
  };
}

export async function POST(req: Request) {
  const { 
    price,
    rsi,
    volume,
    priceChange24h,    // 24시간 가격 변화율
    volumeChange24h,   // 24시간 거래량 변화율
    macd,             // MACD 지표
    ma50,            // 50일 이동평균
    ma200,           // 200일 이동평균
    bollingerUpper,  // 볼린저 밴드 상단
    bollingerLower,  // 볼린저 밴드 하단
    marketSentiment, // 시장 감성 지수
  } = await req.json();
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 암호화폐 트레이딩 전문가입니다. 주어진 데이터를 분석하여 JSON 형식으로 응답해주세요."
        },
        {
          role: "user",
          content: `현재 비트코인 시장 데이터:
            
            가격 정보:
            - 현재가: $${price}
            - 24시간 변화율: ${priceChange24h}%
            
            기술적 지표:
            - RSI (14): ${rsi}
            - MACD: ${macd}
            - 50일 이동평균: $${ma50}
            - 200일 이동평균: $${ma200}
            - 볼린저 밴드: 상단 $${bollingerUpper} / 하단 $${bollingerLower}
            
            거래량 분석:
            - 현재 거래량: ${volume}
            - 24시간 거래량 변화: ${volumeChange24h}%
            
            시장 심리:
            - 시장 감성 지수: ${marketSentiment}
            
            다음 JSON 형식으로 응답해주세요:
            {
              "buyTarget": "$XX,XXX",
              "stopLoss": "$XX,XXX",
              "takeProfit": "$XX,XXX",
              "analysis": {
                "trend": "전반적인 시장 트렌드 분석",
                "technical": "기술적 지표 분석",
                "volume": "거래량 분석",
                "conclusion": "종합 결론"
              }
            }`
        }
      ]
    });

    // GPT 응답을 JSON으로 파싱
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('GPT response is empty');
    }

    // 마크다운에서 JSON 부분만 추출
    const jsonContent = content.replace(/```json\n|\n```/g, '').trim();
    const advice = JSON.parse(jsonContent) as TradingAdvice;
    return NextResponse.json(advice);
  } catch (err) {
    console.error('Trading advice error:', err);
    return NextResponse.json({ error: 'GPT 응답을 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 
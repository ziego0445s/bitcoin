/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */ // any 타입 사용에 대한 경고 무시

import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// API 키 확인 로직 강화
console.log('Environment check in API route:');
console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('API Key length:', process.env.OPENAI_API_KEY?.length);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || (() => {
    console.error('OPENAI_API_KEY is not set');
    throw new Error('OpenAI API key is not configured');
  })()
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

interface MarketData {
  // ... 기존 데이터 ...
  stochastic: {
    k: number;  // Fast %K
    d: number;  // Slow %D
  };
  obv: number;  // On Balance Volume
  pricePatterns: {
    isDoji: boolean;        // 도지 패턴
    isMorningStar: boolean; // 모닝스타 패턴
    isHammer: boolean;      // 해머 패턴
  };
  marketDepth: {
    buyPressure: number;    // 매수 압력
    sellPressure: number;   // 매도 압력
  };
  fundingRate: number;      // 펀딩비
  openInterest: number;     // 미체결약정
}

interface HistoricalDataPoint {
  time: string;
  price: string;
  volume: string;
  rsi: string;
  macd: string;
  bollingerUpper: string;
  bollingerLower: string;
}

export async function POST(req: Request) {
  console.log('Trading advice request received:', new Date().toISOString());
  try {
    const data = await req.json();
    console.log('Request data:', data);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 암호화폐 트레이딩 전문가입니다. 주어진 데이터를 종합 분석하고 피보나치 레벨을 참고하여 현재가보다는 진입가가 높지않게 최적의 진입가(buyTarget),손절가(stopLoss),익절가(takeProfit)를 JSON 형식으로 응답해주세요. "
        },
        {
          role: "user",
          content: `현재 비트코인 시장 데이터:
            
            최근 24시간 데이터:
            ${data.historicalData.map((h: HistoricalDataPoint) => `
            시간: ${h.time}
            - 가격: $${h.price}
            - 거래량: ${h.volume}
            - RSI: ${h.rsi}
            - MACD: ${h.macd}
            - 볼린저밴드: 상단 $${h.bollingerUpper} / 하단 $${h.bollingerLower}
            `).join('\n')}
            
            현재 가격 정보:
            - 현재가: $${data.price}
            - 24시간 변화율: ${data.priceChange24h}%
            
            피보나치 레벨:
            - 0%: $${data.fibonacciLevels.level0}
            - 23.6%: $${data.fibonacciLevels.level236}
            - 38.2%: $${data.fibonacciLevels.level382}
            - 50%: $${data.fibonacciLevels.level500}
            - 61.8%: $${data.fibonacciLevels.level618}
            - 78.6%: $${data.fibonacciLevels.level786}
            - 100%: $${data.fibonacciLevels.level1000}
            - 123.6%: $${data.fibonacciLevels.level1236}
            - 150%: $${data.fibonacciLevels.level1500}
            
            기술적 지표:
            - RSI (14): ${data.rsi}
            - MACD: ${data.macd}
            - 50일 이동평균: $${data.ma50}
            - 200일 이동평균: $${data.ma200}
            - 볼린저 밴드: 상단 $${data.bollingerUpper} / 하단 $${data.bollingerLower}
            
            거래량 분석:
            - 현재 거래량: ${data.volume}
            - 24시간 거래량 변화: ${data.volumeChange24h}%
            
            시장 심리:
            - 시장 감성 지수: ${data.marketSentiment}

            추가 기술적 지표:
            - Stochastic: K(${data.stochastic.k}), D(${data.stochastic.d})
            - OBV: ${data.obv}
            
            차트 패턴:
            - 도지: ${data.pricePatterns.isDoji}
            - 모닝스타: ${data.pricePatterns.isMorningStar}
            - 해머: ${data.pricePatterns.isHammer}
            
            시장 심리:
            - 매수 압력: ${data.marketDepth.buyPressure}
            - 매도 압력: ${data.marketDepth.sellPressure}
            
            선물 시장:
            - 펀딩비: ${data.fundingRate}%
            - 미체결약정: ${data.openInterest}

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
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    console.log('GPT response received:', completion.choices[0].message);

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('GPT response is empty');
    }

    try {
      // JSON 파싱 시도
      const jsonContent = content.replace(/```json\n|\n```/g, '').trim();
      const advice = JSON.parse(jsonContent);
      
      // 응답 형식 검증
      if (!advice.buyTarget || !advice.stopLoss || !advice.takeProfit || !advice.analysis) {
        throw new Error('Invalid response format');
      }

      return NextResponse.json(advice);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('GPT response format is invalid');
    }

  } catch (err) {
    const error = err as Error;
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      error: 'GPT 응답을 가져오는데 실패했습니다.',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
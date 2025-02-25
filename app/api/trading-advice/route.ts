import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  const { price, rsi, volume } = await req.json();
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 암호화폐 트레이딩 전문가입니다. 주어진 데이터를 기반으로 간단한 트레이딩 조언을 제공해주세요."
        },
        {
          role: "user",
          content: `현재 비트코인 데이터:
            가격: $${price}
            RSI: ${rsi}
            거래량: ${volume}
            
            이 데이터를 기반으로 다음 정보를 제공해주세요:
            1. 매수 목표가
            2. 손절가
            3. 익절가
            4. 간단한 이유
            
            다음 형식으로 응답해주세요:
            매수 목표가: $XX,XXX, 손절가: $XX,XXX, 익절가: $XX,XXX, 분석: 귀하의 간단한 분석`
        }
      ]
    });

    return NextResponse.json(completion.choices[0].message.content);
  } catch (err) {
    console.error('Trading advice error:', err);
    return NextResponse.json('GPT 응답을 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.', { status: 500 });
  }
} 
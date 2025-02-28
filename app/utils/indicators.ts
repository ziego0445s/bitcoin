/* eslint-disable @typescript-eslint/no-unused-vars */
// 이동평균 계산
export const calculateMA = (prices: number[], period: number): number => {
  if (prices.length < period) return 0;
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
};

// MACD 계산 (12, 26, 9)
export const calculateMACD = (prices: number[]): number => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  return ema12 - ema26;
};

// 지수이동평균(EMA) 계산
const calculateEMA = (prices: number[], period: number): number => {
  if (prices.length < period) return 0;
  const k = 2 / (period + 1);
  return prices.slice(-period).reduce((ema, price, i) => {
    return price * k + ema * (1 - k);
  }, prices[prices.length - period - 1] || 0);
};

// 볼린저 밴드 계산
export const calculateBollingerBands = (prices: number[], period = 20, stdDev = 2) => {
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0 };
  }

  const slice = prices.slice(-period);
  const middle = slice.reduce((sum, price) => sum + price, 0) / period;
  
  const variance = slice.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: middle + (std * stdDev),
    middle,
    lower: middle - (std * stdDev)
  };
};

// 시장 감성 지수 계산 (0-100)
export const calculateMarketSentiment = (
  rsi: number,
  macd: number,
  currentPrice: number,
  bollingerUpper: number,
  bollingerLower: number
): number => {
  // RSI 기여도 (0-40)
  const rsiScore = rsi > 70 ? 0 : rsi < 30 ? 40 : ((70 - rsi) / 40) * 40;
  
  // MACD 기여도 (0-30)
  const macdScore = macd > 0 ? 30 : 0;
  
  // 볼린저 밴드 기여도 (0-30)
  const bandWidth = bollingerUpper - bollingerLower;
  const position = (currentPrice - bollingerLower) / bandWidth;
  const bbScore = position < 0.3 ? 30 : position > 0.7 ? 0 : ((0.7 - position) / 0.4) * 30;
  
  return rsiScore + macdScore + bbScore;
};

// 1. Stochastic Oscillator
export const calculateStochastic = (prices: number[], period: number = 14) => {
  const highs = prices.map((_, i) => 
    Math.max(...prices.slice(Math.max(0, i - period + 1), i + 1))
  );
  const lows = prices.map((_, i) => 
    Math.min(...prices.slice(Math.max(0, i - period + 1), i + 1))
  );
  
  return prices.map((price, i) => {
    const high = highs[i];
    const low = lows[i];
    return ((price - low) / (high - low)) * 100;
  });
};

// 2. OBV (On Balance Volume)
export const calculateOBV = (prices: number[], volumes: number[]) => {
  return prices.reduce((obv, price, i) => {
    if (i === 0) return [volumes[0]];
    const prevPrice = prices[i - 1];
    const currentVolume = volumes[i];
    const lastOBV = obv[obv.length - 1];
    
    if (price > prevPrice) {
      obv.push(lastOBV + currentVolume);
    } else if (price < prevPrice) {
      obv.push(lastOBV - currentVolume);
    } else {
      obv.push(lastOBV);
    }
    return obv;
  }, [] as number[]);
};

// 3. 차트 패턴 분석
export const analyzePricePatterns = (prices: number[]) => {
  return {
    isDoji: checkDoji(prices),
    isMorningStar: checkMorningStar(prices),
    isHammer: checkHammer(prices)
  };
};

// 도지 패턴 확인
const checkDoji = (prices: number[]) => {
  const lastCandle = prices.slice(-1)[0];
  const prevCandle = prices.slice(-2)[0];
  const bodySize = Math.abs(lastCandle - prevCandle);
  const averagePrice = (lastCandle + prevCandle) / 2;
  
  // 시가와 종가의 차이가 평균가격의 0.1% 이하면 도지로 간주
  return bodySize / averagePrice < 0.001;
};

// 모닝스타 패턴 확인
const checkMorningStar = (prices: number[]) => {
  if (prices.length < 3) return false;
  
  const [firstCandle, secondCandle, thirdCandle] = prices.slice(-3);
  
  // 첫 캔들이 하락, 두번째 캔들이 작은 몸통, 세번째 캔들이 상승
  return firstCandle > secondCandle && 
         Math.abs(secondCandle - prices.slice(-4)[0]) < Math.abs(firstCandle - prices.slice(-4)[0]) * 0.3 &&
         thirdCandle > secondCandle;
};

// 해머 패턴 확인
const checkHammer = (prices: number[]) => {
  const lastCandle = prices.slice(-1)[0];
  const prevCandle = prices.slice(-2)[0];
  const lowPrice = Math.min(lastCandle, prevCandle);
  const highPrice = Math.max(lastCandle, prevCandle);
  const bodySize = Math.abs(lastCandle - prevCandle);
  const shadowSize = highPrice - lowPrice;
  
  // 아래 그림자가 몸통의 2배 이상이면 해머로 간주
  return shadowSize > bodySize * 2 && lastCandle > prevCandle;
};

// 4. Binance API 관련 함수들
export const fetchFundingRate = async (): Promise<number> => {
  try {
    const response = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT`);
    const data = await response.json();
    return parseFloat(data.lastFundingRate) * 100; // 퍼센트로 변환
  } catch (error) {
    console.error('Error fetching funding rate:', error);
    return 0;
  }
};

export const fetchOpenInterest = async (): Promise<number> => {
  try {
    const response = await fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT`);
    const data = await response.json();
    return parseFloat(data.openInterest);
  } catch (error) {
    console.error('Error fetching open interest:', error);
    return 0;
  }
};

export const fetchMarketDepth = async () => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=100`);
    const data = await response.json();
    
    // 매수/매도 압력 계산
    const buyPressure = data.bids.reduce((sum: number, [price, quantity]: string[]) => 
      sum + parseFloat(price) * parseFloat(quantity), 0);
    const sellPressure = data.asks.reduce((sum: number, [price, quantity]: string[]) => 
      sum + parseFloat(price) * parseFloat(quantity), 0);
    
    return {
      buyPressure,
      sellPressure
    };
  } catch (error) {
    console.error('Error fetching market depth:', error);
    return {
      buyPressure: 0,
      sellPressure: 0
    };
  }
};

// RSI 계산 함수 수정
export const calculateRSI = (prices: number[], periods: number = 14) => {
  if (prices.length < periods + 1) {
    return Array(prices.length).fill(50); // 데이터가 부족할 경우 기본값 50 반환
  }

  const deltas = prices.slice(1).map((price, i) => price - prices[i]);
  const gains = deltas.map(d => d > 0 ? d : 0);
  const losses = deltas.map(d => d < 0 ? -d : 0);

  // 첫 번째 평균 계산
  const avgGain = gains.slice(0, periods).reduce((a, b) => a + b) / periods;
  const avgLoss = losses.slice(0, periods).reduce((a, b) => a + b) / periods;

  // 초기 RSI 값 계산
  const rsi = [50]; // 첫 번째 값은 50으로 설정
  let lastAvgGain = avgGain;
  let lastAvgLoss = avgLoss;

  // 모든 가격에 대한 RSI 계산
  for (let i = 1; i < prices.length; i++) {
    if (i < periods) {
      rsi.push(50); // 초기 기간 동안은 50으로 설정
      continue;
    }

    // 새로운 값으로 평균 업데이트
    lastAvgGain = ((lastAvgGain * (periods - 1)) + (gains[i - 1] || 0)) / periods;
    lastAvgLoss = ((lastAvgLoss * (periods - 1)) + (losses[i - 1] || 0)) / periods;

    const rs = lastAvgGain / (lastAvgLoss || 1); // 0으로 나누기 방지
    rsi.push(100 - (100 / (1 + rs)));
  }

  return rsi;
};

// 저항선과 지지선 계산 함수 추가
export const calculateSupportResistance = (prices: number[]) => {
  if (prices.length < 10) return { support: 0, resistance: 0 };

  // 최근 100개의 가격 데이터 사용
  const recentPrices = prices.slice(-100);
  
  // 피봇 포인트 계산을 위한 고가, 저가, 종가
  const high = Math.max(...recentPrices);
  const low = Math.min(...recentPrices);
  const close = recentPrices[recentPrices.length - 1];
  
  // 피봇 포인트 계산
  const pivot = (high + low + close) / 3;
  
  // 저항선과 지지선 계산
  const resistance = pivot + (pivot - low);
  const support = pivot - (high - pivot);
  
  return { support, resistance };
};

// 피보나치 레벨 계산 함수 수정
export const calculateFibonacciLevels = (prices: number[]) => {
  if (prices.length < 2) return null;

  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const diff = high - low;

  return {
    level0: high,                    // 0% - 상단
    level236: high - diff * 0.236,   // 23.6%
    level382: high - diff * 0.382,   // 38.2%
    level500: high - diff * 0.5,     // 50%
    level618: high - diff * 0.618,   // 61.8%
    level786: high - diff * 0.786,   // 78.6%
    level1000: low,                  // 100% - 하단
    level1128: low - diff * 0.128,   // 112.8%
    level1236: low - diff * 0.236,   // 123.6%
    level1382: low - diff * 0.382,   // 138.2%
    level1500: low - diff * 0.5      // 150%
  };
}; 
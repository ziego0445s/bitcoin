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
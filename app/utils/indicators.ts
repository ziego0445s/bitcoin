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

// 가격 액션 패턴 분석 함수 수정
export const analyzePricePatterns = (prices: number[]) => {
  const patterns = [];
  const window = 10;

  // 최신 데이터부터 검사하도록 변경
  for (let i = prices.length - 1; i >= window; i--) {
    const segment = prices.slice(i - window, i + 1);
    const currentPrice = prices[i];
    const prevPrice = prices[i - 1];

    if (isReversalPattern(segment)) {
      patterns.push({
        type: '추세 반전',
        subType: currentPrice > prevPrice ? '상승 반전' : '하락 반전',
        price: currentPrice,
        time: new Date(Date.now() - (prices.length - i) * 30 * 60 * 1000).toLocaleString(),
        description: currentPrice > prevPrice ? 
          '하락 추세가 상승으로 전환될 가능성이 있습니다' : 
          '상승 추세가 하락으로 전환될 가능성이 있습니다'
      });
    }

    if (isContinuationPattern(segment)) {
      patterns.push({
        type: '추세 지속',
        subType: currentPrice > prevPrice ? '상승 지속' : '하락 지속',
        price: currentPrice,
        time: new Date(Date.now() - (prices.length - i) * 30 * 60 * 1000).toLocaleString(),
        description: currentPrice > prevPrice ? 
          '현재 상승 추세가 지속될 가능성이 있습니다' : 
          '현재 하락 추세가 지속될 가능성이 있습니다'
      });
    }
  }
  
  // 이미 최신순으로 정렬되어 있으므로 바로 반환
  return patterns;
};

// 추세 강도 계산 (0-100%)
const calculateTrendStrength = (prices: number[]) => {
  const priceChanges = prices.slice(1).map((p, i) => p - prices[i]);
  const consistentDirection = priceChanges.reduce((count, change, i) => {
    if (i === 0) return 1;
    return count + (Math.sign(change) === Math.sign(priceChanges[i-1]) ? 1 : 0);
  }, 0);
  
  return (consistentDirection / priceChanges.length) * 100;
};

// 변동성 계산 (0-100%)
const calculateVolatility = (prices: number[]) => {
  const returns = prices.slice(1).map((price, i) => 
    ((price - prices[i]) / prices[i]) * 100
  );
  
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
  );
  
  // 변동성을 0-100 범위로 정규화
  return Math.min(100, (stdDev * 10));
};

// 거래량 강도 계산 (0-100%)
const calculateVolumeStrength = (prices: number[]) => {
  const priceChanges = prices.slice(1).map((price, i) => price - prices[i]);
  const avgChange = Math.abs(
    priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length
  );
  
  // 평균 가격 변화를 기준으로 강도 계산
  return Math.min(100, (avgChange / prices[prices.length - 1]) * 1000);
};

// 모멘텀 강도 계산 (0-100%)
const calculateMomentumStrength = (prices: number[]) => {
  const roc = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
  const momentum = Math.abs(roc);
  
  // 모멘텀을 0-100 범위로 정규화
  return Math.min(100, momentum * 2);
};

// 패턴 신뢰도 계산 (0-100%)
const calculatePatternStrength = (prices: number[]) => {
  const volatility = calculateVolatility(prices);
  const volume = calculateVolumeStrength(prices);
  const momentum = calculateMomentumStrength(prices);
  
  // 각 지표의 가중치 적용
  return (volatility * 0.4 + volume * 0.3 + momentum * 0.3);
};

// 반전 패턴 감지
const isReversalPattern = (prices: number[]) => {
  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const trend = prices[prices.length - 1] > prices[0];

  // 강한 가격 변동이 있고, 이전 추세와 반대 방향으로 움직일 때
  return Math.abs(last - prev) > Math.abs(avg * 0.01) && 
         ((trend && last < prev) || (!trend && last > prev));
};

// 지속 패턴 감지
const isContinuationPattern = (prices: number[]) => {
  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const trend = prices[prices.length - 1] > prices[0];

  // 현재 추세 방향으로 계속 움직일 때
  return Math.abs(last - prev) > Math.abs(avg * 0.005) && 
         ((trend && last > prev) || (!trend && last < prev));
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

// 파동 식별 및 라벨링
const identifyWaves = (prices: number[], pivots: any[]) => {
  const impulseWaves = [];
  const waveLabels = new Array(prices.length).fill(0);
  let currentWave = 0;

  // 최소 가격 변동 비율 (노이즈 필터링)
  const minPriceChange = Math.max(...prices) * 0.005; // 0.5%

  for (let i = 1; i < pivots.length; i++) {
    const priceChange = pivots[i].price - pivots[i-1].price;
    
    if (Math.abs(priceChange) < minPriceChange) continue;

    if (currentWave < 5) {
      currentWave++;
      const wave = {
        start: pivots[i-1],
        end: pivots[i],
        waveNumber: currentWave
      };
      impulseWaves.push(wave);

      // 파동 구간 라벨링
      for (let j = wave.start.index; j <= wave.end.index; j++) {
        waveLabels[j] = currentWave;
      }
    }
  }

  return { impulseWaves, waveLabels, currentWave };
};

export const calculateElliottWaves = (prices: number[]) => {
  if (prices.length < 50) return null;

  try {
    const waves = prices.slice(-50);
    const pivots = findPivots(waves);
    const { impulseWaves, waveLabels, currentWave } = identifyWaves(waves, pivots);
    
    return {
      labels: waves.map((_, i) => i.toString()),
      datasets: [
        {
          label: '가격',
          data: waves,
          borderColor: 'rgba(156, 163, 175, 0.5)',
          borderWidth: 1,
          tension: 0.1
        },
        {
          label: '파동',
          data: waves,
          borderWidth: 3,
          tension: 0.1
        }
      ],
      waveLabels,
      currentWave
    };
  } catch (error) {
    console.error('Elliott Wave calculation error:', error);
    return {
      labels: [],
      datasets: [],
      waveLabels: [],
      currentWave: 0
    };
  }
};

// 피봇 포인트 찾기 함수 개선
const findPivots = (prices: number[]) => {
  const pivots = [];
  const window = 3; // 윈도우 크기 축소
  const threshold = Math.max(...prices) * 0.002; // 0.2% 변동 임계값

  for (let i = window; i < prices.length - window; i++) {
    const leftPrices = prices.slice(i - window, i);
    const rightPrices = prices.slice(i + 1, i + window + 1);
    
    // 고점 찾기 (임계값 이상의 변동만 고려)
    if (prices[i] > Math.max(...leftPrices) && prices[i] > Math.max(...rightPrices) &&
        prices[i] - Math.min(...leftPrices.concat(rightPrices)) > threshold) {
      pivots.push({ index: i, type: 'high', price: prices[i] });
    }
    // 저점 찾기 (임계값 이상의 변동만 고려)
    if (prices[i] < Math.min(...leftPrices) && prices[i] < Math.min(...rightPrices) &&
        Math.max(...leftPrices.concat(rightPrices)) - prices[i] > threshold) {
      pivots.push({ index: i, type: 'low', price: prices[i] });
    }
  }
  return pivots;
};

// 볼륨 프로파일 계산
export const calculateVolumeProfile = (prices: number[], volumes: number[]) => {
  const priceRange = {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
  const levels = 20;
  const interval = (priceRange.max - priceRange.min) / levels;
  
  const profile = new Array(levels).fill(0);
  prices.forEach((price, i) => {
    const level = Math.floor((price - priceRange.min) / interval);
    profile[level] += volumes[i];
  });
  
  return {
    profile,
    pricePoints: Array.from({length: levels}, (_, i) => 
      priceRange.min + (i * interval)
    )
  };
};

// 모멘텀 지표들 계산
export const calculateMomentumIndicators = (prices: number[]) => {
  // ROC (Rate of Change)
  const roc = prices.map((price, i) => {
    if (i < 14) return 0;
    return ((price - prices[i - 14]) / prices[i - 14]) * 100;
  });

  // RSI 추세 강도
  const rsiTrend = calculateRSI(prices).map(rsi => {
    if (rsi > 70) return 'oversold';
    if (rsi < 30) return 'overbought';
    return 'neutral';
  });

  return { roc, rsiTrend };
};

// 매매 전략 분석 함수 추가
export const analyzeTradingStrategy = (
  currentPrice: number,
  rsiValues: number[],
  macdValue: number,
  bollingerBands: { upper: number; middle: number; lower: number },
  patterns: any[],
  volumes: number[]
) => {
  // 1. 추세 방향 파악
  const lastRSI = rsiValues[rsiValues.length - 1];
  const trendDirection = macdValue > 0 ? '상승' : '하락';
  const volatility = (bollingerBands.upper - bollingerBands.lower) / bollingerBands.middle * 100;
  
  // 2. 최근 패턴 분석
  const latestPattern = patterns[0];
  const isReversalExpected = latestPattern?.type === '추세 반전';
  
  // 3. 거래량 트렌드 분석
  const recentVolumes = volumes.slice(-5);
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const volumeTrend = recentVolumes[recentVolumes.length - 1] > avgVolume ? '증가' : '감소';

  // 4. 매매 전략 계산
  let buyTarget, stopLoss, takeProfit;
  const riskMultiplier = volatility < 20 ? 1.5 : volatility < 40 ? 2 : 2.5;

  if (isReversalExpected && latestPattern?.subType.includes('상승')) {
    // 상승 반전 예상
    buyTarget = Math.min(currentPrice, bollingerBands.lower * 1.01); // 현재가 또는 볼린저 밴드 하단의 1.01배 중 낮은 값
    stopLoss = Math.min(currentPrice * 0.99, bollingerBands.lower);
    takeProfit = currentPrice + (currentPrice - stopLoss) * riskMultiplier;
  } else if (isReversalExpected && latestPattern?.subType.includes('하락')) {
    // 하락 반전 예상
    buyTarget = Math.max(bollingerBands.lower * 1.01, currentPrice * 0.98); // 현재가의 0.98배 또는 볼린저 밴드 하단의 1.01배 중 높은 값
    stopLoss = buyTarget * 0.98;
    takeProfit = bollingerBands.middle;
  } else {
    // 일반적인 상황
    buyTarget = Math.min(currentPrice, bollingerBands.lower * 1.01); // 현재가 또는 볼린저 밴드 하단의 1.01배 중 낮은 값
    stopLoss = Math.min(currentPrice * 0.985, bollingerBands.lower);
    takeProfit = currentPrice + (currentPrice - stopLoss) * 2;
  }

  // 트렌드 설명을 더 상세하게 수정
  const trendDescriptions = trendDirection === '상승' ? [
    `현재 시장은 상승 추세를 보이고 있습니다. RSI(${lastRSI.toFixed(1)})는 ${getRsiStatus(lastRSI)}입니다. MACD가 ${macdValue.toFixed(2)}로 상승 모멘텀을 확인해주고 있으며, 볼린저 밴드 상단($${bollingerBands.upper.toFixed(2)})을 향한 움직임이 나타나고 있습니다. 이는 강세 시그널로 해석됩니다.`,
    `기술적 분석 결과 상승 추세가 확인됩니다. 현재가($${currentPrice})는 볼린저 밴드 중앙선($${bollingerBands.middle.toFixed(2)}) 위에서 움직이고 있으며, RSI ${lastRSI.toFixed(1)}와 함께 상승 동력이 유지되고 있습니다. MACD 지표도 이를 지지하고 있습니다.`,
    `상승 추세가 지속되고 있습니다. 현재 RSI(${lastRSI.toFixed(1)})와 MACD(${macdValue.toFixed(2)}) 모두 강세를 나타내고 있으며, 볼린저 밴드도 우상향하고 있어 추가 상승 여력이 있는 것으로 분석됩니다.`,
    // 추가 설명
    `현재 시장의 상승세는 강력하며, 최근 거래량이 증가하고 있어 추가 상승 가능성이 높습니다.`,
    `RSI가 60을 초과하며 강세를 보이고 있으며, MACD가 긍정적인 신호를 보내고 있습니다.`,
    `현재가가 볼린저 밴드의 상단을 향해 상승하고 있어, 추가적인 상승이 기대됩니다.`,
    `상승 추세가 지속되고 있으며, 기술적 지표들이 이를 뒷받침하고 있습니다.`,
    `현재가가 이전 고점을 돌파하며 상승세를 이어가고 있습니다.`,
    `상승 모멘텀이 강화되고 있으며, 시장의 긍정적인 심리가 반영되고 있습니다.`,
    `현재가가 볼린저 밴드의 중앙선을 상회하고 있어, 상승세가 지속될 가능성이 높습니다.`
  ] : [
    `현재 시장은 하락 추세를 보이고 있습니다. RSI(${lastRSI.toFixed(1)})는 ${getRsiStatus(lastRSI)}입니다. MACD가 ${macdValue.toFixed(2)}로 하락 모멘텀이 지속되고 있으며, 볼린저 밴드 하단($${bollingerBands.lower.toFixed(2)})을 향한 움직임이 나타나고 있어 약세가 우려됩니다.`,
    `기술적 분석 결과 하락 추세가 우세합니다. 현재가($${currentPrice})는 볼린저 밴드 중앙선($${bollingerBands.middle.toFixed(2)}) 아래에서 움직이고 있으며, RSI ${lastRSI.toFixed(1)}와 함께 하락 압력이 지속되고 있습니다. MACD 지표도 이를 확인해주고 있습니다.`,
    `하락 추세가 진행 중입니다. RSI(${lastRSI.toFixed(1)})와 MACD(${macdValue.toFixed(2)}) 모두 약세를 나타내고 있으며, 볼린저 밴드도 우하향하고 있어 추가 하락 가능성이 있는 것으로 분석됩니다.`,
    // 추가 설명
    `현재 시장의 하락세는 강력하며, 최근 거래량이 감소하고 있어 추가 하락 가능성이 높습니다.`,
    `RSI가 40 이하로 떨어지며 약세를 보이고 있으며, MACD가 부정적인 신호를 보내고 있습니다.`,
    `현재가가 볼린저 밴드의 하단을 향해 하락하고 있어, 추가적인 하락이 기대됩니다.`,
    `하락 추세가 지속되고 있으며, 기술적 지표들이 이를 뒷받침하고 있습니다.`,
    `현재가가 이전 저점을 하회하며 하락세를 이어가고 있습니다.`,
    `하락 모멘텀이 강화되고 있으며, 시장의 부정적인 심리가 반영되고 있습니다.`,
    `현재가가 볼린저 밴드의 중앙선을 하회하고 있어, 하락세가 지속될 가능성이 높습니다.`
  ];

  // 기술적 분석 설명 상세화
  const technicalDescriptions = volatility > 30 ? [
    `현재 시장의 변동성이 ${volatility.toFixed(1)}%로 매우 높은 수준입니다. 볼린저 밴드 폭이 확대되어 있어 큰 폭의 가격 변동이 예상되며, 상단($${bollingerBands.upper.toFixed(2)})과 하단($${bollingerBands.lower.toFixed(2)}) 사이에서 급격한 움직임이 나타날 수 있습니다. 리스크 관리가 특히 중요한 구간입니다.`,
    `기술적 지표들이 높은 변동성을 나타내고 있습니다. 볼린저 밴드 폭이 ${volatility.toFixed(1)}% 수준으로 확대되어 있으며, 현재가($${currentPrice})는 밴드 ${getCurrentPricePosition(currentPrice, bollingerBands)}에 위치해 있습니다. 급격한 방향 전환 가능성에 대비가 필요합니다.`,
    `시장 변동성이 ${volatility.toFixed(1)}%로 매우 높습니다. RSI와 MACD의 변동폭도 확대되어 있어, 추세 전환 시 큰 폭의 가격 변동이 동반될 수 있습니다. 적절한 손절가 설정이 필수적입니다.`,
    // 추가 설명
    `현재 변동성이 높아져 가격의 급등락이 예상됩니다. 따라서 포지션 사이즈 조절이 필요합니다.`,
    `변동성이 커지면서 시장의 불확실성이 증가하고 있습니다. 보수적인 접근이 권장됩니다.`,
    `현재가가 볼린저 밴드의 상단을 향해 상승하고 있어, 변동성 돌파 전략이 유효할 수 있습니다.`,
    `변동성이 높아지면서 리스크 관리가 필수적입니다. 적절한 손절가 설정이 필요합니다.`,
    `현재 시장의 변동성이 과열 양상을 보이고 있어, 신중한 접근이 필요합니다.`,
    `변동성이 커지면서 가격의 급등락이 예상되므로, 적극적인 리스크 관리가 필요합니다.`,
    `현재가가 볼린저 밴드의 중앙선을 상회하고 있어, 변동성이 높아질 가능성이 있습니다.`
  ] : [
    `현재 시장의 변동성이 ${volatility.toFixed(1)}%로 안정적인 수준을 보이고 있습니다. 볼린저 밴드가 수평 채널을 형성하고 있으며, 상단($${bollingerBands.upper.toFixed(2)})과 하단($${bollingerBands.lower.toFixed(2)}) 사이에서 질서있는 움직임이 예상됩니다.`,
    `기술적 지표들이 안정적인 흐름을 나타내고 있습니다. 볼린저 밴드 폭이 ${volatility.toFixed(1)}% 수준을 유지하고 있으며, 현재가($${currentPrice})는 밴드 ${getCurrentPricePosition(currentPrice, bollingerBands)}에서 안정적으로 움직이고 있습니다.`,
    `시장이 안정화 단계에 진입했습니다. RSI와 MACD의 변동폭이 축소되어 있어, 점진적이고 예측 가능한 가격 움직임이 예상됩니다. 추세 추종 전략이 유효할 수 있습니다.`,
    // 추가 설명
    `현재가가 볼린저 밴드의 중앙선을 안정적으로 유지하고 있어, 안정적인 트레이딩이 가능합니다.`,
    `변동성이 낮아지면서 가격의 안정성이 높아지고 있습니다. 점진적인 포지션 진입이 유효할 수 있습니다.`,
    `현재 시장의 변동성이 낮아 안정적인 흐름을 보이고 있습니다. 리스크 관리가 용이합니다.`,
    `변동성이 낮아지면서 가격의 예측 가능성이 높아지고 있습니다. 안정적인 수익 실현이 가능합니다.`,
    `현재가가 볼린저 밴드의 하단을 향해 안정적으로 움직이고 있어, 안정적인 트레이딩이 가능합니다.`,
    `기술적 지표들이 현재 추세를 지지하고 있으며, 매매 포인트($${buyTarget})를 참고하여 순방향 매매를 고려해보시기 바랍니다.`,
    `현재가가 볼린저 밴드의 중앙선을 안정적으로 유지하고 있어, 안정적인 수익 실현이 가능합니다.`
  ];

  // 거래량 분석 설명 확장
  const volumeDescriptions = volumeTrend === '증가' ? [
    `거래량이 평균 대비 크게 증가하고 있습니다. 최근 5개 봉 기준 평균 거래량 대비 ${getVolumeChangePercent(volumes)}% 증가했으며, 이는 현재 가격 움직임의 신뢰도를 높여주고 있습니다. 특히 ${trendDirection} 추세와 함께 나타나는 거래량 증가는 추세의 지속 가능성을 높여줍니다.`,
    `시장 참여도가 크게 높아지고 있습니다. 거래량이 평균 대비 ${getVolumeChangePercent(volumes)}% 상승했으며, 이는 현재 ${trendDirection} 추세에 대한 시장의 확신이 강화되고 있음을 시사합니다. 주도 세력의 적극적인 참여가 감지됩니다.`,
    `거래량이 유의미하게 증가하고 있습니다. 최근 거래량은 5일 평균 대비 ${getVolumeChangePercent(volumes)}% 상승했으며, 이는 시장의 방향성에 대한 참여자들의 확신이 커지고 있음을 의미합니다. ${trendDirection} 추세의 지속 가능성이 높아 보입니다.`,
    // 추가 설명
    `거래량이 증가하며 가격 상승의 신뢰도가 높아지고 있습니다. 이는 시장의 긍정적인 심리를 반영합니다.`,
    `신규 자금 유입으로 상승 동력이 강화되고 있습니다. 거래량의 증가는 매수세의 강도를 나타냅니다.`,
    `거래량 동반 상승으로 추세의 신뢰도가 높습니다. 이는 시장의 긍정적인 신호로 해석됩니다.`,
    `기관 참여도가 높아지는 것으로 분석됩니다. 이는 시장의 안정성을 높여줍니다.`,
    `거래량 증가로 인한 추가 상승 여력이 있습니다. 이는 매수세의 강도를 나타냅니다.`,
    `매수세가 강화되며 상승 추세가 지지되고 있습니다. 이는 시장의 긍정적인 신호입니다.`,
    `대규모 매수 포지션이 유입되고 있습니다. 이는 시장의 긍정적인 심리를 반영합니다.`
  ] : [
    `거래량이 평균 대비 감소하고 있습니다. 최근 5개 봉 기준 평균 거래량 대비 ${getVolumeChangePercent(volumes)}% 감소했으며, 이는 현재 가격 움직임에 대한 시장의 신중한 태도를 반영합니다. 추가적인 거래량 확인 전까지는 보수적인 접근이 필요해 보입니다.`,
    `시장 참여도가 둔화되고 있습니다. 거래량이 평균 대비 ${getVolumeChangePercent(volumes)}% 하락했으며, 이는 현재 ${trendDirection} 추세에 대한 시장의 불확실성이 커지고 있음을 시사합니다. 추가적인 매매 신호 확인이 필요합니다.`,
    `거래량이 점차 감소하고 있습니다. 최근 거래량은 5일 평균 대비 ${getVolumeChangePercent(volumes)}% 하락했으며, 이는 시장 참여자들의 관망세가 강화되고 있음을 의미합니다. 새로운 방향성 확인 전까지 신중한 접근이 필요합니다.`,
    // 추가 설명
    `거래량 감소로 인한 방향성 약화가 우려됩니다. 이는 시장의 신중한 태도를 반영합니다.`,
    `시장 참여자들의 관망세가 강화되고 있습니다. 이는 추가적인 매매 신호 확인이 필요함을 나타냅니다.`,
    `거래량 부족으로 상승 동력이 약화되고 있습니다. 이는 시장의 부정적인 신호로 해석됩니다.`,
    `기술적 반등을 위한 거래량 확인이 필요합니다. 이는 시장의 신중한 접근을 요구합니다.`,
    `현재 가격대에서 관망세가 우세합니다. 이는 시장의 불확실성을 반영합니다.`,
    `거래량 지표가 약세 신호를 보내고 있습니다. 이는 시장의 부정적인 신호로 해석됩니다.`,
    `단기 조정 가능성에 대비가 필요합니다. 이는 시장의 신중한 접근을 요구합니다.`
  ];

  // 결론 설명 상세화
  const conclusionDescriptions = isReversalExpected ? [
    `${latestPattern.subType} 패턴이 감지되어 추세 전환 가능성이 높아졌습니다. RSI(${lastRSI.toFixed(1)})와 MACD(${macdValue.toFixed(2)}) 지표도 이를 지지하고 있으며, 볼린저 밴드 기준 현재가는 ${getCurrentPricePosition(currentPrice, bollingerBands)}에 위치해 있습니다. 제시된 매매가($${buyTarget})와 손절가($${stopLoss}), 익절가($${takeProfit}) 기준으로 리스크 관리를 철저히 하시기 바랍니다.`,
    `${latestPattern.subType} 시그널이 발생했습니다. 현재 기술적 지표들이 방향 전환을 지지하고 있으며, 거래량도 이를 확인해주고 있습니다. 매매 진입 시 제시된 손절가($${stopLoss})와 익절가($${takeProfit})를 준수하여 리스크 관리를 우선시하시기 바랍니다.`,
    `${latestPattern.subType} 패턴이 확인되었습니다. 볼린저 밴드와 RSI, MACD 등 주요 지표들이 방향 전환 가능성을 지지하고 있으며, 거래량도 이를 뒷받침하고 있습니다. 매매 포인트($${buyTarget})를 참고하여 신중한 접근을 권장드립니다.`,
    // 추가 설명
    `현재가가 볼린저 밴드의 하단을 향해 하락하고 있어, 반전 매매가 유효할 수 있습니다. 리스크 관리를 철저히 하시기 바랍니다.`,
    `기술적 지표들이 반전을 확인해주고 있으며, 매매 포인트($${buyTarget})를 참고하여 신중한 접근을 권장드립니다.`,
    `현재가가 볼린저 밴드의 중앙선을 하회하고 있어, 반전 매매가 유효할 수 있습니다. 리스크 관리를 철저히 하시기 바랍니다.`,
    `주도 세력의 방향 전환이 감지되고 있으며, 매매 포인트($${buyTarget})를 참고하여 신중한 접근을 권장드립니다.`,
    `반전 시그널의 강도가 높아 대응이 필요합니다. 제시된 손절가($${stopLoss})와 익절가($${takeProfit})를 준수하여 리스크 관리를 우선시하시기 바랍니다.`,
    `현재가가 볼린저 밴드의 상단을 향해 상승하고 있어, 반전 매매가 유효할 수 있습니다. 리스크 관리를 철저히 하시기 바랍니다.`,
    `기술적 반전 신호가 감지되어 방향 전환이 예상됩니다. 제시된 매매가($${buyTarget})와 손절가($${stopLoss}), 익절가($${takeProfit}) 기준으로 리스크 관리를 철저히 하시기 바랍니다.`
  ] : [
    `현재 추세가 지속될 것으로 예상됩니다. RSI(${lastRSI.toFixed(1)})와 MACD(${macdValue.toFixed(2)}) 지표가 추세 지속을 지지하고 있으며, 볼린저 밴드도 이를 확인해주고 있습니다. 제시된 매매가($${buyTarget})와 손절가($${stopLoss}), 익절가($${takeProfit}) 기준으로 포지션 관리를 하시기 바랍니다.`,
    `기존 ${trendDirection} 추세가 유효합니다. 주요 기술적 지표들이 현재 추세를 지지하고 있으며, 거래량도 이를 확인해주고 있습니다. 제시된 매매 구간을 참고하여 리스크 관리와 함께 트레이딩하시기 바랍니다.`,
    `추세의 건전성이 확인되고 있습니다. 볼린저 밴드 내에서의 움직임이 안정적이며, RSI와 MACD도 현재 추세를 지지하고 있습니다. 매매 포인트($${buyTarget})를 참고하여 순방향 매매를 고려해보시기 바랍니다.`,
    // 추가 설명
    `현재가가 볼린저 밴드의 중앙선을 안정적으로 유지하고 있어, 안정적인 트레이딩이 가능합니다. 리스크 관리를 철저히 하시기 바랍니다.`,
    `기술적 지표들이 현재 추세를 지지하고 있으며, 매매 포인트($${buyTarget})를 참고하여 순방향 매매를 고려해보시기 바랍니다.`,
    `현재가가 볼린저 밴드의 하단을 향해 안정적으로 움직이고 있어, 안정적인 수익 실현이 가능합니다. 리스크 관리를 철저히 하시기 바랍니다.`,
    `현재가가 볼린저 밴드의 상단을 향해 상승하고 있어, 안정적인 트레이딩이 가능합니다. 리스크 관리를 철저히 하시기 바랍니다.`,
    `기술적 지표들이 현재 추세를 지지하고 있으며, 매매 포인트($${buyTarget})를 참고하여 순방향 매매를 고려해보시기 바랍니다.`,
    `현재가가 볼린저 밴드의 중앙선을 안정적으로 유지하고 있어, 안정적인 수익 실현이 가능합니다. 리스크 관리를 철저히 하시기 바랍니다.`,
    `현재가가 볼린저 밴드의 하단을 향해 안정적으로 움직이고 있어, 안정적인 수익 실현이 가능합니다. 리스크 관리를 철저히 하시기 바랍니다.`
  ];

  // RSI 상태 반환 함수
  function getRsiStatus(rsi: number): string {
    if (rsi > 70) return '과매수 구간에 진입했습니다';
    if (rsi < 30) return '과매도 구간에서 반등이 예상됩니다';
    if (rsi > 60) return '강세 구간에서 움직이고 있습니다';
    if (rsi < 40) return '약세 구간에서 움직이고 있습니다';
    return '중립 구간에서 안정적으로 움직이고 있습니다';
  }

  // 현재가의 볼린저 밴드 내 위치 반환
  function getCurrentPricePosition(price: number, bands: { upper: number; middle: number; lower: number }): string {
    const upperDist = Math.abs(price - bands.upper);
    const middleDist = Math.abs(price - bands.middle);
    const lowerDist = Math.abs(price - bands.lower);
    
    if (upperDist < middleDist && upperDist < lowerDist) return '상단 부근';
    if (lowerDist < middleDist && lowerDist < upperDist) return '하단 부근';
    return '중앙선 부근';
  }

  // 거래량 변화율 계산
  function getVolumeChangePercent(volumes: number[]): string {
    const recentVolumes = volumes.slice(-5);
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    const latestVolume = recentVolumes[recentVolumes.length - 1];
    return ((latestVolume - avgVolume) / avgVolume * 100).toFixed(1);
  }

  // 랜덤 인덱스 생성 (0-9)
  const randomIndex = Math.floor(Math.random() * 10);

  return {
    buyTarget: buyTarget.toFixed(2),
    stopLoss: stopLoss.toFixed(2),
    takeProfit: takeProfit.toFixed(2),
    analysis: {
      trend: trendDescriptions[randomIndex],
      technical: technicalDescriptions[randomIndex],
      volume: volumeDescriptions[randomIndex],
      conclusion: conclusionDescriptions[randomIndex]
    }
  };
}; 
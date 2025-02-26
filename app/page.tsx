/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  calculateMA,
  calculateMACD,
  calculateBollingerBands,
  calculateMarketSentiment
} from './utils/indicators';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// 차트 데이터 타입 정의
interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
    fill?: boolean;
  }[];
}

interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    type: 'bar';
  }[];
}

// tradingAdvice 상태 타입 정의
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

// RSI 계산 함수
const calculateRSI = (prices: number[], periods: number = 14) => {
  const changes = prices.slice(1).map((price, i) => price - prices[i]);
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

  let avgGain = gains.slice(0, periods).reduce((a, b) => a + b) / periods;
  let avgLoss = losses.slice(0, periods).reduce((a, b) => a + b) / periods;

  const rsi = [100 - (100 / (1 + avgGain / avgLoss))];

  for (let i = periods; i < changes.length; i++) {
    avgGain = ((avgGain * (periods - 1)) + gains[i]) / periods;
    avgLoss = ((avgLoss * (periods - 1)) + losses[i]) / periods;
    rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
  }

  return rsi;
};

// Binance API 응답 타입 정의
type BinanceKlineData = [
  number,     // Open time
  string,     // Open
  string,     // High
  string,     // Low
  string,     // Close
  string,     // Volume
  // ... 나머지 필드는 현재 사용하지 않음
];

export default function Home() {
  const [price, setPrice] = useState<string>('0');
  const [chartData, setChartData] = useState<LineChartData>({ labels: [], datasets: [] });
  const [rsiData, setRsiData] = useState<LineChartData>({ labels: [], datasets: [] });
  const [volumeData, setVolumeData] = useState<BarChartData>({ labels: [], datasets: [] });
  const [tradingAdvice, setTradingAdvice] = useState<TradingAdvice | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isGptResponse, setIsGptResponse] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 실시간 가격 가져오기 useEffect를 15분 간격 업데이트로 수정
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
          params: {
            symbol: 'BTCUSDT'
          }
        });
        setPrice(parseFloat(response.data.price).toFixed(2));
      } catch (error) {
        console.error('Error fetching current price:', error);
      }
    };

    fetchCurrentPrice(); // 초기 가격 가져오기
    const interval = setInterval(fetchCurrentPrice, 900000); // 15분 = 900000ms

    return () => clearInterval(interval);
  }, []);

  // 30분봉 데이터 가져오기
  useEffect(() => {
    const fetchKlineData = async () => {
      try {
        const response = await axios.get<BinanceKlineData[]>(
          'https://api.binance.com/api/v3/klines',
          {
            params: {
              symbol: 'BTCUSDT',
              interval: '30m',
              limit: 48
            }
          }
        );

        const labels = response.data.map((item) => 
          new Date(item[0]).toLocaleTimeString()
        );
        
        const prices = response.data.map((item) => 
          parseFloat(item[4])
        );

        const volumes = response.data.map((item) => 
          parseFloat(item[5])
        );

        // RSI 계산
        const rsiValues = calculateRSI(prices);
        
        // 가격 차트 데이터
        setChartData({
          labels,
          datasets: [
            {
              label: 'Bitcoin Price (USDT)',
              data: prices,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            }
          ]
        });

        // RSI 차트 데이터
        setRsiData({
          labels,
          datasets: [
            {
              label: 'RSI',
              data: rsiValues,
              borderColor: 'rgb(255, 99, 132)',
              tension: 0.1,
              fill: false
            }
          ]
        });

        // 거래량 차트 데이터
        setVolumeData({
          labels,
          datasets: [
            {
              label: 'Volume',
              data: volumes,
              backgroundColor: 'rgb(53, 162, 235, 0.5)',
              type: 'bar'
            }
          ]
        });

      } catch (error) {
        console.error('Error fetching kline data:', error);
      }
    };

    fetchKlineData();
    const interval = setInterval(fetchKlineData, 30000);

    return () => clearInterval(interval);
  }, []);

  // 시간 업데이트를 위한 useEffect
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
  }, []);

  // GPT 트레이딩 조언 가져오기
  const fetchTradingAdvice = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentPrice = parseFloat(price.replace(/[$,]/g, ''));
      const currentRsi = rsiData.datasets[0]?.data?.slice(-1)[0] || 0;
      const currentVolume = volumeData.datasets[0]?.data?.slice(-1)[0] || 0;
      
      // 추가 데이터 계산
      const prices = chartData.datasets[0]?.data || [];
      const volumes = volumeData.datasets[0]?.data || [];
      
      // 24시간 변화율 계산
      const priceChange24h = ((currentPrice - prices[0]) / prices[0] * 100).toFixed(2);
      const volumeChange24h = ((currentVolume - volumes[0]) / volumes[0] * 100).toFixed(2);
      
      // 이동평균 계산
      const ma50 = calculateMA(prices, 50);
      const ma200 = calculateMA(prices, 200);
      
      // MACD 계산 (12, 26, 9)
      const macd = calculateMACD(prices);
      
      // 볼린저 밴드 계산 (20일, 2표준편차)
      const { upper: bollingerUpper, lower: bollingerLower } = calculateBollingerBands(prices);
      
      // 시장 감성 지수 계산 (RSI, MACD, 볼린저 밴드 기반)
      const marketSentiment = calculateMarketSentiment(currentRsi, macd, currentPrice, bollingerUpper, bollingerLower);

      const response = await fetch('/api/trading-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: currentPrice,
          rsi: currentRsi.toFixed(2),
          volume: currentVolume.toFixed(2),
          priceChange24h,
          volumeChange24h,
          macd: macd.toFixed(2),
          ma50: ma50.toFixed(2),
          ma200: ma200.toFixed(2),
          bollingerUpper: bollingerUpper.toFixed(2),
          bollingerLower: bollingerLower.toFixed(2),
          marketSentiment: marketSentiment.toFixed(2),
        }),
      });

      if (!response.ok) {
        throw new Error('API 요청에 실패했습니다.');
      }

      const advice = await response.json();
      setTradingAdvice(advice);
      setIsGptResponse(true);
    } catch (err) {
      console.error('Error fetching trading advice:', err);
      setTradingAdvice(null);
      setIsGptResponse(false);
    } finally {
      setIsLoading(false);
    }
  }, [price, chartData, rsiData, volumeData]);

  return (
    <main className="min-h-screen bg-gray-50 p-2 sm:p-8">
      <div className="max-w-full mx-auto">
        {/* 헤더 섹션 */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 mb-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">Bitcoin Trading Analysis</h1>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <p className="text-xl sm:text-2xl text-gray-600">
              Current Price: <span className="font-bold text-blue-600">${price}</span>
            </p>
            <div className="h-6 w-px bg-gray-300" />
            <p className="text-xs sm:text-sm text-gray-500">
              Last updated: {currentTime}
            </p>
          </div>
        </div>

        {/* Trading Advice Section */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">AI Trading Recommendation</h2>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  isLoading ? 'bg-yellow-500 animate-pulse' :
                  isGptResponse ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium text-gray-600">
                  {isLoading ? 'Analyzing market data...' :
                   isGptResponse ? 'AI Analysis Complete' : 'Analysis Unavailable'}
                </span>
              </div>
            </div>
            <button
              onClick={fetchTradingAdvice}
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg font-semibold transition-all transform
                ${isLoading 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'
                } text-white`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  분석 중...
                </span>
              ) : '새로운 분석 받기'}
            </button>
          </div>
          
          <div className="mb-4 text-sm text-gray-500">
            마지막 업데이트: {currentTime}
          </div>
          
          {tradingAdvice ? (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-8 shadow-inner">
              {/* 가격 정보 카드 그리드 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <h3 className="text-sm font-semibold text-blue-500">매수 목표가</h3>
                    <p className="text-xl sm:text-2xl font-bold text-blue-700">{tradingAdvice.buyTarget}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                    <h3 className="text-sm font-semibold text-red-500">손절가</h3>
                    <p className="text-xl sm:text-2xl font-bold text-red-700">{tradingAdvice.stopLoss}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <h3 className="text-sm font-semibold text-green-500">익절가</h3>
                    <p className="text-xl sm:text-2xl font-bold text-green-700">{tradingAdvice.takeProfit}</p>
                  </div>
                </div>

                {/* 분석 섹션 */}
                <div className="space-y-3">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">시장 분석</h3>
                  
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-700">시장 트렌드</h4>
                      <p className="text-sm sm:text-base text-gray-600">{tradingAdvice.analysis.trend}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-700">기술적 지표</h4>
                      <p className="text-sm sm:text-base text-gray-600">{tradingAdvice.analysis.technical}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-700">거래량 분석</h4>
                      <p className="text-sm sm:text-base text-gray-600">{tradingAdvice.analysis.volume}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-blue-500">
                      <h4 className="text-base font-semibold text-gray-700">종합 결론</h4>
                      <p className="text-sm sm:text-base text-gray-600">{tradingAdvice.analysis.conclusion}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-6 text-base">
              분석을 시작하려면 '새로운 분석 받기' 버튼을 클릭하세요
            </div>
          )}
        </div>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* 가격 차트 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-full h-[400px]">
              {chartData.datasets.length > 0 && (
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Bitcoin 30-Minute Price Chart',
                        font: {
                          size: 16,
                          weight: 'bold'
                        }
                      },
                      legend: {
                        position: 'top'
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* RSI & Volume 차트 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="w-full h-[250px]">
                {rsiData.datasets.length > 0 && (
                  <Line
                    data={rsiData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: 'RSI Indicator (14)',
                          font: {
                            size: 16,
                            weight: 'bold'
                          }
                        }
                      },
                      scales: {
                        y: {
                          min: 0,
                          max: 100,
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                          }
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="w-full h-[250px]">
                {volumeData.datasets.length > 0 && (
                  <Bar
                    data={volumeData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: 'Trading Volume',
                          font: {
                            size: 16,
                            weight: 'bold'
                          }
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

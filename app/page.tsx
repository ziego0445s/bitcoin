/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */ // any 타입 사용에 대한 경고 무시

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
  Legend,
  LineController
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import {
  calculateMA,
  calculateMACD,
  calculateBollingerBands,
  calculateMarketSentiment,
  calculateStochastic,
  calculateOBV,
  analyzePricePatterns,
  fetchFundingRate,
  fetchOpenInterest,
  fetchMarketDepth,
  calculateRSI,
  calculateSupportResistance,
  calculateFibonacciLevels,
  calculateElliottWaves,
  calculateVolumeProfile,
  calculateMomentumIndicators,
  analyzeTradingStrategy
} from './utils/indicators';
import Image from 'next/image';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  annotationPlugin
);

// 차트 데이터 타입 정의
interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string | ((ctx: any) => string);
    backgroundColor?: string | ((ctx: any) => string);
    tension?: number;
    fill?: boolean;
    borderWidth?: number;
    borderDash?: number[];
    pointRadius?: number | ((ctx: any) => number);
    pointBackgroundColor?: string | ((ctx: any) => string);
  }[];
  waveLabels?: number[];  // 엘리엇 파동 라벨 추가
  currentWave?: number;   // 현재 파동 추가
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

// 차트 옵션 타입 정의 추가
interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  interaction: {
    mode: 'index' | 'dataset' | 'point' | 'nearest' | 'x' | 'y';
    intersect: boolean;
  };
  plugins: {
    title: {
      display: boolean;
      text: string;
      font: {
        size: number;
        weight: 'bold' | 'normal' | 'lighter' | 'bolder';
      };
    };
    legend: {
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip: {
      mode: 'index' | 'dataset' | 'point' | 'nearest' | 'x' | 'y';
      intersect: boolean;
    };
    annotation: {
      annotations: {
        fib0: {
          type: 'line';
          yMin: number;
          yMax: number;
          borderColor: string;
          borderWidth: number;
          borderDash: number[];
          label: {
            enabled: boolean;
            content: string;
            position: 'start';
            backgroundColor: string;
            color: 'white';
            padding: 8;
            font: {
              size: 13;
              weight: 'bold';
            };
          };
        };
        fib236: {
          type: 'line';
          yMin: number;
          yMax: number;
          borderColor: string;
          borderWidth: number;
          borderDash: number[];
          label: {
            enabled: boolean;
            content: string;
            position: 'start';
            backgroundColor: string;
            color: 'white';
            padding: 8;
            font: {
              size: 13;
              weight: 'bold';
            };
          };
        };
        fib382: {
          type: 'line';
          yMin: number;
          yMax: number;
          borderColor: string;
          borderWidth: number;
          borderDash: number[];
          label: {
            enabled: boolean;
            content: string;
            position: 'start';
            backgroundColor: string;
            color: 'white';
            padding: 8;
            font: {
              size: 13;
              weight: 'bold';
            };
          };
        };
        fib500: {
          type: 'line';
          yMin: number;
          yMax: number;
          borderColor: string;
          borderWidth: number;
          borderDash: number[];
          label: {
            enabled: boolean;
            content: string;
            position: 'start';
            backgroundColor: string;
            color: 'white';
            padding: 8;
            font: {
              size: 13;
              weight: 'bold';
            };
          };
        };
        fib618: {
          type: 'line';
          yMin: number;
          yMax: number;
          borderColor: string;
          borderWidth: number;
          borderDash: number[];
          label: {
            enabled: boolean;
            content: string;
            position: 'start';
            backgroundColor: string;
            color: 'white';
            padding: 8;
            font: {
              size: 13;
              weight: 'bold';
            };
          };
        };
        fib786: {
          type: 'line';
          yMin: number;
          yMax: number;
          borderColor: string;
          borderWidth: number;
          borderDash: number[];
          label: {
            enabled: boolean;
            content: string;
            position: 'start';
            backgroundColor: string;
            color: 'white';
            padding: 8;
            font: {
              size: 13;
              weight: 'bold';
            };
          };
        };
        fib1000: {
          type: 'line';
          yMin: number;
          yMax: number;
          borderColor: string;
          borderWidth: number;
          borderDash: number[];
          label: {
            enabled: boolean;
            content: string;
            position: 'start';
            backgroundColor: string;
            color: 'white';
            padding: 8;
            font: {
              size: 13;
              weight: 'bold';
            };
          };
        };
        fib1236: {
          type: 'line';
          yMin: number;
          yMax: number;
          borderColor: string;
          borderWidth: number;
          borderDash: number[];
          label: {
            enabled: boolean;
            content: string;
            position: 'start';
            backgroundColor: string;
            color: 'white';
            padding: 8;
            font: { size: number; weight: 'bold'; };
          };
        };
        fib1500: {
          type: 'line';
          yMin: number;
          yMax: number;
          borderColor: string;
          borderWidth: number;
          borderDash: number[];
          label: {
            enabled: boolean;
            content: string;
            position: 'start';
            backgroundColor: string;
            color: 'white';
            padding: 8;
            font: { size: number; weight: 'bold'; };
          };
        };
        fib1128: {
          type: 'line';
          yMin: number;
          yMax: number;
          borderColor: string;
          borderWidth: number;
          borderDash: number[];
          label: {
            enabled: boolean;
            content: string;
            position: 'start';
            backgroundColor: string;
            color: 'white';
            padding: 8;
            font: { size: number; weight: 'bold'; };
          };
        };
        fib1382: {
          type: 'line';
          yMin: number;
          yMax: number;
          borderColor: string;
          borderWidth: number;
          borderDash: number[];
          label: {
            enabled: boolean;
            content: string;
            position: 'start';
            backgroundColor: string;
            color: 'white';
            padding: 8;
            font: { size: number; weight: 'bold'; };
          };
        };
      };
    };
  };
}

export default function Home() {
  const [price, setPrice] = useState<string>('0');
  const [chartData, setChartData] = useState<LineChartData>({ labels: [], datasets: [] });
  const [rsiData, setRsiData] = useState<LineChartData>({ labels: [], datasets: [] });
  const [volumeData, setVolumeData] = useState<BarChartData>({ labels: [], datasets: [] });
  const [tradingAdvice, setTradingAdvice] = useState<TradingAdvice | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isGptResponse, setIsGptResponse] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: '비트코인 가격 추이',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      legend: {
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      },
      annotation: {
        annotations: {
          fib0: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: 'rgba(255, 215, 0, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              enabled: true,
              content: '피보나치 0% - $0.00',
              position: 'start',
              backgroundColor: 'rgba(255, 215, 0, 0.9)',
              color: 'white',
              padding: 8,
              font: { size: 13, weight: 'bold' }
            }
          },
          fib236: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: 'rgba(255, 182, 193, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              enabled: true,
              content: '피보나치 23.6% - $0.00',
              position: 'start',
              backgroundColor: 'rgba(255, 182, 193, 0.9)',
              color: 'white',
              padding: 8,
              font: { size: 13, weight: 'bold' }
            }
          },
          fib382: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: 'rgba(144, 238, 144, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              enabled: true,
              content: '피보나치 38.2% - $0.00',
              position: 'start',
              backgroundColor: 'rgba(144, 238, 144, 0.9)',
              color: 'white',
              padding: 8,
              font: { size: 13, weight: 'bold' }
            }
          },
          fib500: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: 'rgba(135, 206, 235, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              enabled: true,
              content: '피보나치 50% - $0.00',
              position: 'start',
              backgroundColor: 'rgba(135, 206, 235, 0.9)',
              color: 'white',
              padding: 8,
              font: { size: 13, weight: 'bold' }
            }
          },
          fib618: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: 'rgba(221, 160, 221, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              enabled: true,
              content: '피보나치 61.8% - $0.00',
              position: 'start',
              backgroundColor: 'rgba(221, 160, 221, 0.9)',
              color: 'white',
              padding: 8,
              font: { size: 13, weight: 'bold' }
            }
          },
          fib786: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: 'rgba(255, 165, 0, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              enabled: true,
              content: '피보나치 78.6% - $0.00',
              position: 'start',
              backgroundColor: 'rgba(255, 165, 0, 0.9)',
              color: 'white',
              padding: 8,
              font: { size: 13, weight: 'bold' }
            }
          },
          fib1000: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: 'rgba(255, 99, 71, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              enabled: true,
              content: '피보나치 100% - $0.00',
              position: 'start',
              backgroundColor: 'rgba(255, 99, 71, 0.9)',
              color: 'white',
              padding: 8,
              font: { size: 13, weight: 'bold' }
            }
          },
          fib1236: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: 'rgba(128, 0, 128, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              enabled: true,
              content: '피보나치 123.6% - $0.00',
              position: 'start',
              backgroundColor: 'rgba(128, 0, 128, 0.9)',
              color: 'white',
              padding: 8,
              font: { size: 13, weight: 'bold' }
            }
          },
          fib1500: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: 'rgba(128, 0, 0, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              enabled: true,
              content: '피보나치 150% - $0.00',
              position: 'start',
              backgroundColor: 'rgba(128, 0, 0, 0.9)',
              color: 'white',
              padding: 8,
              font: { size: 13, weight: 'bold' }
            }
          },
          fib1128: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: 'rgba(147, 112, 219, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              enabled: true,
              content: '피보나치 112.8% - $0.00',
              position: 'start',
              backgroundColor: 'rgba(147, 112, 219, 0.9)',
              color: 'white',
              padding: 8,
              font: { size: 13, weight: 'bold' }
            }
          },
          fib1382: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: 'rgba(139, 0, 139, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              enabled: true,
              content: '피보나치 138.2% - $0.00',
              position: 'start',
              backgroundColor: 'rgba(139, 0, 139, 0.9)',
              color: 'white',
              padding: 8,
              font: { size: 13, weight: 'bold' }
            }
          }
        }
      }
    }
  });
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elliottData, setElliottData] = useState<LineChartData>({ labels: [], datasets: [] });
  const [volumeProfileData, setVolumeProfileData] = useState<any>(null);
  const [momentumData, setMomentumData] = useState<any>(null);
  const [patternData, setPatternData] = useState<any[]>([]);
  const [trendDirection, setTrendDirection] = useState<'상승' | '하락'>('상승');

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
    const fetchData = async () => {
      try {
        const response = await axios.get('https://api.binance.com/api/v3/klines', {
          params: {
            symbol: 'BTCUSDT',
            interval: '30m',
            limit: 100
          }
        });

        const klineData: BinanceKlineData[] = response.data;
        const times = klineData.map(k => new Date(k[0]).toLocaleTimeString());
        const prices = klineData.map(k => parseFloat(k[4]));
        const volumes = klineData.map(k => parseFloat(k[5]));

        // RSI 계산
        const rsiValues = calculateRSI(prices);
        
        // RSI 데이터 디버깅
        console.log('RSI 데이터 확인:', {
          rsiLength: rsiValues.length,
          pricesLength: prices.length,
          lastRSI: rsiValues[rsiValues.length - 1],
          times: times.length,
          lastTime: times[times.length - 1]
        });

        // 저항선과 지지선 계산
        const { support, resistance } = calculateSupportResistance(prices);

        // 차트 데이터 업데이트
        setChartData({
          labels: times,
          datasets: [{
            label: 'BTC/USDT',
            data: prices,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        });

        // 피보나치 레벨 계산
        const fibLevels = calculateFibonacciLevels(prices) || {
          level0: 0,
          level236: 0,
          level382: 0,
          level500: 0,
          level618: 0,
          level786: 0,
          level1000: 0,
          level1128: 0,
          level1236: 0,
          level1382: 0,
          level1500: 0
        };

        // 차트 옵션 업데이트
        setChartOptions(prevOptions => ({
          ...prevOptions,
          plugins: {
            ...prevOptions.plugins,
            annotation: {
              annotations: {
                fib0: {
                  type: 'line',
                  yMin: fibLevels.level0,
                  yMax: fibLevels.level0,
                  borderColor: 'rgba(255, 215, 0, 0.8)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    enabled: true,
                    content: `피보나치 0% - $${fibLevels.level0.toFixed(2)}`,
                    position: 'start',
                    backgroundColor: 'rgba(255, 215, 0, 0.9)',
                    color: 'white',
                    padding: 8,
                    font: { size: 13, weight: 'bold' },
                    display: true
                  }
                },
                fib236: {
                  type: 'line',
                  yMin: fibLevels.level236,
                  yMax: fibLevels.level236,
                  borderColor: 'rgba(255, 182, 193, 0.8)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    enabled: true,
                    content: `피보나치 23.6% - $${fibLevels.level236.toFixed(2)}`,
                    position: 'start',
                    backgroundColor: 'rgba(255, 182, 193, 0.9)',
                    color: 'white',
                    padding: 8,
                    font: { size: 13, weight: 'bold' },
                    display: true
                  }
                },
                fib382: {
                  type: 'line',
                  yMin: fibLevels.level382,
                  yMax: fibLevels.level382,
                  borderColor: 'rgba(144, 238, 144, 0.8)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    enabled: true,
                    content: `피보나치 38.2% - $${fibLevels.level382.toFixed(2)}`,
                    position: 'start',
                    backgroundColor: 'rgba(144, 238, 144, 0.9)',
                    color: 'white',
                    padding: 8,
                    font: { size: 13, weight: 'bold' },
                    display: true
                  }
                },
                fib500: {
                  type: 'line',
                  yMin: fibLevels.level500,
                  yMax: fibLevels.level500,
                  borderColor: 'rgba(135, 206, 235, 0.8)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    enabled: true,
                    content: `피보나치 50% - $${fibLevels.level500.toFixed(2)}`,
                    position: 'start',
                    backgroundColor: 'rgba(135, 206, 235, 0.9)',
                    color: 'white',
                    padding: 8,
                    font: { size: 13, weight: 'bold' },
                    display: true
                  }
                },
                fib618: {
                  type: 'line',
                  yMin: fibLevels.level618,
                  yMax: fibLevels.level618,
                  borderColor: 'rgba(221, 160, 221, 0.8)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    enabled: true,
                    content: `피보나치 61.8% - $${fibLevels.level618.toFixed(2)}`,
                    position: 'start',
                    backgroundColor: 'rgba(221, 160, 221, 0.9)',
                    color: 'white',
                    padding: 8,
                    font: { size: 13, weight: 'bold' },
                    display: true
                  }
                },
                fib786: {
                  type: 'line',
                  yMin: fibLevels.level786,
                  yMax: fibLevels.level786,
                  borderColor: 'rgba(255, 165, 0, 0.8)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    enabled: true,
                    content: `피보나치 78.6% - $${fibLevels.level786.toFixed(2)}`,
                    position: 'start',
                    backgroundColor: 'rgba(255, 165, 0, 0.9)',
                    color: 'white',
                    padding: 8,
                    font: { size: 13, weight: 'bold' },
                    display: true
                  }
                },
                fib1000: {
                  type: 'line',
                  yMin: fibLevels.level1000,
                  yMax: fibLevels.level1000,
                  borderColor: 'rgba(255, 99, 71, 0.8)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    enabled: true,
                    content: `피보나치 100% - $${fibLevels.level1000.toFixed(2)}`,
                    position: 'start',
                    backgroundColor: 'rgba(255, 99, 71, 0.9)',
                    color: 'white',
                    padding: 8,
                    font: { size: 13, weight: 'bold' },
                    display: true
                  }
                },
                fib1236: {
                  type: 'line',
                  yMin: fibLevels.level1236,
                  yMax: fibLevels.level1236,
                  borderColor: 'rgba(128, 0, 128, 0.8)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    enabled: true,
                    content: `피보나치 123.6% - $${fibLevels.level1236.toFixed(2)}`,
                    position: 'start',
                    backgroundColor: 'rgba(128, 0, 128, 0.9)',
                    color: 'white',
                    padding: 8,
                    font: { size: 13, weight: 'bold' },
                    display: true
                  }
                },
                fib1500: {
                  type: 'line',
                  yMin: fibLevels.level1500,
                  yMax: fibLevels.level1500,
                  borderColor: 'rgba(128, 0, 0, 0.8)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    enabled: true,
                    content: `피보나치 150% - $${fibLevels.level1500.toFixed(2)}`,
                    position: 'start',
                    backgroundColor: 'rgba(128, 0, 0, 0.9)',
                    color: 'white',
                    padding: 8,
                    font: { size: 13, weight: 'bold' },
                    display: true
                  }
                },
                fib1128: {
                  type: 'line',
                  yMin: fibLevels.level1128,
                  yMax: fibLevels.level1128,
                  borderColor: 'rgba(147, 112, 219, 0.8)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    enabled: true,
                    content: `피보나치 112.8% - $${fibLevels.level1128.toFixed(2)}`,
                    position: 'start',
                    backgroundColor: 'rgba(147, 112, 219, 0.9)',
                    color: 'white',
                    padding: 8,
                    font: { size: 13, weight: 'bold' },
                    display: true
                  }
                },
                fib1382: {
                  type: 'line',
                  yMin: fibLevels.level1382,
                  yMax: fibLevels.level1382,
                  borderColor: 'rgba(139, 0, 139, 0.8)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    enabled: true,
                    content: `피보나치 138.2% - $${fibLevels.level1382.toFixed(2)}`,
                    position: 'start',
                    backgroundColor: 'rgba(139, 0, 139, 0.9)',
                    color: 'white',
                    padding: 8,
                    font: { size: 13, weight: 'bold' },
                    display: true
                  }
                }
              }
            }
          }
        }));

        setRsiData({
          labels: times,
          datasets: [{
            label: 'RSI',
            data: rsiValues,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          }]
        });

        // 거래량 차트 데이터
        setVolumeData({
          labels: times,
          datasets: [
            {
              label: 'Volume',
              data: volumes,
              backgroundColor: 'rgb(53, 162, 235, 0.5)',
              type: 'bar'
            }
          ]
        });

        // 엘리엇 파동 데이터 설정
        const elliottResult = calculateElliottWaves(prices);
        if (elliottResult) {
          setElliottData(elliottResult);
          setTrendDirection(elliottResult.currentWave ? '상승' : '하락');
        }

        // 볼륨 프로파일 데이터
        const vpData = calculateVolumeProfile(prices, volumes);
        setVolumeProfileData({
          labels: vpData.pricePoints.map(p => p.toFixed(2)),
          datasets: [{
            label: '거래량 분포',
            data: vpData.profile,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            type: 'bar'
          }]
        });

        // 모멘텀 데이터
        const momentum = calculateMomentumIndicators(prices);
        setMomentumData({
          labels: times,
          datasets: [
            {
              label: '변화율',
              data: momentum.roc,
              borderColor: 'rgb(255, 99, 132)',
              tension: 0.1
            }
          ]
        });

        // 패턴 데이터
        const patterns = analyzePricePatterns(prices);
        setPatternData(patterns);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  // 시간 업데이트를 위한 useEffect
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
  }, []);

  // lastRequestTime이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (lastRequestTime) {
      localStorage.setItem('lastRequestTime', lastRequestTime.toString());
    }
  }, [lastRequestTime]);

  // tradingAdvice가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (tradingAdvice) {
      localStorage.setItem('tradingAdvice', JSON.stringify(tradingAdvice));
    }
  }, [tradingAdvice]);

  // GPT 요청 함수를 새로운 분석 함수로 교체
  const analyzeMarket = () => {
    setIsLoading(true);
    
    // 3~6초 사이의 랜덤한 시간 생성
    const randomDelay = Math.floor(Math.random() * (6000 - 3000 + 1) + 3000);
    
    setTimeout(() => {
      try {
        const analysis = analyzeTradingStrategy(
          parseFloat(price),
          rsiData.datasets[0].data,
          calculateMACD(chartData.datasets[0].data),
          calculateBollingerBands(chartData.datasets[0].data),
          patternData,
          volumeData.datasets[0].data
        );

        setTradingAdvice({
          buyTarget: analysis.buyTarget,
          stopLoss: analysis.stopLoss,
          takeProfit: analysis.takeProfit,
          analysis: analysis.analysis
        });

        setIsGptResponse(true);
      } catch (error) {
        console.error('Analysis error:', error);
        setError('분석 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }, randomDelay);
  };

  // 버튼 부분에 남은 시간 표시 추가
  const getRemainingTime = () => {
    if (!lastRequestTime) return null;
    
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    const timePassed = now - lastRequestTime;
    
    if (timePassed >= thirtyMinutes) return null;
    
    return Math.ceil((thirtyMinutes - timePassed) / 60000);
  };

  // 버튼 텍스트 동적 생성
  const getButtonText = () => {
    if (isLoading) return '분석 중...';
    
    const remainingTime = getRemainingTime();
    if (remainingTime) return `다음 분석까지 ${remainingTime}분 남음`;
    
    return '새로운 분석 받기';
  };

  // 버튼 비활성화 상태 확인
  const isButtonDisabled = () => {
    if (isLoading) return true;
    const remainingTime = getRemainingTime();
    return remainingTime !== null;
  };

  // localStorage 초기화를 위한 useEffect 추가
  useEffect(() => {
    // 클라이언트 사이드에서만 localStorage 접근
    const savedAdvice = localStorage.getItem('tradingAdvice');
    const savedTime = localStorage.getItem('lastRequestTime');

    if (savedAdvice) {
      setTradingAdvice(JSON.parse(savedAdvice));
      setIsGptResponse(true);
    }

    if (savedTime) {
      setLastRequestTime(parseInt(savedTime));
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 엘리엇 파동 데이터 업데이트 부분
  useEffect(() => {
    if (chartData.datasets[0]?.data) {
      const elliottResult = calculateElliottWaves(chartData.datasets[0].data);
      if (elliottResult) {
        setElliottData(elliottResult);
        setTrendDirection(elliottResult.currentWave ? '상승' : '하락');
      }
    }
  }, [chartData]);

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
              <h2 className="text-3xl font-bold text-gray-800 mb-2">AI 분석 요청하기</h2>
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
              onClick={analyzeMarket}
              disabled={isButtonDisabled()}
              className={`px-6 py-3 rounded-lg font-semibold transition-all transform
                ${isButtonDisabled()
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
              ) : getButtonText()}
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          <div className="mb-4 text-sm text-gray-500">
            마지막 업데이트: {currentTime}
          </div>
          
          {tradingAdvice && !error && (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-8 shadow-inner">
              {/* 가격 정보 카드 그리드 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <h3 className="text-sm font-semibold text-blue-500">매수 목표가</h3>
                    <p className="text-xl sm:text-2xl font-bold text-blue-700">
                      {typeof tradingAdvice.buyTarget === 'string' ? tradingAdvice.buyTarget : JSON.stringify(tradingAdvice.buyTarget)}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                    <h3 className="text-sm font-semibold text-red-500">손절가</h3>
                    <p className="text-xl sm:text-2xl font-bold text-red-700">
                      {typeof tradingAdvice.stopLoss === 'string' ? tradingAdvice.stopLoss : JSON.stringify(tradingAdvice.stopLoss)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <h3 className="text-sm font-semibold text-green-500">익절가</h3>
                    <p className="text-xl sm:text-2xl font-bold text-green-700">
                      {typeof tradingAdvice.takeProfit === 'string' ? tradingAdvice.takeProfit : JSON.stringify(tradingAdvice.takeProfit)}
                    </p>
                  </div>
                </div>

                {/* 분석 섹션 */}
                <div className="space-y-3">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">시장 분석</h3>
                  
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-700">시장 트렌드</h4>
                      <p className="text-sm sm:text-base text-gray-600">
                        {typeof tradingAdvice.analysis.trend === 'string' ? tradingAdvice.analysis.trend : JSON.stringify(tradingAdvice.analysis.trend)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-700">기술적 지표</h4>
                      <p className="text-sm sm:text-base text-gray-600">
                        {typeof tradingAdvice.analysis.technical === 'string' ? tradingAdvice.analysis.technical : JSON.stringify(tradingAdvice.analysis.technical)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-700">거래량 분석</h4>
                      <p className="text-sm sm:text-base text-gray-600">
                        {typeof tradingAdvice.analysis.volume === 'string' ? tradingAdvice.analysis.volume : JSON.stringify(tradingAdvice.analysis.volume)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-blue-500">
                      <h4 className="text-base font-semibold text-gray-700">종합 결론</h4>
                      <p className="text-sm sm:text-base text-gray-600">
                        {typeof tradingAdvice.analysis.conclusion === 'string' ? tradingAdvice.analysis.conclusion : JSON.stringify(tradingAdvice.analysis.conclusion)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        
          {/* 패턴 분석 - RSI와 거래량 차트 위로 이동 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              실시간 가격 패턴 분석
            </h3>
            <div className="overflow-y-auto max-h-60">
              {patternData.slice(0, 5).map((pattern, index) => (
                <div key={index} className={`bg-white shadow-md rounded-lg p-4 mb-2 ${
                  pattern.subType.includes('상승') ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
                }`}>
                  <h4 className="font-semibold">{pattern.type}</h4>
                  <p className="text-sm text-gray-600">{pattern.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-medium text-gray-600">현재 가격:</span>
                    <span className={`ml-2 text-sm font-bold ${pattern.subType.includes('상승') ? 'text-green-600' : 'text-red-600'}`}>
                      ${pattern.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{pattern.time}</span>
                  </div>
                </div>
              ))}
              {patternData.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-gray-500 font-medium">현재 감지된 패턴이 없습니다</p>
                  <p className="text-sm text-gray-400">새로운 패턴이 감지되면 여기에 표시됩니다</p>
                </div>
              )}
            </div>
          </div>

        {/* 이미지 링크 섹션을 여기로 이동 */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 mb-4">
          <div className="flex flex-col items-center gap-8">
            <a 
              href="https://www.binance.com/activity/referral-entry/CPA?ref=CPA_009IVN1IXF" 
              target="_blank" 
              rel="noopener noreferrer"
              className="cursor-pointer transition-transform hover:scale-105"
            >
              <Image
                src="/19.png"
                alt="Trading Image 1"
                width={800}
                height={600}
                className="rounded-lg shadow-lg"
              />
            </a>
            <a 
              href="https://partner.bitget.com/bg/GVQXD3" 
              target="_blank" 
              rel="noopener noreferrer"
              className="cursor-pointer transition-transform hover:scale-105"
            >
              <Image
                src="/20.png"
                alt="Trading Image 2"
                width={800}
                height={600}
                className="rounded-lg shadow-lg"
              />
            </a>
          </div>
        </div>

        {/* 메인 차트 영역 */}
        <div className="grid grid-cols-1 gap-6">
          {/* 가격 차트 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* 현재 가격 표시 수정 */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                Current Price: <span className="font-semibold">${Number(price).toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-500">
                {currentTime}
              </div>
            </div>
            
            <div className="w-full h-[700px]">
              {chartData.datasets.length > 0 && (
                <Line
                  data={chartData}
                  options={chartOptions}
                />
              )}
            </div>
            {/* 피보나치 레벨 범례 */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: 'rgba(255, 215, 0, 0.8)' }} />
                <span>피보나치 0% - ${chartOptions.plugins.annotation.annotations.fib0.yMin.toFixed(2)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: 'rgba(255, 182, 193, 0.8)' }} />
                <span>피보나치 23.6% - ${chartOptions.plugins.annotation.annotations.fib236.yMin.toFixed(2)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: 'rgba(144, 238, 144, 0.8)' }} />
                <span>피보나치 38.2% - ${chartOptions.plugins.annotation.annotations.fib382.yMin.toFixed(2)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: 'rgba(135, 206, 235, 0.8)' }} />
                <span>피보나치 50% - ${chartOptions.plugins.annotation.annotations.fib500.yMin.toFixed(2)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: 'rgba(221, 160, 221, 0.8)' }} />
                <span>피보나치 61.8% - ${chartOptions.plugins.annotation.annotations.fib618.yMin.toFixed(2)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: 'rgba(255, 165, 0, 0.8)' }} />
                <span>피보나치 78.6% - ${chartOptions.plugins.annotation.annotations.fib786.yMin.toFixed(2)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: 'rgba(255, 99, 71, 0.8)' }} />
                <span>피보나치 100% - ${chartOptions.plugins.annotation.annotations.fib1000.yMin.toFixed(2)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: 'rgba(147, 112, 219, 0.8)' }} />
                <span>피보나치 112.8% - ${chartOptions.plugins.annotation.annotations.fib1128.yMin.toFixed(2)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: 'rgba(128, 0, 128, 0.8)' }} />
                <span>피보나치 123.6% - ${chartOptions.plugins.annotation.annotations.fib1236.yMin.toFixed(2)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: 'rgba(139, 0, 139, 0.8)' }} />
                <span>피보나치 138.2% - ${chartOptions.plugins.annotation.annotations.fib1382.yMin.toFixed(2)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: 'rgba(128, 0, 0, 0.8)' }} />
                <span>피보나치 150% - ${chartOptions.plugins.annotation.annotations.fib1500.yMin.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 엘리엇 파동 차트 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">엘리엇 파동 분석</div>
              <div className="text-sm text-gray-500">{currentTime}</div>
            </div>
            
            <div className="w-full h-[400px]">
              {elliottData && elliottData.datasets.length > 0 && (
                <Line
                  data={{
                    labels: elliottData.labels,
                    datasets: [
                      {
                        ...elliottData.datasets[0],
                        borderColor: 'rgba(156, 163, 175, 0.5)',
                        borderWidth: 1
                      },
                      {
                        ...elliottData.datasets[1],
                        borderColor: (context) => {
                          const index = context.dataIndex;
                          const waveNumber = elliottData.waveLabels?.[index] || 0;
                          switch(waveNumber) {
                            case 1: return 'rgba(52, 211, 153, 0.8)';
                            case 2: return 'rgba(239, 68, 68, 0.8)';
                            case 3: return 'rgba(16, 185, 129, 0.8)';
                            case 4: return 'rgba(220, 38, 38, 0.8)';
                            case 5: return 'rgba(5, 150, 105, 0.8)';
                            default: return 'rgba(156, 163, 175, 0.5)';
                          }
                        },
                        borderWidth: 3,
                        pointRadius: (context) => {
                          const index = context.dataIndex;
                          return elliottData.waveLabels?.[index] ? 6 : 0;
                        },
                        pointBackgroundColor: (context) => {
                          const index = context.dataIndex;
                          const waveNumber = elliottData.waveLabels?.[index] || 0;
                          switch(waveNumber) {
                            case 1: return 'rgba(52, 211, 153, 1)';
                            case 2: return 'rgba(239, 68, 68, 1)';
                            case 3: return 'rgba(16, 185, 129, 1)';
                            case 4: return 'rgba(220, 38, 38, 1)';
                            case 5: return 'rgba(5, 150, 105, 1)';
                            default: return 'rgba(156, 163, 175, 1)';
                          }
                        }
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      title: {
                        display: true,
                        text: '엘리엇 파동 패턴',
                        font: {
                          size: 16,
                          weight: 'bold'
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            const waveNumber = context.dataset.label === '파동' ? 
                              elliottData?.waveLabels?.[context.dataIndex] : null;
                            if (waveNumber) {
                              const descriptions: { [key: number]: string } = {
                                1: '1파: 초기 상승 구간 - 매수세력 유입',
                                2: '2파: 첫 조정 구간 - 1파의 조정',
                                3: '3파: 가장 강력한 상승 구간 - 주도세력 매수',
                                4: '4파: 중간 조정 구간 - 3파의 조정',
                                5: '5파: 마지막 상승 구간 - 상승 마무리'
                              };
                              return `${descriptions[waveNumber]} - $${context.parsed.y.toFixed(2)}`;
                            }
                            return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
                          }
                        }
                      }
                    }
                  }}
                />
              )}
            </div>

            {/* 파동 설명 추가 */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">상승 파동 설명</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <span className="w-4 h-4 bg-green-400 rounded-full mr-2"></span>
                    1파: 초기 매수세력 진입
                  </li>
                  <li className="flex items-center">
                    <span className="w-4 h-4 bg-green-600 rounded-full mr-2"></span>
                    3파: 가장 강한 상승구간
                  </li>
                  <li className="flex items-center">
                    <span className="w-4 h-4 bg-green-800 rounded-full mr-2"></span>
                    5파: 상승 마무리 구간
                  </li>
                </ul>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-700 mb-2">조정 파동 설명</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <span className="w-4 h-4 bg-red-400 rounded-full mr-2"></span>
                    2파: 첫 번째 조정구간
                  </li>
                  <li className="flex items-center">
                    <span className="w-4 h-4 bg-red-600 rounded-full mr-2"></span>
                    4파: 두 번째 조정구간
                  </li>
                </ul>
              </div>
            </div>

            {/* 현재 파동 상태 */}
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">
                {trendDirection === '상승' ? '추세 상승 지속' : '추세 하락 지속'}
              </h4>
              <p className="text-sm text-gray-600">
                {elliottData.currentWave ? 
                  `현재 ${elliottData.currentWave}파가 진행 중입니다. ${
                    elliottData.currentWave % 2 === 0 ? 
                    '조정 구간으로 추가 하락이 있을 수 있습니다.' : 
                    '상승 구간으로 추가 상승이 예상됩니다.'
                  }` : 
                  '파동 패턴을 분석할 수 없습니다.'
                }
              </p>
            </div>
          </div>

          {/* 볼륨 프로파일 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">거래량 분포</h3>
              <div className="text-sm text-gray-500">{currentTime}</div>
            </div>
            <div className="h-[300px]">
              {volumeProfileData && <Bar data={volumeProfileData} options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  }
                }
              }} />}
            </div>
          </div>

          {/* 모멘텀 지표 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">모멘텀 지표</h3>
              <div className="text-sm text-gray-500">{currentTime}</div>
            </div>
            <div className="h-[300px]">
              {momentumData && <Line data={momentumData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  }
                }
              }} />}
            </div>
          </div>

          {/* RSI 차트 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-semibold">RSI 분석</div>
              <div className="text-sm text-gray-500">{currentTime}</div>
            </div>
            <div className="h-[250px]">
              {rsiData.datasets.length > 0 && (
                <Line
                  data={rsiData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      title: {
                        display: true,
                        text: '상대강도지수',
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
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* 거래량 차트 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-semibold">거래량</div>
              <div className="text-sm text-gray-500">{currentTime}</div>
            </div>
            <div className="h-[250px]">
              {volumeData.datasets.length > 0 && (
                <Bar
                  data={volumeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      title: {
                        display: true,
                        text: '거래량 추이',
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

        {/* Kakao 광고 (하단) */}
        <div className="flex justify-center mt-8">
          <ins 
            className="kakao_ad_area" 
            style={{ display: "block" }}
            data-ad-unit="DAN-6jUyeCB09Hw8CGmH"
            data-ad-width="300"
            data-ad-height="250"
          />
        </div>
      </div>
    </main>
  );
}

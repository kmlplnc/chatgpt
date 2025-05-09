import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  TooltipProps,
  ReferenceLine,
  Cell,
} from "recharts";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface MeasurementChartProps {
  measurements: any[];
  title?: string;
  metricKey?: string;
}

type MetricOption = {
  id: string;
  label: string;
  color: string;
  unit: string;
  idealMin?: number;
  idealMax?: number;
};

// Metrik seçenekleri ve ideal değerleri
const metricOptions: MetricOption[] = [
  { id: "weight", label: "Kilo", color: "#4f46e5", unit: "kg" },
  { id: "bmi", label: "BMI", color: "#10b981", unit: "", idealMin: 18.5, idealMax: 24.9 },
  { id: "bodyFatPercentage", label: "Vücut Yağ Oranı", color: "#f59e0b", unit: "%", idealMin: 10, idealMax: 25 },
  { id: "waistCircumference", label: "Bel Çevresi", color: "#ef4444", unit: "cm", idealMax: 94 },
  { id: "hipCircumference", label: "Kalça Çevresi", color: "#8b5cf6", unit: "cm" },
  { id: "chestCircumference", label: "Göğüs Çevresi", color: "#0ea5e9", unit: "cm" },
  { id: "armCircumference", label: "Kol Çevresi", color: "#14b8a6", unit: "cm" },
  { id: "thighCircumference", label: "Uyluk Çevresi", color: "#f43f5e", unit: "cm" },
  { id: "calfCircumference", label: "Baldır Çevresi", color: "#84cc16", unit: "cm" },
];

// İdeal değerlerin hesaplanması için yardımcı fonksiyon
const calculateIdealValues = (measurements: any[]) => {
  // Ölçüm verilerinden ideal değerleri belirle
  const idealValues: Record<string, { min?: number; max?: number }> = {};
  
  // İlk olarak statik ideal değerleri ata
  metricOptions.forEach(metric => {
    if (metric.idealMin !== undefined || metric.idealMax !== undefined) {
      idealValues[metric.id] = {
        min: metric.idealMin,
        max: metric.idealMax
      };
    }
  });
  
  // Kilo için ideal değeri hesapla (boy bilgisine ve BMI'a göre)
  if (measurements && measurements.length > 0) {
    const lastMeasurement = measurements[0];
    const height = lastMeasurement.height;
    
    if (height && height > 0) {
      // Metre cinsinden boy
      const heightInMeters = height / 100;
      // İdeal BMI aralığı (18.5-24.9)
      const minIdealWeight = Math.round(18.5 * heightInMeters * heightInMeters);
      const maxIdealWeight = Math.round(24.9 * heightInMeters * heightInMeters);
      
      idealValues.weight = {
        min: minIdealWeight,
        max: maxIdealWeight
      };
    }
    
    // Cinsiyet bazlı ideal değerler
    const gender = lastMeasurement.gender || "male";
    
    // Vücut yağ oranı için cinsiyet bazlı ideal değerler
    if (gender === "male") {
      idealValues.bodyFatPercentage = { min: 10, max: 20 };
      idealValues.waistCircumference = { max: 94 };
    } else {
      idealValues.bodyFatPercentage = { min: 18, max: 28 };
      idealValues.waistCircumference = { max: 80 };
    }
    
    // Diğer ölçümler için ortalama değerler kullanılabilir
    // Bu ölçümler daha subjektif ve kişiye özeldir
    const allMeasurements = [...measurements];
    
    // İdeal olmayan ölçümleri hesapla
    ["chestCircumference", "hipCircumference", "armCircumference", "thighCircumference", "calfCircumference"].forEach(metricId => {
      // İdeal değer zaten tanımlanmışsa atla
      if (idealValues[metricId]) return;
      
      // Metrik için tüm değerleri topla
      const values = allMeasurements
        .map(m => m[metricId])
        .filter(val => val !== undefined && val !== null && !isNaN(Number(val)))
        .map(val => Number(val));
      
      if (values.length > 0) {
        // En düşük değer genellikle hedef olarak kabul edilebilir
        // (Vücut kompozisyonu için genel olarak daha düşük çevre ölçüleri hedeflenir)
        const minValue = Math.min(...values);
        const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        // Ortalama değerin %10 altı ideal min, %10 üstü ideal max olarak hesaplanabilir
        idealValues[metricId] = {
          min: Math.round(avgValue * 0.9),
          max: Math.round(avgValue * 1.1)
        };
      }
    });
  }
  
  return idealValues;
};

// Değerin ideal aralıkta olup olmadığını kontrol eden fonksiyon
const getValueStatus = (value: number, metricId: string, idealValues: Record<string, { min?: number; max?: number }>) => {
  const idealRange = idealValues[metricId];
  if (!idealRange) return "normal";
  
  const { min, max } = idealRange;
  
  // BMI, vücut yağı ve çevre ölçümleri için düşük değerler genellikle iyidir
  // Ancak BMI için çok düşük değerler de sağlıksızdır
  if (metricId === "bmi") {
    if (min !== undefined && value < min) return "low";
    if (max !== undefined && value > max) return "high";
    return "ideal";
  }
  
  // Vücut yağ yüzdesi kontrolü
  if (metricId === "bodyFatPercentage") {
    if (min !== undefined && value < min) return "low";
    if (max !== undefined && value > max) return "high";
    return "ideal";
  }
  
  // Çevre ölçümleri için
  if (["waistCircumference", "hipCircumference", "chestCircumference", 
       "armCircumference", "thighCircumference", "calfCircumference"].includes(metricId)) {
    // Sadece üst limit kontrolü yapılır - düşük değerler genellikle hedeflenir
    if (max !== undefined && value > max) return "high";
    return "ideal";
  }
  
  // Kilo için kontrol
  if (metricId === "weight") {
    if (min !== undefined && value < min) return "low";
    if (max !== undefined && value > max) return "high";
    return "ideal";
  }
  
  return "normal";
};

// Değere göre renk seçimi
const getColorByStatus = (status: string) => {
  switch (status) {
    case "ideal":
      return "#22c55e"; // green-500
    case "low":
      return "#3b82f6"; // blue-500
    case "high":
      return "#ef4444"; // red-500
    default:
      return "#6b7280"; // gray-500
  }
};

// Custom tooltip bileşeni
const CustomTooltip = ({ active, payload, label, idealValues }: TooltipProps<number, string> & { idealValues: any }) => {
  // Eğer grafik tooltip'i aktif değilse veya veri yoksa gösterme
  if (!active || !payload || !payload.length || !payload[0] || !payload[0].payload) {
    return null;
  }
  
  // Veri noktasından tarih bilgisini al
  const data = payload[0].payload;
  const dateStr = data.date || data.displayDate || label;
  
  // Metrik değerleri - sadece değeri olan metrikleri göster
  const metricDetails = payload
    .filter((entry: any) => entry.value !== undefined && entry.value !== null && !isNaN(Number(entry.value)))
    .map((entry: any) => {
      const metricOption = metricOptions.find(m => m.id === entry.dataKey);
      const value = Number(entry.value);
      const status = getValueStatus(value, entry.dataKey, idealValues);
      
      return {
        name: metricOption?.label || entry.name,
        value,
        color: getColorByStatus(status),
        unit: metricOption?.unit || "",
        status,
        ideal: idealValues[entry.dataKey] 
          ? `İdeal: ${idealValues[entry.dataKey].min || ''}-${idealValues[entry.dataKey].max || ''}` 
          : undefined
      };
    });
  
  return (
    <div className="bg-background border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-semibold border-b pb-1 mb-2">
        {formatDate(dateStr)}
      </p>
      <div className="space-y-1.5">
        {metricDetails.length > 0 ? (
          metricDetails.map((metric, index) => (
            <div key={index} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: metric.color }}></span>
                  <span className="text-sm">{metric.name}:</span>
                </div>
                <span className="text-sm font-medium ml-2" style={{ color: metric.color }}>
                  {metric.value.toFixed(1)} {metric.unit}
                </span>
              </div>
              {metric.ideal && (
                <div className="text-xs text-muted-foreground pl-5">
                  {metric.ideal}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">Bu tarihte seçili metrikler için veri yok</div>
        )}
      </div>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, label, idealValues }: TooltipProps<number, string> & { idealValues: any }) => {
  if (!active || !payload || !payload.length || !payload[0] || !payload[0].payload) {
    return null;
  }
  
  const data = payload[0].payload;
  const dateStr = data.date || data.displayDate || label;
  const formattedDate = formatDate(dateStr);
  
  const metricDetails = payload
    .filter((entry: any) => entry.value !== undefined && entry.value !== null && !isNaN(Number(entry.value)))
    .map((entry: any) => {
      const metricOption = metricOptions.find(m => m.id === entry.dataKey);
      const value = Number(entry.value);
      const status = getValueStatus(value, entry.dataKey, idealValues);
      
      return {
        name: metricOption?.label || entry.name,
        value,
        color: getColorByStatus(status),
        unit: metricOption?.unit || "",
        dataKey: entry.dataKey,
        status,
        ideal: idealValues[entry.dataKey] 
          ? `İdeal: ${idealValues[entry.dataKey].min || ''}-${idealValues[entry.dataKey].max || ''}` 
          : undefined
      };
    });
  
  // Değişim hesaplama işlevi
  const calculateChange = (dataKey: string, currentValue: number) => {
    try {
      const chartData = data.parent?.props?.data;
      if (!Array.isArray(chartData) || chartData.length < 2) return null;
      
      const currentIndex = chartData.findIndex((d: any) => 
        d.date === dateStr || d.displayDate === formattedDate
      );
      
      if (currentIndex < 0 || currentIndex >= chartData.length - 1) return null;
      
      const previousData = chartData[currentIndex + 1];
      if (!previousData) return null;
      
      const previousValue = previousData[dataKey];
      if (previousValue === undefined || previousValue === null || isNaN(Number(previousValue))) {
        return null;
      }
      
      const prevNumericValue = Number(previousValue);
      const change = currentValue - prevNumericValue;
      const isPositive = change > 0;
      
      // Metriğe göre olumlu/olumsuz değişimleri belirle
      let isDesirable = false;
      
      // Her metriğe göre özel değerlendirme
      if (dataKey === "bmi") {
        // BMI için ideal aralık 18.5-24.9
        const idealRange = idealValues[dataKey];
        if (idealRange) {
          if (currentValue < idealRange.min && isPositive) {
            isDesirable = true; // Düşükten ideale doğru artış
          } else if (currentValue > idealRange.max && !isPositive) {
            isDesirable = true; // Yüksekten ideale doğru azalış
          } else if (currentValue >= idealRange.min && currentValue <= idealRange.max) {
            isDesirable = true; // İdeal aralıkta kalma
          }
        }
      } else if (dataKey === "bodyFatPercentage") {
        // Vücut yağ oranı için ideal değerler
        const idealRange = idealValues[dataKey];
        if (idealRange) {
          if (currentValue < idealRange.min && isPositive) {
            isDesirable = true; // Düşükten ideale doğru artış
          } else if (currentValue > idealRange.max && !isPositive) {
            isDesirable = true; // Yüksekten ideale doğru azalış
          } else if (currentValue >= idealRange.min && currentValue <= idealRange.max) {
            isDesirable = true; // İdeal aralıkta kalma
          }
        }
      } else if (dataKey === "weight") {
        // Kilo için ideal aralık hesaplanabilir (BMI'a göre)
        const idealRange = idealValues[dataKey];
        if (idealRange) {
          if (currentValue < idealRange.min && isPositive) {
            isDesirable = true; // Düşükten ideale doğru artış
          } else if (currentValue > idealRange.max && !isPositive) {
            isDesirable = true; // Yüksekten ideale doğru azalış
          } else if (currentValue >= idealRange.min && currentValue <= idealRange.max) {
            isDesirable = true; // İdeal aralıkta kalma
          }
        }
      } else {
        // Çevre ölçümleri için azalma genelde istenen durumdur
        isDesirable = !isPositive;
      }
      
      return {
        change: Math.abs(change).toFixed(1),
        isPositive,
        isDesirable,
        symbol: isPositive ? "+" : "-"
      };
    } catch (error) {
      console.error("Değişim hesaplama hatası:", error);
      return null;
    }
  };

  return (
    <div className="bg-background border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-semibold border-b pb-1 mb-2">{formattedDate}</p>
      <div className="space-y-2">
        {metricDetails.length > 0 ? (
          metricDetails.map((metric, index) => {
            const change = calculateChange(metric.dataKey, metric.value);
            
            return (
              <div key={index} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: metric.color }}></span>
                    <span className="text-sm font-medium">{metric.name}</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: metric.color }}>
                    {metric.value.toFixed(1)} {metric.unit}
                  </span>
                </div>
                
                {metric.ideal && (
                  <div className="text-xs text-muted-foreground pl-5">
                    {metric.ideal}
                  </div>
                )}
                
                {change && (
                  <div className="flex justify-end">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${change.isDesirable ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                      {change.symbol}{change.change} {metric.unit}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-sm text-muted-foreground">Bu tarihte seçili metrikler için veri yok</div>
        )}
      </div>
    </div>
  );
};

export default function EnhancedMeasurementChart({ measurements, title = "Ölçüm Grafiği", metricKey }: MeasurementChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(metricKey ? [metricKey] : ["weight", "bmi"]);
  const [activeTab, setActiveTab] = useState("line");
  
  // İdeal değerleri hesapla
  const idealValues = calculateIdealValues(measurements);
  
  // metricKey değiştiğinde seçili metrikleri güncelle
  useEffect(() => {
    if (metricKey) {
      setSelectedMetrics([metricKey]);
    }
  }, [metricKey]);
  
  // En yeni tarihten en eskiye doğru sırala
  const sortedMeasurements = [...measurements].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Son 12 ölçümü al ve grafikte kullanmak için ters çevir (en eskiden en yeniye)
  const chartData = [...sortedMeasurements]
    .slice(0, 12)
    .reverse()
    .map((m) => {
      const numericData: any = {};
      
      numericData.date = m.date;
      numericData.displayDate = formatDate(m.date);
      numericData.id = m.id;
      
      metricOptions.forEach(metric => {
        const value = m[metric.id];
        
        if (value !== null && value !== undefined && value !== '') {
          let numValue = 0;
          
          try {
            numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
            
            if (!isNaN(numValue)) {
              numericData[metric.id] = numValue;
            } else {
              numericData[metric.id] = 0;
            }
          } catch (error) {
            numericData[metric.id] = 0;
          }
        } else {
          numericData[metric.id] = 0;
        }
      });
      
      return numericData;
    });
  
  // Metric seçimini değiştir
  const handleMetricChange = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };
  
  // Seçilen metrik listesini kontrol et
  const isMetricSelected = (metric: string) => selectedMetrics.includes(metric);
  
  // Eğer ölçüm yoksa
  if (measurements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Danışanın ölçüm değişimleri</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Henüz ölçüm kaydı bulunmamaktadır.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Bar veri renklendirmesi için yardımcı fonksiyon
  const getBarColor = (value: number, metricId: string) => {
    const status = getValueStatus(value, metricId, idealValues);
    return getColorByStatus(status);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Danışanın ölçüm değişimleri</CardDescription>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 justify-end">
              {metricOptions.map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => handleMetricChange(metric.id)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    isMetricSelected(metric.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="line">Çizgi Grafik</TabsTrigger>
                <TabsTrigger value="bar">Çubuk Grafik</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="h-96">
        {chartData.length > 0 ? (
          <>
            <TabsContent value="line" className="h-full mt-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value?.split(' ')?.[0] || ''}
                    height={50}
                  />
                  <YAxis 
                    width={50}
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip idealValues={idealValues} />} />
                  <Legend verticalAlign="top" height={40} />
                  
                  {/* İdeal çizgileri göster */}
                  {selectedMetrics.map(metricId => {
                    const ideal = idealValues[metricId];
                    if (!ideal) return null;
                    
                    return (
                      <React.Fragment key={`ref-${metricId}`}>
                        {ideal.min !== undefined && (
                          <ReferenceLine 
                            y={ideal.min} 
                            stroke="#22c55e" 
                            strokeDasharray="3 3" 
                            strokeWidth={1.5}
                            label={{ 
                              value: `Min: ${ideal.min}`,
                              fill: '#22c55e',
                              fontSize: 10
                            }}
                          />
                        )}
                        {ideal.max !== undefined && (
                          <ReferenceLine 
                            y={ideal.max} 
                            stroke="#22c55e" 
                            strokeDasharray="3 3" 
                            strokeWidth={1.5}
                            label={{ 
                              value: `Max: ${ideal.max}`,
                              fill: '#22c55e',
                              fontSize: 10
                            }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Metrik çizgileri */}
                  {selectedMetrics.map((metric) => {
                    const metricOption = metricOptions.find((m) => m.id === metric);
                    if (!metricOption) return null;
                    
                    return (
                      <Line
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        name={metricOption.label}
                        stroke={metricOption.color}
                        activeDot={{ r: 6 }}
                        strokeWidth={2}
                        connectNulls={true}
                        isAnimationActive={false}
                        dot={{ fill: "#22c55e", r: 5 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="bar" className="h-full mt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value?.split(' ')?.[0] || ''}
                    height={50}
                  />
                  <YAxis 
                    width={50}
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomBarTooltip idealValues={idealValues} />} />
                  <Legend verticalAlign="top" height={40} />
                  
                  {/* İdeal çizgiler */}
                  {selectedMetrics.map(metricId => {
                    const ideal = idealValues[metricId];
                    if (!ideal) return null;
                    
                    return (
                      <React.Fragment key={`ref-${metricId}`}>
                        {ideal.min !== undefined && (
                          <ReferenceLine 
                            y={ideal.min} 
                            stroke="#22c55e" 
                            strokeDasharray="3 3" 
                            strokeWidth={1.5}
                            label={{ 
                              value: `Min: ${ideal.min}`,
                              fill: '#22c55e',
                              fontSize: 10
                            }}
                          />
                        )}
                        {ideal.max !== undefined && (
                          <ReferenceLine 
                            y={ideal.max} 
                            stroke="#22c55e" 
                            strokeDasharray="3 3" 
                            strokeWidth={1.5}
                            label={{ 
                              value: `Max: ${ideal.max}`,
                              fill: '#22c55e',
                              fontSize: 10
                            }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Metrik çubukları - renklendirme ile */}
                  {selectedMetrics.map((metric) => {
                    const metricOption = metricOptions.find((m) => m.id === metric);
                    if (!metricOption) return null;
                    
                    return (
                      <Bar
                        key={metric}
                        dataKey={metric}
                        name={metricOption.label}
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      >
                        {chartData.map((entry, index) => {
                          const value = entry[metric];
                          if (!value || isNaN(Number(value))) return null;
                          
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getBarColor(Number(value), metric)} 
                            />
                          );
                        })}
                      </Bar>
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-muted-foreground">Grafik verisi oluşturulamadı. Ölçüm verilerini kontrol edin.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
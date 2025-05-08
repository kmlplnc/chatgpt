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
} from "recharts";
import { formatDate } from "@/lib/utils";

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
};

const metricOptions: MetricOption[] = [
  { id: "weight", label: "Kilo", color: "#4f46e5", unit: "kg" },
  { id: "bmi", label: "BMI", color: "#10b981", unit: "" },
  { id: "bodyFatPercentage", label: "Vücut Yağ Oranı", color: "#f59e0b", unit: "%" },
  { id: "waistCircumference", label: "Bel Çevresi", color: "#ef4444", unit: "cm" },
  { id: "hipCircumference", label: "Kalça Çevresi", color: "#8b5cf6", unit: "cm" },
  { id: "chestCircumference", label: "Göğüs Çevresi", color: "#0ea5e9", unit: "cm" },
  { id: "armCircumference", label: "Kol Çevresi", color: "#14b8a6", unit: "cm" },
  { id: "thighCircumference", label: "Uyluk Çevresi", color: "#f43f5e", unit: "cm" },
  { id: "calfCircumference", label: "Baldır Çevresi", color: "#84cc16", unit: "cm" },
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
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
      return {
        name: metricOption?.label || entry.name,
        value: Number(entry.value),
        color: entry.stroke || entry.fill || metricOption?.color || '#666',
        unit: metricOption?.unit || ""
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
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: metric.color }}></span>
                <span className="text-sm">{metric.name}:</span>
              </div>
              <span className="text-sm font-medium ml-2">
                {metric.value.toFixed(1)} {metric.unit}
              </span>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">Bu tarihte seçili metrikler için veri yok</div>
        )}
      </div>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  // Eğer grafik tooltip'i aktif değilse veya veri yoksa gösterme
  if (!active || !payload || !payload.length || !payload[0] || !payload[0].payload) {
    return null;
  }
  
  // Veri noktasından tarih bilgisini al
  const data = payload[0].payload;
  const dateStr = data.date || data.displayDate || label;
  const formattedDate = formatDate(dateStr);
  
  // Metrik değerleri - sadece değeri olan metrikleri göster
  const metricDetails = payload
    .filter((entry: any) => entry.value !== undefined && entry.value !== null && !isNaN(Number(entry.value)))
    .map((entry: any) => {
      const metricOption = metricOptions.find(m => m.id === entry.dataKey);
      return {
        name: metricOption?.label || entry.name,
        value: Number(entry.value),
        color: entry.fill || entry.stroke || metricOption?.color || '#666',
        unit: metricOption?.unit || "",
        dataKey: entry.dataKey
      };
    });
  
  // Bir önceki ölçümden fark hesaplama işlevi basitleştirildi
  const calculateChange = (dataKey: string, currentValue: number) => {
    try {
      // Tüm grafik verilerini al
      const chartData = data.parent?.props?.data;
      if (!Array.isArray(chartData) || chartData.length < 2) return null;
      
      // Şu anki veri noktasının index'ini bul
      const currentIndex = chartData.findIndex((d: any) => 
        d.date === dateStr || d.displayDate === formattedDate
      );
      
      if (currentIndex < 0 || currentIndex >= chartData.length - 1) return null;
      
      // Önceki ölçüm verisi
      const previousData = chartData[currentIndex + 1];
      if (!previousData) return null;
      
      const previousValue = previousData[dataKey];
      if (previousValue === undefined || previousValue === null || isNaN(Number(previousValue))) {
        return null;
      }
      
      // Değişimi hesapla
      const prevNumericValue = Number(previousValue);
      const change = currentValue - prevNumericValue;
      const isPositive = change > 0;
      
      // Metriğe göre olumlu/olumsuz değişimleri belirle
      // Not: Kilo, BMI ve çevre ölçümlerinde azalma genelde olumludur
      // Kas kütlesi gibi ölçümler eklenirse burada özelleştirme gerekebilir
      const isDesirable = !isPositive;
      
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
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: metric.color }}></span>
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                <div className="flex items-center justify-between pl-5">
                  <span className="text-sm">{metric.value.toFixed(1)} {metric.unit}</span>
                  
                  {change && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${change.isDesirable ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                      {change.symbol}{change.change} {metric.unit}
                    </span>
                  )}
                </div>
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

export default function MeasurementChart({ measurements, title = "Ölçüm Grafiği", metricKey }: MeasurementChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(metricKey ? [metricKey] : ["weight", "bmi"]);
  const [activeTab, setActiveTab] = useState("line");
  
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
      // Metrikleri sayısal değere dönüştür
      const numericData: any = {};
      
      // Temel alanları kopyala - grafik için gerekli
      numericData.date = m.date;
      numericData.displayDate = formatDate(m.date);
      numericData.id = m.id;
      
      // Önce grafik verilerini konsolda göster (hata ayıklama için)
      console.log("Orijinal ölçüm verisi:", JSON.stringify(m, null, 2));
      
      // Tüm ölçüm metriklerini dönüştür
      metricOptions.forEach(metric => {
        const value = m[metric.id];
        
        // String, sayı veya null/undefined olabilir, güvenli şekilde dönüştür
        if (value !== null && value !== undefined && value !== '') {
          // String içindeki sayıyı al
          let numValue = 0;
          
          try {
            numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
            
            // Geçerli bir sayı ise ekle
            if (!isNaN(numValue)) {
              numericData[metric.id] = numValue;
            } else {
              console.warn(`Metrik ${metric.id} için NaN değeri (${value})`);
              numericData[metric.id] = 0; // NaN yerine 0 kullan
            }
          } catch (error) {
            console.error(`Metrik dönüşüm hatası (${metric.id})`, error);
            numericData[metric.id] = 0; // Hata durumunda 0 kullan
          }
        } else {
          // Değer yoksa, 0 olarak ekle (undefined değil)
          // Recharts ile çizim sorunlarını önlemek için
          numericData[metric.id] = 0;
        }
      });
      
      // Her kayıt için değer olup olmadığını konsolda görüntüle
      console.log(`Dönüştürülen ölçüm (${formatDate(m.date)}) değerleri: `, 
        metricOptions.map(m => `${m.id}: ${numericData[m.id]}`).join(', '));
      
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
  
  // Tablo verisini konsolda göster
  console.log("Grafik verisi:", chartData);

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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={40} />
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
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend verticalAlign="top" height={40} />
                  {selectedMetrics.map((metric) => {
                    const metricOption = metricOptions.find((m) => m.id === metric);
                    if (!metricOption) return null;
                    
                    return (
                      <Bar
                        key={metric}
                        dataKey={metric}
                        name={metricOption.label}
                        fill={metricOption.color}
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      />
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
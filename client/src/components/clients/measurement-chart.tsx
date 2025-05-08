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
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Metrik değerleri
    const metricDetails = payload.map((entry: any) => {
      const metricOption = metricOptions.find(m => m.id === entry.dataKey);
      return {
        name: metricOption?.label || entry.name,
        value: entry.value,
        color: entry.color,
        unit: metricOption?.unit || ""
      };
    });
    
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold border-b pb-1 mb-2">{formatDate(data.date)}</p>
        <div className="space-y-1.5">
          {metricDetails.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: metric.color }}></span>
                <span className="text-sm">{metric.name}:</span>
              </div>
              <span className="text-sm font-medium ml-2">
                {Number(metric.value).toFixed(1)} {metric.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

const CustomBarTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    // Tarih formatı
    const formattedDate = formatDate(label);
    
    // Metrik değerleri
    const metricDetails = payload.map((entry: any) => {
      const metricOption = metricOptions.find(m => m.id === entry.dataKey);
      return {
        name: metricOption?.label || entry.name,
        value: entry.value,
        color: entry.color,
        unit: metricOption?.unit || "",
        dataKey: entry.dataKey
      };
    });
    
    // Bir önceki ölçümden fark hesaplama
    const calculateChange = (dataKey: string, currentValue: number) => {
      if (!Array.isArray(payload) || payload.length === 0) return null;
      
      // Geçerli ölçüm verisi
      const currentData = payload[0]?.payload;
      if (!currentData) return null;
      
      // Eğer payload'da label (tarih) yoksa işlem yapma
      if (!label) return null;
      
      // Geçerli tarih dizinden index bul (external chartData referansı yerine payload kullan)
      const allData = payload[0]?.payload?.parent?.props?.data || [];
      if (!Array.isArray(allData) || allData.length < 2) return null;
      
      const currentIndex = allData.findIndex((d: any) => d.date === label);
      if (currentIndex <= 0 || currentIndex >= allData.length) return null;
      
      const previousValue = allData[currentIndex - 1][dataKey];
      if (previousValue === undefined || previousValue === null) return null;
      
      const change = currentValue - Number(previousValue);
      const isPositive = change > 0;
      
      // Geleneksel olarak kilo, bel çevresi gibi ölçümlerde azalma olumlu,
      // ancak kas kütlesi gibi ölçümlerde artış olumludur. Şu an hepsinde azalma olumlu kabul ediliyor.
      const isDesirable = !isPositive;
      
      return {
        change: Math.abs(change).toFixed(1),
        isPositive,
        isDesirable,
        symbol: isPositive ? "+" : "-"
      };
    };

    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold border-b pb-1 mb-2">{formattedDate}</p>
        <div className="space-y-2">
          {metricDetails.map((metric, index) => {
            const change = calculateChange(metric.dataKey, metric.value);
            
            return (
              <div key={index} className="space-y-0.5">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: metric.color }}></span>
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                <div className="flex items-center justify-between pl-5">
                  <span className="text-sm">{Number(metric.value).toFixed(1)} {metric.unit}</span>
                  
                  {change && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${change.isDesirable ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                      {change.symbol}{change.change} {metric.unit}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
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
      const numericData: any = { ...m };
      metricOptions.forEach(metric => {
        if (m[metric.id] !== null && m[metric.id] !== undefined) {
          numericData[metric.id] = Number(m[metric.id]);
        }
      });
      
      return {
        ...numericData,
        date: m.date,
        displayDate: formatDate(m.date),
      };
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
                tickFormatter={(value) => value.split(' ')[0]}
                height={50}
                label={{ value: "Tarih", position: "insideBottom", offset: -10 }}
              />
              <YAxis 
                width={50}
                label={{ value: "Değer", angle: -90, position: "insideLeft" }} 
                domain={['auto', 'auto']}
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
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.split('T')[0]}
                height={50}
                label={{ value: "Tarih", position: "insideBottom", offset: -10 }}
              />
              <YAxis 
                width={50}
                label={{ value: "Değer", angle: -90, position: "insideLeft" }} 
                domain={['auto', 'auto']}
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
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </CardContent>
    </Card>
  );
}
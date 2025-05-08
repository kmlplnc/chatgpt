import React, { useState } from "react";
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
    const metric = metricOptions.find(m => m.id === payload[0].dataKey);
    
    return (
      <div className="bg-white p-4 border rounded shadow-md">
        <p className="font-medium">{formatDate(data.date)}</p>
        <p className="text-sm" style={{ color: metric?.color }}>
          {metric?.label}: {payload[0].value} {metric?.unit}
        </p>
      </div>
    );
  }

  return null;
};

const CustomBarTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded shadow-md">
        <p className="font-medium">{formatDate(label)}</p>
        {payload.map((entry, index) => {
          const metric = metricOptions.find(m => m.id === entry.dataKey);
          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {metric?.label}: {entry.value} {metric?.unit}
            </p>
          );
        })}
      </div>
    );
  }

  return null;
};

export default function MeasurementChart({ measurements, title = "Ölçüm Grafiği" }: MeasurementChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["weight", "bmi"]);
  const [activeTab, setActiveTab] = useState("line");
  
  // En yeni tarihten en eskiye doğru sırala
  const sortedMeasurements = [...measurements].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Son 10 ölçümü al ve grafikte kullanmak için ters çevir (en eskiden en yeniye)
  const chartData = [...sortedMeasurements]
    .slice(0, 10)
    .reverse()
    .map((m) => ({
      ...m,
      date: m.date,
      displayDate: formatDate(m.date),
    }));
  
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
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
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
              />
              <YAxis />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend />
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
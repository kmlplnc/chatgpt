import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Measurement } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface MeasurementChartProps {
  measurements: Measurement[];
  title?: string;
}

export default function MeasurementChart({ measurements, title = "Ölçüm Grafiği" }: MeasurementChartProps) {
  const [metricType, setMetricType] = React.useState("weight");
  
  // Sort measurements by date (oldest to newest)
  const sortedMeasurements = [...measurements].sort((a, b) => 
    new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
  );
  
  // Prepare data for chart
  const chartData = sortedMeasurements.map(m => ({
    date: formatDate(m.date!),
    weight: Number(m.weight) || 0,
    bmi: Number(m.bmi) || 0,
    bodyFatPercentage: Number(m.bodyFatPercentage) || 0,
    waistCircumference: Number(m.waistCircumference) || 0,
    hipCircumference: Number(m.hipCircumference) || 0,
    chestCircumference: Number(m.chestCircumference) || 0,
    armCircumference: Number(m.armCircumference) || 0,
    thighCircumference: Number(m.thighCircumference) || 0,
    calfCircumference: Number(m.calfCircumference) || 0,
  }));
  
  // Define metrics options
  const metrics = [
    { value: "weight", label: "Ağırlık (kg)", color: "#8884d8" },
    { value: "bmi", label: "BKİ", color: "#82ca9d" },
    { value: "bodyFatPercentage", label: "Vücut Yağ Oranı (%)", color: "#ffc658" },
    { value: "waistCircumference", label: "Bel Çevresi (cm)", color: "#ff8042" },
    { value: "hipCircumference", label: "Kalça Çevresi (cm)", color: "#a4de6c" },
    { value: "chestCircumference", label: "Göğüs Çevresi (cm)", color: "#d0ed57" },
    { value: "armCircumference", label: "Kol Çevresi (cm)", color: "#83a6ed" },
    { value: "thighCircumference", label: "Uyluk Çevresi (cm)", color: "#8dd1e1" },
    { value: "calfCircumference", label: "Baldır Çevresi (cm)", color: "#f780bf" },
  ];
  
  // Get selected metric info
  const selectedMetric = metrics.find(m => m.value === metricType) || metrics[0];
  
  // Check if we have data
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px]">
            <p className="text-muted-foreground">
              Henüz ölçüm verisi bulunmamaktadır.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Select value={metricType} onValueChange={setMetricType}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Ölçüm türü seçin" />
          </SelectTrigger>
          <SelectContent>
            {metrics.map(metric => (
              <SelectItem key={metric.value} value={metric.value}>
                {metric.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 25,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end"
                tick={{ fontSize: 12 }}
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={metricType}
                name={selectedMetric.label}
                stroke={selectedMetric.color}
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
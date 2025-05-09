import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell
} from "recharts";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SimpleChartProps {
  measurements: any[];
  title?: string;
}

export default function SimpleChart({ measurements, title = "Ölçüm Grafiği" }: SimpleChartProps) {
  const [activeMetric, setActiveMetric] = useState<string>("weight");

  if (!measurements || measurements.length === 0) {
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

  // Ölçümleri tarihsel olarak sırala (en yeniden en eskiye)
  const sortedMeasurements = [...measurements].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Grafikte kullanmak için verileri hazırla
  const chartData = sortedMeasurements.map(m => ({
    date: formatDate(m.date),
    weight: parseFloat(m.weight) || 0,
    bodyFat: parseFloat(m.bodyFatPercentage) || 0,
    waist: parseFloat(m.waistCircumference) || 0,
    bmi: parseFloat(m.bmi) || 0,
    hip: parseFloat(m.hipCircumference) || 0,
    chest: parseFloat(m.chestCircumference) || 0,
    arm: parseFloat(m.armCircumference) || 0,
    thigh: parseFloat(m.thighCircumference) || 0,
    calf: parseFloat(m.calfCircumference) || 0
  }));

  // Ölçümler genellikle tersine çevrilerek gösterilir (eskiden yeniye)
  chartData.reverse();

  // İdeal değerler ve renk belirlemeleri
  const idealValues = {
    weight: { min: 65, max: 80, unit: "kg" },
    bmi: { min: 18.5, max: 24.9, unit: "" },
    bodyFat: { min: 10, max: 20, unit: "%" },
    waist: { max: 94, unit: "cm" },
    hip: { min: 90, max: 110, unit: "cm" },
    chest: { min: 90, max: 110, unit: "cm" },
    arm: { min: 30, max: 40, unit: "cm" },
    thigh: { min: 50, max: 65, unit: "cm" },
    calf: { min: 35, max: 45, unit: "cm" }
  };

  // Metrik başlıkları
  const metricLabels = {
    weight: "Kilo (kg)",
    bmi: "Vücut Kitle İndeksi",
    bodyFat: "Vücut Yağı (%)",
    waist: "Bel Çevresi (cm)",
    hip: "Kalça Çevresi (cm)",
    chest: "Göğüs Çevresi (cm)",
    arm: "Kol Çevresi (cm)",
    thigh: "Uyluk Çevresi (cm)",
    calf: "Baldır Çevresi (cm)"
  };

  // Değerin ideal aralıkta olup olmadığını kontrol et ve buna göre renk ver
  const getBarColor = (value: number, metricKey: string) => {
    const idealValue = idealValues[metricKey as keyof typeof idealValues];
    
    if (!idealValue) return "#8884d8"; // Varsayılan renk
    
    // Sadece maksimum değer belirtilmişse
    if (idealValue.max && !idealValue.min) {
      return value <= idealValue.max ? "#4caf50" : "#ff5252";
    }
    
    // Sadece minimum değer belirtilmişse
    if (idealValue.min && !idealValue.max) {
      return value >= idealValue.min ? "#4caf50" : "#ff5252";
    }
    
    // Hem minimum hem maksimum değer belirtilmişse
    if (idealValue.min && idealValue.max) {
      if (value < idealValue.min) return "#ff9800"; // Düşük - turuncu
      if (value > idealValue.max) return "#ff5252"; // Yüksek - kırmızı
      return "#4caf50"; // İdeal - yeşil
    }
    
    return "#8884d8"; // Varsayılan mor
  };

  // Tooltip içeriğini özelleştirme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const metricKey = activeMetric as keyof typeof idealValues;
      const idealValue = idealValues[metricKey];
      const value = data.value;
      
      let status = "İdeal";
      let statusColor = "#4caf50";
      
      if (idealValue) {
        if (idealValue.min && idealValue.max) {
          if (value < idealValue.min) {
            status = "Düşük";
            statusColor = "#ff9800";
          } else if (value > idealValue.max) {
            status = "Yüksek";
            statusColor = "#ff5252";
          }
        } else if (idealValue.max && !idealValue.min && value > idealValue.max) {
          status = "Yüksek";
          statusColor = "#ff5252";
        } else if (idealValue.min && !idealValue.max && value < idealValue.min) {
          status = "Düşük";
          statusColor = "#ff9800";
        }
      }
      
      return (
        <div className="bg-white p-3 shadow-md rounded border">
          <p className="font-semibold">{label}</p>
          <p>{`${metricLabels[metricKey as keyof typeof metricLabels]}: ${value} ${idealValue?.unit || ''}`}</p>
          {idealValue && (
            <>
              <p style={{ color: statusColor }} className="font-medium mt-1">{status}</p>
              {idealValue.min && idealValue.max && (
                <p className="text-xs text-muted-foreground">İdeal aralık: {idealValue.min} - {idealValue.max} {idealValue.unit}</p>
              )}
              {idealValue.max && !idealValue.min && (
                <p className="text-xs text-muted-foreground">Maksimum ideal değer: {idealValue.max} {idealValue.unit}</p>
              )}
              {idealValue.min && !idealValue.max && (
                <p className="text-xs text-muted-foreground">Minimum ideal değer: {idealValue.min} {idealValue.unit}</p>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Danışanın ölçüm değişimleri</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weight" onValueChange={setActiveMetric} className="w-full">
          <TabsList className="grid grid-cols-3 lg:grid-cols-5 mb-4">
            <TabsTrigger value="weight">Kilo</TabsTrigger>
            <TabsTrigger value="bmi">BMI</TabsTrigger>
            <TabsTrigger value="bodyFat">Vücut Yağı</TabsTrigger>
            <TabsTrigger value="waist">Bel</TabsTrigger>
            <TabsTrigger value="hip">Kalça</TabsTrigger>
            <TabsTrigger value="chest">Göğüs</TabsTrigger>
            <TabsTrigger value="arm">Kol</TabsTrigger>
            <TabsTrigger value="thigh">Uyluk</TabsTrigger>
            <TabsTrigger value="calf">Baldır</TabsTrigger>
          </TabsList>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* İdeal Değer Çizgileri */}
                {activeMetric && idealValues[activeMetric as keyof typeof idealValues]?.min && (
                  <ReferenceLine 
                    y={idealValues[activeMetric as keyof typeof idealValues].min} 
                    stroke="green" 
                    strokeDasharray="3 3" 
                    label={{ value: 'Minimum İdeal', position: 'top', fill: 'green' }} 
                  />
                )}
                
                {activeMetric && idealValues[activeMetric as keyof typeof idealValues]?.max && (
                  <ReferenceLine 
                    y={idealValues[activeMetric as keyof typeof idealValues].max} 
                    stroke="red" 
                    strokeDasharray="3 3" 
                    label={{ value: 'Maksimum İdeal', position: 'top', fill: 'red' }} 
                  />
                )}
                
                {/* Ölçüm Çubukları */}
                <Bar 
                  dataKey={activeMetric} 
                  name={metricLabels[activeMetric as keyof typeof metricLabels]}
                  isAnimationActive={true}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(entry[activeMetric as keyof typeof entry] as number, activeMetric)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
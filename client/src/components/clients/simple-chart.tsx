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
  Cell,
  LabelList
} from "recharts";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface SimpleChartProps {
  measurements: any[];
  title?: string;
}

export default function SimpleChart({ measurements, title = "Ölçüm Grafiği" }: SimpleChartProps) {
  const [activeMetric, setActiveMetric] = useState<string>("weight");

  if (!measurements || measurements.length === 0) {
    return (
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>Danışanın ölçüm değişimleri</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48 p-4">
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
    bmi: "BMI",
    bodyFat: "Vücut Yağı (%)",
    waist: "Bel (cm)",
    hip: "Kalça (cm)",
    chest: "Göğüs (cm)",
    arm: "Kol (cm)",
    thigh: "Uyluk (cm)",
    calf: "Baldır (cm)"
  };

  // Her ölçüm için ideal değer ile gerçek değeri içeren veri oluştur
  const combinedData = chartData.map(entry => {
    const metric = activeMetric as keyof typeof idealValues;
    const idealValue = idealValues[metric];
    
    // İdeal değeri hesapla (min-max ortalaması veya sadece min/max)
    let idealValueData = 0;
    if (idealValue.min && idealValue.max) {
      idealValueData = (idealValue.min + idealValue.max) / 2;
    } else if (idealValue.min) {
      idealValueData = idealValue.min;
    } else if (idealValue.max) {
      idealValueData = idealValue.max;
    }
    
    return {
      ...entry,
      [`ideal_${activeMetric}`]: idealValueData,
    };
  });

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
      const metricKey = activeMetric as keyof typeof idealValues;
      const idealValue = idealValues[metricKey];
      
      // Gerçek değer
      const actualPayload = payload.find((p: any) => p.dataKey === activeMetric);
      if (!actualPayload) return null;
      
      const value = actualPayload.value;
      
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
        <div className="bg-white p-2 shadow-md rounded border text-sm">
          <p className="font-medium">{label}</p>
          <p>{`${metricLabels[metricKey as keyof typeof metricLabels]}: ${value}`}</p>
          {idealValue && (
            <>
              <div className="flex items-center mt-1">
                <Badge style={{ backgroundColor: statusColor }} variant="outline" className="text-white text-xs">
                  {status}
                </Badge>
              </div>
              {idealValue.min && idealValue.max && (
                <p className="text-xs text-gray-500 mt-1">İdeal: {idealValue.min} - {idealValue.max} {idealValue.unit}</p>
              )}
              {idealValue.max && !idealValue.min && (
                <p className="text-xs text-gray-500 mt-1">Maks. ideal: {idealValue.max} {idealValue.unit}</p>
              )}
              {idealValue.min && !idealValue.max && (
                <p className="text-xs text-gray-500 mt-1">Min. ideal: {idealValue.min} {idealValue.unit}</p>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // İdeal değerin etiketini render et
  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text x={x + width / 2} y={y - 8} fill="#333" textAnchor="middle" dominantBaseline="middle" fontSize={12}>
        {value ? value.toFixed(1) : ""}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Danışanın ölçüm değişimleri</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="weight" onValueChange={setActiveMetric} className="w-full">
          <TabsList className="grid grid-cols-3 lg:grid-cols-5 mb-2">
            <TabsTrigger value="weight" className="text-xs py-1">Kilo</TabsTrigger>
            <TabsTrigger value="bmi" className="text-xs py-1">BMI</TabsTrigger>
            <TabsTrigger value="bodyFat" className="text-xs py-1">Yağ %</TabsTrigger>
            <TabsTrigger value="waist" className="text-xs py-1">Bel</TabsTrigger>
            <TabsTrigger value="hip" className="text-xs py-1">Kalça</TabsTrigger>
            <TabsTrigger value="chest" className="text-xs py-1 hidden lg:flex">Göğüs</TabsTrigger>
            <TabsTrigger value="arm" className="text-xs py-1 hidden lg:flex">Kol</TabsTrigger>
            <TabsTrigger value="thigh" className="text-xs py-1 hidden lg:flex">Uyluk</TabsTrigger>
            <TabsTrigger value="calf" className="text-xs py-1 hidden lg:flex">Baldır</TabsTrigger>
          </TabsList>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={combinedData} 
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                barCategoryGap={20}
                barGap={2}
                barSize={14}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} height={30} tickMargin={5} />
                <YAxis tick={{ fontSize: 11 }} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                
                {/* İdeal Değer Çubukları */}
                <Bar 
                  dataKey={`ideal_${activeMetric}`} 
                  name="İdeal Değer" 
                  fill="#a5d6a7" 
                  opacity={0.7}
                  radius={[2, 2, 0, 0]}
                >
                </Bar>
                
                {/* Gerçek Ölçüm Çubukları */}
                <Bar 
                  dataKey={activeMetric} 
                  name="Ölçüm" 
                  radius={[2, 2, 0, 0]}
                >
                  {combinedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(entry[activeMetric as keyof typeof entry] as number, activeMetric)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* İdeal değer göstergesi */}
          <div className="mt-2 text-xs flex flex-wrap gap-1">
            {activeMetric && idealValues[activeMetric as keyof typeof idealValues]?.min && (
              <Badge variant="outline" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                Min: {idealValues[activeMetric as keyof typeof idealValues].min} {idealValues[activeMetric as keyof typeof idealValues].unit}
              </Badge>
            )}
            {activeMetric && idealValues[activeMetric as keyof typeof idealValues]?.max && (
              <Badge variant="outline" className="bg-red-100 text-red-700 hover:bg-red-100">
                Maks: {idealValues[activeMetric as keyof typeof idealValues].max} {idealValues[activeMetric as keyof typeof idealValues].unit}
              </Badge>
            )}
            <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100">
              İdeal aralık
            </Badge>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
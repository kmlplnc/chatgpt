import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from "recharts";
import { formatDate } from "@/lib/utils";

interface SimpleChartProps {
  measurements: any[];
  title?: string;
}

export default function SimpleChart({ measurements, title = "Ölçüm Grafiği" }: SimpleChartProps) {
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
    bmi: parseFloat(m.bmi) || 0
  }));

  // Ölçümler genellikle tersine çevrilerek gösterilir (eskiden yeniye)
  chartData.reverse();

  // İdeal değerler
  const idealWeight = 70; // Örnek ideal kilo değeri
  const idealBMI = 22; // Örnek ideal BMI değeri

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Danışanın ölçüm değişimleri</CardDescription>
      </CardHeader>
      <CardContent className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />

            {/* İdeal Değer Çizgileri */}
            <ReferenceLine y={idealWeight} stroke="green" strokeDasharray="3 3" label={{ value: 'İdeal Kilo', position: 'insideBottomRight', fill: 'green' }} />
            <ReferenceLine y={idealBMI} stroke="blue" strokeDasharray="3 3" label={{ value: 'İdeal BMI', position: 'insideBottomRight', fill: 'blue' }} />

            {/* Ölçüm Çizgileri */}
            <Line type="monotone" dataKey="weight" name="Kilo (kg)" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="bodyFat" name="Vücut Yağı (%)" stroke="#82ca9d" />
            <Line type="monotone" dataKey="waist" name="Bel Çevresi (cm)" stroke="#ffc658" />
            <Line type="monotone" dataKey="bmi" name="BMI" stroke="#ff8042" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
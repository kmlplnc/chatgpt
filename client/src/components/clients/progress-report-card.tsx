import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface ProgressReportCardProps {
  measurements: any[];
}

export default function ProgressReportCard({ measurements }: ProgressReportCardProps) {
  // Ölçüm yoksa veya yeterli değilse gösterme
  if (!measurements || measurements.length < 2) {
    return null;
  }
  
  // İlk ve son ölçümleri al (en yeni ile en eski)
  const lastMeasurement = measurements[0]; // En yeni ölçüm
  const firstMeasurement = measurements[measurements.length - 1]; // En eski ölçüm
  
  // Ölçümler arasındaki toplam gün hesapla
  const daysDiff = Math.round(
    (new Date(lastMeasurement.date).getTime() - new Date(firstMeasurement.date).getTime()) 
    / (1000 * 60 * 60 * 24)
  );
  
  // Değişim hesapla
  const calculateChange = (current: number | null, initial: number | null) => {
    if (current === null || initial === null) return null;
    return Number(current) - Number(initial);
  };
  
  // Değişimleri hesapla
  const changes = {
    weight: calculateChange(lastMeasurement.weight, firstMeasurement.weight),
    bmi: calculateChange(lastMeasurement.bmi, firstMeasurement.bmi),
    waist: calculateChange(lastMeasurement.waistCircumference, firstMeasurement.waistCircumference),
    hip: calculateChange(lastMeasurement.hipCircumference, firstMeasurement.hipCircumference),
    chest: calculateChange(lastMeasurement.chestCircumference, firstMeasurement.chestCircumference),
    arm: calculateChange(lastMeasurement.armCircumference, firstMeasurement.armCircumference),
    thigh: calculateChange(lastMeasurement.thighCircumference, firstMeasurement.thighCircumference),
    calf: calculateChange(lastMeasurement.calfCircumference, firstMeasurement.calfCircumference),
  };
  
  // Metrik format ayarları
  const metrics = [
    { key: 'weight', label: 'Toplam Kilo Değişimi', unit: 'kg', showWeekly: true },
    { key: 'bmi', label: 'BMI Değişimi', unit: 'puan' },
    { key: 'waist', label: 'Bel Çevresi Değişimi', unit: 'cm' },
    { key: 'hip', label: 'Kalça', unit: 'cm' },
    { key: 'chest', label: 'Göğüs', unit: 'cm' },
    { key: 'arm', label: 'Kol', unit: 'cm' },
    { key: 'thigh', label: 'Uyluk', unit: 'cm' },
    { key: 'calf', label: 'Baldır', unit: 'cm' },
  ];
  
  // İçeriği render et
  return (
    <Card>
      <CardHeader>
        <CardTitle>İlerleme Raporu</CardTitle>
        <CardDescription>
          {firstMeasurement.date && lastMeasurement.date && (
            <>
              <span className="font-medium">
                {formatDate(firstMeasurement.date)} - {formatDate(lastMeasurement.date)}
              </span>
              {" "}tarih aralığındaki ilerleme
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Ana metrikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Toplam kilo değişimi */}
          {changes.weight !== null && (
            <div className="p-4 border rounded-lg bg-muted/20">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Toplam Kilo Değişimi</h4>
              <div className="flex items-center">
                <span className={`text-3xl font-bold ${changes.weight < 0 ? "text-green-600" : changes.weight > 0 ? "text-red-600" : "text-muted"}`}>
                  {changes.weight < 0 ? "" : "+"}{changes.weight.toFixed(1)}
                </span>
                <span className="text-base ml-1">kg</span>
              </div>
              {daysDiff && daysDiff > 7 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {daysDiff} günde {Math.abs(changes.weight / (daysDiff / 7)).toFixed(1)} kg/hafta
                </p>
              )}
            </div>
          )}
          
          {/* Toplam bel çevresi değişimi */}
          {changes.waist !== null && (
            <div className="p-4 border rounded-lg bg-muted/20">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Bel Çevresi Değişimi</h4>
              <div className="flex items-center">
                <span className={`text-3xl font-bold ${changes.waist < 0 ? "text-green-600" : changes.waist > 0 ? "text-red-600" : "text-muted"}`}>
                  {changes.waist < 0 ? "" : "+"}{changes.waist.toFixed(1)}
                </span>
                <span className="text-base ml-1">cm</span>
              </div>
            </div>
          )}
          
          {/* BMI değişimi */}
          {changes.bmi !== null && (
            <div className="p-4 border rounded-lg bg-muted/20">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">BMI Değişimi</h4>
              <div className="flex items-center">
                <span className={`text-3xl font-bold ${changes.bmi < 0 ? "text-green-600" : changes.bmi > 0 ? "text-red-600" : "text-muted"}`}>
                  {changes.bmi < 0 ? "" : "+"}{changes.bmi.toFixed(1)}
                </span>
                <span className="text-base ml-1">puan</span>
              </div>
              {lastMeasurement.bmi && (
                <p className="text-xs text-muted-foreground mt-2">
                  Mevcut BMI: {Number(lastMeasurement.bmi).toFixed(1)}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Vücut çevresi değişimleri */}
        <div className="pt-2">
          <h4 className="text-sm font-medium mb-3">Vücut Ölçüleri Değişimleri</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Kalça", key: "hip", unit: "cm" },
              { label: "Göğüs", key: "chest", unit: "cm" },
              { label: "Kol", key: "arm", unit: "cm" },
              { label: "Uyluk", key: "thigh", unit: "cm" },
              { label: "Baldır", key: "calf", unit: "cm" }
            ].map(metric => {
              const keyName = metric.key as keyof typeof changes;
              const change = changes[keyName];
              
              if (change === null) return null;
              
              const isImproved = change < 0;
              
              return (
                <div key={metric.key} className="border p-2 rounded-md text-center">
                  <div className="text-sm mb-1">{metric.label}</div>
                  <div className={`text-lg font-semibold ${isImproved ? "text-green-600" : change > 0 ? "text-red-600" : "text-muted"}`}>
                    {change < 0 ? "" : "+"}{change.toFixed(1)} {metric.unit}
                  </div>
                  <div className="mt-1">
                    <Badge variant="outline" className={`text-xs px-1 ${isImproved ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {Math.abs(change).toFixed(1)} {metric.unit}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Çalışma süresi */}
        {daysDiff > 0 && (
          <div className="mt-6 text-center">
            <span className="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              {daysDiff} gündür danışanınızla çalışıyorsunuz
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
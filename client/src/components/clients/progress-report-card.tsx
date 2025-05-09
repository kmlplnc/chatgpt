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
            <div className="p-4 border rounded-lg bg-slate-50">
              <h4 className="text-sm font-medium text-center mb-1">Toplam Kilo Değişimi</h4>
              <div className="flex justify-center mt-2">
                <div className="text-center">
                  <span className="block text-4xl font-bold text-slate-700">{lastMeasurement.weight}</span>
                  <span className="text-xs text-muted-foreground">kg</span>
                </div>
              </div>
              <div className="flex justify-center mt-3">
                <span className={`text-base font-medium py-1 px-2 rounded ${changes.weight < 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {changes.weight < 0 ? "-" : "+"}{Math.abs(changes.weight).toFixed(1)} kg
                </span>
              </div>
              {daysDiff && daysDiff > 7 && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  {daysDiff} günde {Math.abs(changes.weight / (daysDiff / 7)).toFixed(1)} kg/hafta
                </p>
              )}
            </div>
          )}
          
          {/* Toplam bel çevresi değişimi */}
          {changes.waist !== null && (
            <div className="p-4 border rounded-lg bg-slate-50">
              <h4 className="text-sm font-medium text-center mb-1">Bel Çevresi Değişimi</h4>
              <div className="flex justify-center mt-2">
                <div className="text-center">
                  <span className="block text-4xl font-bold text-slate-700">{lastMeasurement.waistCircumference}</span>
                  <span className="text-xs text-muted-foreground">cm</span>
                </div>
              </div>
              <div className="flex justify-center mt-3">
                <span className={`text-base font-medium py-1 px-2 rounded ${changes.waist < 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {changes.waist < 0 ? "-" : "+"}{Math.abs(changes.waist).toFixed(1)} cm
                </span>
              </div>
            </div>
          )}
          
          {/* BMI değişimi */}
          {changes.bmi !== null && (
            <div className="p-4 border rounded-lg bg-slate-50">
              <h4 className="text-sm font-medium text-center mb-1">BMI Değişimi</h4>
              <div className="flex justify-center mt-2">
                <div className="text-center">
                  <span className="block text-4xl font-bold text-slate-700">{Number(lastMeasurement.bmi).toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">puan</span>
                </div>
              </div>
              <div className="flex justify-center mt-3">
                <span className={`text-base font-medium py-1 px-2 rounded ${changes.bmi < 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {changes.bmi < 0 ? "-" : "+"}{Math.abs(changes.bmi).toFixed(1)} puan
                </span>
              </div>
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
              const currentValue = metric.key === 'hip' ? lastMeasurement.hipCircumference : 
                                  metric.key === 'chest' ? lastMeasurement.chestCircumference :
                                  metric.key === 'arm' ? lastMeasurement.armCircumference :
                                  metric.key === 'thigh' ? lastMeasurement.thighCircumference :
                                  metric.key === 'calf' ? lastMeasurement.calfCircumference : 0;
              
              return (
                <div key={metric.key} className="border p-2 rounded-md">
                  <div className="text-center font-medium mb-1">{metric.label}</div>
                  <div className="text-center">
                    <span className="text-xl block font-medium">{currentValue}</span>
                    <span className="text-xs text-muted-foreground">cm</span>
                  </div>
                  <div className="flex justify-center mt-2">
                    <span className={`text-xs font-medium py-1 px-2 rounded-sm ${isImproved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {isImproved ? "-" : "+"}{Math.abs(change).toFixed(1)} cm
                    </span>
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
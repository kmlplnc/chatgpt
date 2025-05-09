import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Measurement } from "@shared/schema";

interface BodyVisualizationProps {
  title?: string;
  measurements: Measurement[];
  gender: "male" | "female";
  showComparison?: boolean;
}

export default function BodyVisualization({
  title = "Vücut Görselleştirmesi",
  measurements,
  gender,
  showComparison = true
}: BodyVisualizationProps) {
  // En son ve önceki ölçümleri al
  const latestMeasurement = measurements[0] || null;
  const previousMeasurement = measurements.length > 1 ? measurements[1] : null;
  const hasPreviousMeasurement = !!previousMeasurement;

  // Erkek/Kadın modeli için SVG yüksekliği
  const svgHeight = 450;
  const svgWidth = showComparison && hasPreviousMeasurement ? 500 : 300;

  // BMI ve vücut yağı hesapla
  const calculateBMI = (weight: number, height: number): number => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  // Sağlık durumuna göre renk belirle
  const getHealthColor = (bmi: number, bodyFat: number): string => {
    // Obez - Kırmızı
    if (bmi >= 30 || bodyFat >= 30) {
      return "#ff5252"; // kırmızı
    }
    // Fazla kilolu - Turuncu
    else if (bmi >= 25 || bodyFat >= 25) {
      return "#ffa726"; // turuncu
    }
    // Normal - Yeşil
    else if (bmi >= 18.5) {
      return "#66bb6a"; // yeşil
    }
    // Zayıf - Mavi
    else {
      return "#42a5f5"; // mavi
    }
  };

  // Vücut ölçülerine göre model ölçekleri hesapla
  const getBodyScale = (measurement: Measurement | null) => {
    if (!measurement) return { body: 1, arm: 1, leg: 1, waist: 1 };

    // Standart referans değerler
    const refWeight = gender === "male" ? 75 : 60;
    const refBodyFat = gender === "male" ? 15 : 25;
    const refWaist = gender === "male" ? 85 : 75;
    const refHip = gender === "male" ? 95 : 100;
    const refChest = gender === "male" ? 100 : 90;
    const refArm = gender === "male" ? 35 : 30;
    const refThigh = gender === "male" ? 60 : 55;

    // Ölçeğimizi hesapla
    const weightRatio = measurement.weight / refWeight;
    const bodyFatRatio = measurement.bodyFatPercentage / refBodyFat;
    const waistRatio = measurement.waistCircumference / refWaist;
    const hipRatio = measurement.hipCircumference / refHip;
    const chestRatio = measurement.chestCircumference / refChest;
    const armRatio = measurement.armCircumference / refArm;
    const thighRatio = measurement.thighCircumference / refThigh;

    // 0.8 ile 1.2 arasında sınırlandır (çok aşırı farklılıkları engelle)
    const clamp = (value: number, min = 0.8, max = 1.2) => Math.max(min, Math.min(max, value));

    return {
      body: clamp((weightRatio + bodyFatRatio) / 2),
      arm: clamp(armRatio),
      leg: clamp(thighRatio),
      waist: clamp(waistRatio),
      hip: clamp(hipRatio),
      chest: clamp(chestRatio)
    };
  };

  // Ölçümler için renkleri hesapla
  const getColorForMeasurement = (measurement: Measurement | null) => {
    if (!measurement) return "#cccccc"; // varsayılan gri
    
    const bmi = measurement.bmi 
      ? parseFloat(measurement.bmi) 
      : calculateBMI(measurement.weight, measurement.height);
      
    return getHealthColor(bmi, measurement.bodyFatPercentage);
  };

  // Mevcut ve önceki ölçümler için ölçekleri ve renkleri hesapla
  const currentScale = getBodyScale(latestMeasurement);
  const previousScale = getBodyScale(previousMeasurement);

  const currentColor = getColorForMeasurement(latestMeasurement);
  const previousColor = getColorForMeasurement(previousMeasurement);

  // Ölçümler arası farkları hesapla
  const calculateDifference = () => {
    if (!hasPreviousMeasurement || !latestMeasurement || !previousMeasurement) return null;

    const current = latestMeasurement;
    const previous = previousMeasurement;

    // Ağırlık değişimi
    const weightDiff = current.weight - previous.weight;
    const weightPercentage = (weightDiff / previous.weight * 100).toFixed(1);

    // Vücut yağ oranı değişimi
    const bodyFatDiff = current.bodyFatPercentage - previous.bodyFatPercentage;

    // BMI değişimi
    const currentBMI = current.bmi ? parseFloat(current.bmi) : calculateBMI(current.weight, current.height);
    const previousBMI = previous.bmi ? parseFloat(previous.bmi) : calculateBMI(previous.weight, previous.height);
    const bmiDiff = currentBMI - previousBMI;
    const bmiPercentage = (bmiDiff / previousBMI * 100).toFixed(1);

    // Bel çevresi değişimi
    const waistDiff = current.waistCircumference - previous.waistCircumference;
    const waistPercentage = (waistDiff / previous.waistCircumference * 100).toFixed(1);

    return {
      weight: {
        value: weightDiff.toFixed(1),
        percentage: weightPercentage,
        improved: weightDiff < 0 // Kilo kaybı genelde iyileşme göstergesidir
      },
      bodyFat: {
        value: bodyFatDiff.toFixed(1),
        improved: bodyFatDiff < 0 // Yağ kaybı iyileşme göstergesidir
      },
      bmi: {
        value: bmiDiff.toFixed(1),
        percentage: bmiPercentage,
        improved: bmiDiff < 0 // BMI azalması genelde iyileşme göstergesidir
      },
      waist: {
        value: waistDiff.toFixed(1),
        percentage: waistPercentage,
        improved: waistDiff < 0 // Bel çevresi azalması iyileşme göstergesidir
      }
    };
  };

  const differences = calculateDifference();

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Değişimin pozitif/negatif durumunu göster
  const ChangeIndicator = ({ value, improved }: { value: string, improved: boolean }) => (
    <Badge variant={improved ? "success" : "destructive"}>
      {improved ? '▼' : '▲'} {value}
    </Badge>
  );

  // SVG içindeki insan modelini oluştur
  const renderHumanModel = (scale: any, color: string, offsetX: number = 0) => {
    // Ölçeklendirme faktörleri
    const bodyScale = scale.body;
    const armScale = scale.arm;
    const legScale = scale.leg;
    const waistScale = scale.waist;
    
    // Erkek ve kadın modeller için değerler biraz farklı
    const shoulderWidth = gender === "male" ? 80 : 70;
    const hipWidth = gender === "male" ? 60 : 75;
    const headRadius = 25;
    
    // Vücut parçalarının konumları
    const baseX = 100 + offsetX;
    const headY = 50;
    const shoulderY = headY + headRadius + 15;
    const waistY = shoulderY + 80;
    const hipY = waistY + 40;
    const kneeY = hipY + 80;
    const footY = kneeY + 80;
    
    return (
      <>
        {/* Baş */}
        <circle 
          cx={baseX} 
          cy={headY} 
          r={headRadius} 
          fill={color} 
          stroke="#000" 
          strokeWidth="2" 
        />
        
        {/* Gövde - Trapezoid şekli */}
        <polygon
          points={`
            ${baseX - shoulderWidth * bodyScale / 2},${shoulderY}
            ${baseX + shoulderWidth * bodyScale / 2},${shoulderY}
            ${baseX + hipWidth * waistScale / 2},${hipY}
            ${baseX - hipWidth * waistScale / 2},${hipY}
          `}
          fill={color}
          stroke="#000"
          strokeWidth="2"
        />
        
        {/* Bel bölgesi - ölçeklendirmeyi göster */}
        <line
          x1={baseX - hipWidth * waistScale / 2 - 10}
          y1={waistY}
          x2={baseX + hipWidth * waistScale / 2 + 10}
          y2={waistY}
          stroke="#000"
          strokeWidth="3"
          strokeDasharray={gender === "female" ? "5,5" : ""}
        />
        
        {/* Sol kol */}
        <line
          x1={baseX - shoulderWidth * bodyScale / 2}
          y1={shoulderY + 5}
          x2={baseX - shoulderWidth * bodyScale / 2 - 25 * armScale}
          y2={waistY - 20}
          stroke={color}
          strokeWidth={20 * armScale}
          strokeLinecap="round"
        />
        
        {/* Sağ kol */}
        <line
          x1={baseX + shoulderWidth * bodyScale / 2}
          y1={shoulderY + 5}
          x2={baseX + shoulderWidth * bodyScale / 2 + 25 * armScale}
          y2={waistY - 20}
          stroke={color}
          strokeWidth={20 * armScale}
          strokeLinecap="round"
        />
        
        {/* Sol bacak */}
        <line
          x1={baseX - hipWidth * waistScale / 4}
          y1={hipY}
          x2={baseX - hipWidth * waistScale / 4 - 15 * legScale}
          y2={footY}
          stroke={color}
          strokeWidth={25 * legScale}
          strokeLinecap="round"
        />
        
        {/* Sağ bacak */}
        <line
          x1={baseX + hipWidth * waistScale / 4}
          y1={hipY}
          x2={baseX + hipWidth * waistScale / 4 + 15 * legScale}
          y2={footY}
          stroke={color}
          strokeWidth={25 * legScale}
          strokeLinecap="round"
        />
        
        {/* Kadın modeli için ek detaylar */}
        {gender === "female" && (
          <>
            {/* Saç */}
            <path
              d={`M${baseX - headRadius},${headY - 10} 
                 a${headRadius},${headRadius + 10} 0 1,1 ${headRadius * 2},0`}
              fill={color}
              stroke="#000"
              strokeWidth="2"
            />
          </>
        )}
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {latestMeasurement 
            ? `${formatDate(latestMeasurement.date)} tarihli vücut ölçümleri` 
            : 'Henüz ölçüm kaydedilmemiş'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          {/* Cinsiyet seçimi */}
          <div className="flex justify-end space-x-2 mb-4">
            <Button 
              size="sm" 
              variant={gender === "male" ? "default" : "outline"}
              onClick={() => {}}
              disabled
            >
              Erkek
            </Button>
            <Button 
              size="sm" 
              variant={gender === "female" ? "default" : "outline"}
              onClick={() => {}}
              disabled
            >
              Kadın
            </Button>
          </div>
          
          {latestMeasurement ? (
            <>
              {/* SVG Görselleştirme */}
              <div className="relative border rounded-lg p-2 bg-gray-50">
                <svg 
                  width={svgWidth}
                  height={svgHeight}
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                >
                  {/* Mevcut model */}
                  {renderHumanModel(currentScale, currentColor, showComparison && hasPreviousMeasurement ? 175 : 50)}
                  
                  {/* Önceki model (karşılaştırma etkinse) */}
                  {showComparison && hasPreviousMeasurement && previousMeasurement && (
                    <>
                      {renderHumanModel(previousScale, previousColor, 0)}
                      
                      {/* Etiketler */}
                      <text x="45" y="25" fontWeight="bold">Önceki</text>
                      <text x="45" y="40" fontSize="12">
                        {formatDate(previousMeasurement.date)}
                      </text>
                      
                      <text x="220" y="25" fontWeight="bold">Güncel</text>
                      <text x="220" y="40" fontSize="12">
                        {formatDate(latestMeasurement.date)}
                      </text>
                      
                      {/* Ok işareti */}
                      <line 
                        x1="125" 
                        y1="230" 
                        x2="175" 
                        y2="230" 
                        stroke="#555" 
                        strokeWidth="2" 
                        markerEnd="url(#arrowhead)" 
                      />
                      <defs>
                        <marker 
                          id="arrowhead" 
                          markerWidth="10" 
                          markerHeight="7" 
                          refX="10" 
                          refY="3.5" 
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#555" />
                        </marker>
                      </defs>
                    </>
                  )}
                </svg>
              </div>
              
              {/* Değişim İstatistikleri */}
              {showComparison && differences && (
                <div className="mt-6 p-4 border rounded-lg bg-muted">
                  <h4 className="font-bold mb-2">Değişim Analizi</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Ağırlık:</p>
                      <div className="flex items-center">
                        <ChangeIndicator 
                          value={`${differences.weight.value} kg (${differences.weight.percentage}%)`} 
                          improved={differences.weight.improved}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Vücut Yağı:</p>
                      <div className="flex items-center">
                        <ChangeIndicator 
                          value={`${differences.bodyFat.value}%`} 
                          improved={differences.bodyFat.improved}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">BMI:</p>
                      <div className="flex items-center">
                        <ChangeIndicator 
                          value={`${differences.bmi.value} (${differences.bmi.percentage}%)`} 
                          improved={differences.bmi.improved}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Bel Çevresi:</p>
                      <div className="flex items-center">
                        <ChangeIndicator 
                          value={`${differences.waist.value} cm (${differences.waist.percentage}%)`} 
                          improved={differences.waist.improved}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Renk açıklamaları */}
              <div className="mt-6">
                <div className="flex items-center space-x-4 justify-center">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 rounded-full" style={{backgroundColor: "#ff5252"}}></div>
                    <span className="text-xs">Obez</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 rounded-full" style={{backgroundColor: "#ffa726"}}></div>
                    <span className="text-xs">Fazla Kilolu</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 rounded-full" style={{backgroundColor: "#66bb6a"}}></div>
                    <span className="text-xs">Normal</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 rounded-full" style={{backgroundColor: "#42a5f5"}}></div>
                    <span className="text-xs">Zayıf</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 border rounded-lg bg-gray-50">
              <p className="text-muted-foreground">Henüz ölçüm kaydedilmemiş</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

// Health calculation utilities
export const calculateBMI = (weight: number, height: number) => {
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

export const calculateBMR = (weight: number, height: number, age: number, gender: string) => {
  if (gender === "male") {
    return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
  }
  return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
};

export const calculateTDEE = (bmr: number, activityLevel: string) => {
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  };
  return Math.round(bmr * activityMultipliers[activityLevel as keyof typeof activityMultipliers]);
};

export const calculateWHR = (waist: number, hip: number) => {
  if (!waist || !hip) return null;
  return (waist / hip).toFixed(2);
};

export const getHealthStatus = (bmi: number) => {
  if (bmi < 18.5) return { status: "Zayıf", color: "text-amber-500" };
  if (bmi < 25) return { status: "Normal", color: "text-green-500" };
  if (bmi < 30) return { status: "Kilolu", color: "text-amber-500" };
  return { status: "Obez", color: "text-red-500" };
};

export const getBodyFatStatus = (bodyFat: number, gender: string) => {
  if (gender === "male") {
    if (bodyFat < 2) return { status: "Tehlikeli Düşük", color: "text-red-500" };
    if (bodyFat <= 6) return { status: "Atletik", color: "text-green-500" };
    if (bodyFat <= 13) return { status: "Fitness", color: "text-green-400" };
    if (bodyFat <= 17) return { status: "Kabul Edilebilir", color: "text-amber-500" };
    if (bodyFat <= 25) return { status: "Yüksek", color: "text-red-400" };
    return { status: "Obez", color: "text-red-500" };
  } else {
    if (bodyFat < 10) return { status: "Tehlikeli Düşük", color: "text-red-500" };
    if (bodyFat <= 14) return { status: "Atletik", color: "text-green-500" };
    if (bodyFat <= 21) return { status: "Fitness", color: "text-green-400" };
    if (bodyFat <= 25) return { status: "Kabul Edilebilir", color: "text-amber-500" };
    if (bodyFat <= 32) return { status: "Yüksek", color: "text-red-400" };
    return { status: "Obez", color: "text-red-500" };
  }
};

export const getWHRStatus = (whr: number, gender: string) => {
  if (gender === "male") {
    if (whr <= 0.85) return { status: "Düşük Risk", color: "text-green-500" };
    if (whr <= 0.90) return { status: "Orta Risk", color: "text-amber-500" };
    if (whr <= 0.95) return { status: "Yüksek Risk", color: "text-red-500" };
    return { status: "Çok Yüksek Risk", color: "text-red-700" };
  } else {
    if (whr <= 0.75) return { status: "Düşük Risk", color: "text-green-500" };
    if (whr <= 0.80) return { status: "Orta Risk", color: "text-amber-500" };
    if (whr <= 0.85) return { status: "Yüksek Risk", color: "text-red-500" };
    return { status: "Çok Yüksek Risk", color: "text-red-700" };
  }
};

interface HealthMetricsProps {
  measurements: any[];
  client: {
    gender: string;
    birthDate: string;
  };
}

export const HealthMetrics: React.FC<HealthMetricsProps> = ({
  measurements,
  client,
}) => {
  const sortedMeasurements = [...measurements].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latestMeasurement = sortedMeasurements[0];
  const firstMeasurement = sortedMeasurements[sortedMeasurements.length - 1];

  // Calculate age
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(client.birthDate);

  // Calculate health metrics
  const bmiStatus = getHealthStatus(parseFloat(latestMeasurement.bmi));
  const bodyFatStatus = latestMeasurement.bodyFatPercentage ? 
    getBodyFatStatus(parseFloat(latestMeasurement.bodyFatPercentage), client.gender) : null;
  const whrStatus = latestMeasurement.waistCircumference && latestMeasurement.hipCircumference ?
    getWHRStatus(
      parseFloat(latestMeasurement.waistCircumference) / parseFloat(latestMeasurement.hipCircumference),
      client.gender
    ) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BMI Card */}
        <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">BMI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{latestMeasurement.bmi}</div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={bmiStatus.color}>
                {bmiStatus.status}
              </Badge>
            </div>
            <Progress 
              value={Math.min(parseFloat(latestMeasurement.bmi) * 2, 100)} 
              className="h-2.5 mt-4" 
              indicatorClassName={bmiStatus.color.replace('text-', 'bg-')}
            />
          </CardContent>
        </Card>

        {/* Body Fat Card */}
        {latestMeasurement.bodyFatPercentage && (
          <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg">Vücut Yağı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{latestMeasurement.bodyFatPercentage}%</div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={bodyFatStatus?.color}>
                  {bodyFatStatus?.status}
                </Badge>
              </div>
              <Progress 
                value={Math.min(parseFloat(latestMeasurement.bodyFatPercentage) * 2, 100)} 
                className="h-2.5 mt-4" 
                indicatorClassName={bodyFatStatus?.color.replace('text-', 'bg-')}
              />
            </CardContent>
          </Card>
        )}

        {/* WHR Card */}
        {whrStatus && (
          <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg">Bel/Kalça Oranı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {(parseFloat(latestMeasurement.waistCircumference) / parseFloat(latestMeasurement.hipCircumference)).toFixed(2)}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={whrStatus.color}>
                  {whrStatus.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* BMR Card */}
        <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">BMR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {latestMeasurement.basalMetabolicRate} <span className="text-base font-normal text-muted-foreground">kcal</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Günlük minimum kalori ihtiyacı
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weight Change Graph */}
        <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>Kilo Değişimi</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedMeasurements}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), "dd MMM", { locale: tr })}
                />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip
                  labelFormatter={(value) => format(new Date(value), "dd MMMM yyyy", { locale: tr })}
                  formatter={(value: any) => [`${value} kg`, "Kilo"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Kilo"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Body Fat Change Graph */}
        {measurements.some(m => m.bodyFatPercentage) && (
          <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle>Vücut Yağı Değişimi</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedMeasurements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "dd MMM", { locale: tr })}
                  />
                  <YAxis domain={[0, 40]} />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), "dd MMMM yyyy", { locale: tr })}
                    formatter={(value: any) => [`%${value}`, "Vücut Yağı"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="bodyFatPercentage"
                    name="Vücut Yağı"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* WHR Change Graph */}
        {measurements.some(m => m.waistCircumference && m.hipCircumference) && (
          <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle>Bel-Kalça Oranı Değişimi</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedMeasurements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "dd MMM", { locale: tr })}
                  />
                  <YAxis domain={[0.6, 1.2]} />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), "dd MMMM yyyy", { locale: tr })}
                    formatter={(value: any, name: any) => {
                      const measurement = sortedMeasurements.find(m => m.date === value);
                      if (measurement) {
                        const whr = (parseFloat(measurement.waistCircumference) / parseFloat(measurement.hipCircumference)).toFixed(2);
                        return [whr, "Bel-Kalça Oranı"];
                      }
                      return ["-", name];
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={(v) => v.waistCircumference && v.hipCircumference ? 
                      (parseFloat(v.waistCircumference) / parseFloat(v.hipCircumference)).toFixed(2) : null}
                    name="Bel-Kalça Oranı"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Metabolic Rates Graph */}
        <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>Metabolik Değerler</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedMeasurements}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), "dd MMM", { locale: tr })}
                />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip
                  labelFormatter={(value) => format(new Date(value), "dd MMMM yyyy", { locale: tr })}
                  formatter={(value: any, name: any) => [`${value} kcal`, name]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="basalMetabolicRate"
                  name="BMR"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalDailyEnergyExpenditure"
                  name="TDEE"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Droplet, Dumbbell, Info, FileText } from "lucide-react";

interface PlanDetailsProps {
  description?: string;
  waterIntake?: string;
  exercise?: {
    type?: string;
    duration?: string;
    frequency?: string;
  };
  calorieGoal?: number;
  dietType?: string;
  healthNotes?: string;
}

export default function PlanDetails({
  description,
  waterIntake,
  exercise,
  calorieGoal,
  dietType,
  healthNotes
}: PlanDetailsProps) {
  return (
    <Card className="bg-white shadow-md rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">Plan Detayları</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Diyet Özeti */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-800">Diyet Özeti</h3>
          </div>
          <div className="pl-7 space-y-3">
            {description && (
              <p className="text-gray-600">{description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {dietType && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {dietType}
                </Badge>
              )}
              {calorieGoal && (
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  {calorieGoal} kcal/gün
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Su Tüketimi */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-800">Su Tüketimi</h3>
          </div>
          <div className="pl-7">
            {waterIntake && (
              <p className="text-gray-600">{waterIntake}</p>
            )}
          </div>
        </div>

        {/* Egzersiz */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-800">Egzersiz</h3>
          </div>
          <div className="pl-7 space-y-2">
            {exercise && (
              <>
                {exercise.type && (
                  <p className="text-gray-600">{exercise.type}</p>
                )}
                {exercise.duration && (
                  <p className="text-sm text-gray-500">Süre: {exercise.duration}</p>
                )}
                {exercise.frequency && (
                  <p className="text-sm text-gray-500">Sıklık: {exercise.frequency}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sağlık Notları */}
        {healthNotes && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-800">Sağlık Notları</h3>
            </div>
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                {healthNotes}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
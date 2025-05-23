import React from "react";
import { Badge } from "@/components/ui/badge";

interface IdealValue {
  min?: number;
  max?: number;
  unit: string;
}

interface IdealValues {
  [key: string]: IdealValue;
}

interface SimpleChartProps {
  activeMetric: string;
  idealValues: IdealValues;
}

const hasMin = (value: IdealValue): boolean => {
  return value.min !== undefined;
};

const hasMax = (value: IdealValue): boolean => {
  return value.max !== undefined;
};

export const SimpleChart: React.FC<SimpleChartProps> = ({ activeMetric, idealValues }) => {
  return (
    <div className="flex gap-2">
      {activeMetric && hasMin(idealValues[activeMetric]) && (
        <Badge variant="outline" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          Min: {idealValues[activeMetric].min} {idealValues[activeMetric].unit}
        </Badge>
      )}
      {activeMetric && hasMax(idealValues[activeMetric]) && (
        <Badge variant="outline" className="bg-red-100 text-red-700 hover:bg-red-100">
          Max: {idealValues[activeMetric].max} {idealValues[activeMetric].unit}
        </Badge>
      )}
    </div>
  );
};
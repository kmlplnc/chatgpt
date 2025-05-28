import { Measurement } from '../../types/measurement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBMIColor, getBodyFatColor, calculateWHR, getWHRStatus } from '../../utils/measurement-utils';
import { Pencil, Trash } from 'lucide-react';

interface MeasurementListProps {
  measurements: Measurement[];
  onEdit: (measurement: Measurement) => void;
  onDelete: (measurementId: number) => void;
  clientGender: string;
}

export function MeasurementList({ measurements, onEdit, onDelete, clientGender }: MeasurementListProps) {
  return (
    <div className="space-y-4">
      {measurements.map((measurement) => {
        const whr = calculateWHR(measurement.waistCircumference, measurement.hipCircumference);
        const whrStatus = whr ? getWHRStatus(whr, clientGender) : null;
        const bodyFatColor = measurement.bodyFatPercentage ? getBodyFatColor(parseFloat(measurement.bodyFatPercentage), clientGender) : '';

        return (
          <Card key={measurement.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {new Date(measurement.date).toLocaleDateString('tr-TR')}
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(measurement)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(measurement.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Kilo</p>
                  <p className="text-lg font-semibold">{measurement.weight} kg</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Boy</p>
                  <p className="text-lg font-semibold">{measurement.height} m</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">BMI</p>
                  <p className={`text-lg font-semibold text-${getBMIColor(parseFloat(measurement.bmi))}`}>
                    {measurement.bmi}
                  </p>
                </div>
                {measurement.bodyFatPercentage && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Vücut Yağ Oranı</p>
                    <p className={`text-lg font-semibold text-${bodyFatColor}`}>
                      {measurement.bodyFatPercentage}%
                    </p>
                  </div>
                )}
                {measurement.waistCircumference && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Bel Çevresi</p>
                    <p className="text-lg font-semibold">{measurement.waistCircumference} cm</p>
                  </div>
                )}
                {measurement.hipCircumference && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Kalça Çevresi</p>
                    <p className="text-lg font-semibold">{measurement.hipCircumference} cm</p>
                  </div>
                )}
                {measurement.chestCircumference && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Göğüs Çevresi</p>
                    <p className="text-lg font-semibold">{measurement.chestCircumference} cm</p>
                  </div>
                )}
                {measurement.armCircumference && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Kol Çevresi</p>
                    <p className="text-lg font-semibold">{measurement.armCircumference} cm</p>
                  </div>
                )}
                {measurement.thighCircumference && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Bacak Çevresi</p>
                    <p className="text-lg font-semibold">{measurement.thighCircumference} cm</p>
                  </div>
                )}
                {measurement.calfCircumference && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Baldır Çevresi</p>
                    <p className="text-lg font-semibold">{measurement.calfCircumference} cm</p>
                  </div>
                )}
                {measurement.neckCircumference && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Boyun Çevresi</p>
                    <p className="text-lg font-semibold">{measurement.neckCircumference} cm</p>
                  </div>
                )}
                {whr && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Bel/Kalça Oranı</p>
                    <p className={`text-lg font-semibold text-${whrStatus?.color}`}>
                      {whr.toFixed(2)}
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">BMR</p>
                  <p className="text-lg font-semibold">{measurement.basalMetabolicRate} kcal</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">TDEE</p>
                  <p className="text-lg font-semibold">{measurement.totalDailyEnergyExpenditure} kcal</p>
                </div>
              </div>
              {measurement.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Notlar</p>
                  <p className="text-sm">{measurement.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 
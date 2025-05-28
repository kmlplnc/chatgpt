import { Measurement } from '@/pages/client-detail/types/measurement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBMIColor, getBodyFatColor, calculateWHR, getWHRStatus } from '@/pages/client-detail/utils/measurement-utils';

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
        const bodyFatColor = measurement.bodyFatPercentage 
          ? getBodyFatColor(parseFloat(measurement.bodyFatPercentage), clientGender)
          : null;

        return (
          <Card key={measurement.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center text-base">
                <span className="font-medium">{new Date(measurement.date).toLocaleDateString('tr-TR')}</span>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(measurement)}>
                    Düzenle
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(measurement.id)}>
                    Sil
                  </Button>
                </div>
              </CardTitle>
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
                <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Notlar</p>
                  <p className="text-sm mt-1">{measurement.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { calculateBmiFromString, calculateBmrFromString, calculateTdeeFromBmr } from '@/pages/client-detail/utils/measurement-utils';

const measurementSchema = z.object({
  date: z.string(),
  weight: z.string(),
  height: z.string(),
  waistCircumference: z.string().optional(),
  hipCircumference: z.string().optional(),
  bodyFatPercentage: z.string().optional(),
  activityLevel: z.string(),
  notes: z.string().optional(),
  // Micro-nutrients
  vitaminA: z.string().optional(),
  vitaminC: z.string().optional(),
  vitaminD: z.string().optional(),
  vitaminE: z.string().optional(),
  vitaminK: z.string().optional(),
  thiamin: z.string().optional(),
  riboflavin: z.string().optional(),
  niacin: z.string().optional(),
  vitaminB6: z.string().optional(),
  folate: z.string().optional(),
  vitaminB12: z.string().optional(),
  biotin: z.string().optional(),
  pantothenicAcid: z.string().optional(),
  calcium: z.string().optional(),
  iron: z.string().optional(),
  magnesium: z.string().optional(),
  phosphorus: z.string().optional(),
  zinc: z.string().optional(),
  potassium: z.string().optional(),
  sodium: z.string().optional(),
  copper: z.string().optional(),
  manganese: z.string().optional(),
  selenium: z.string().optional(),
  chromium: z.string().optional(),
  molybdenum: z.string().optional(),
  iodine: z.string().optional(),
});

export type MeasurementFormData = z.infer<typeof measurementSchema> & {
  bmi?: string;
  basalMetabolicRate?: number;
  totalDailyEnergyExpenditure?: number;
};

interface MeasurementFormProps {
  onSubmit: (data: MeasurementFormData) => void;
  initialData?: MeasurementFormData;
  clientGender: string;
  clientAge: number;
}

export function MeasurementForm({ onSubmit, initialData, clientGender, clientAge }: MeasurementFormProps) {
  const form = useForm<MeasurementFormData>({
    resolver: zodResolver(measurementSchema),
    defaultValues: initialData || {
      date: new Date().toISOString().split('T')[0],
      activityLevel: 'sedentary',
    },
  });

  const handleSubmit = (data: MeasurementFormData) => {
    const bmi = calculateBmiFromString(data.weight, data.height);
    const bmr = calculateBmrFromString(data.weight, data.height, clientAge, clientGender);
    const tdee = calculateTdeeFromBmr(bmr, data.activityLevel);

    onSubmit({
      ...data,
      bmi,
      basalMetabolicRate: bmr,
      totalDailyEnergyExpenditure: tdee,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tarih</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kilo (kg)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Boy (m)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="waistCircumference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bel Çevresi (cm)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hipCircumference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kalça Çevresi (cm)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bodyFatPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vücut Yağ Oranı (%)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activityLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aktivite Seviyesi</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Aktivite seviyesi seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sedentary">Hareketsiz</SelectItem>
                  <SelectItem value="light">Hafif Aktif</SelectItem>
                  <SelectItem value="moderate">Orta Aktif</SelectItem>
                  <SelectItem value="active">Çok Aktif</SelectItem>
                  <SelectItem value="very_active">Aşırı Aktif</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Kaydet</Button>
      </form>
    </Form>
  );
} 
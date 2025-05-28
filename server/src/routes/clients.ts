import { Request, Response } from 'express';
import { db } from '../db';
import { measurements } from '../schema';

export const createMeasurement = async (req: Request, res: Response) => {
  console.log('==== REQ.BODY DEBUG ====', req.body);
  try {
    const { clientId } = req.params;
    const data = req.body;

    // Validate required fields
    if (!data.weight || !data.height || !data.date) {
      return res.status(400).json({ message: "Weight, height and date are required" });
    }

    // Convert string values to numbers where needed
    const validatedData = {
      clientId: parseInt(clientId),
      date: data.date,
      weight: parseFloat(data.weight),
      height: parseFloat(data.height),
      bmi: data.bmi ? parseFloat(data.bmi) : null,
      bodyFatPercentage: data.bodyFatPercentage ? parseFloat(data.bodyFatPercentage) : null,
      waistCircumference: data.waistCircumference ? parseFloat(data.waistCircumference) : null,
      hipCircumference: data.hipCircumference ? parseFloat(data.hipCircumference) : null,
      chestCircumference: data.chestCircumference ? parseFloat(data.chestCircumference) : null,
      armCircumference: data.armCircumference ? parseFloat(data.armCircumference) : null,
      thighCircumference: data.thighCircumference ? parseFloat(data.thighCircumference) : null,
      calfCircumference: data.calfCircumference ? parseFloat(data.calfCircumference) : null,
      neck_circumference: data.neckCircumference ? parseFloat(data.neckCircumference) : null,
      basalMetabolicRate: data.basalMetabolicRate ? parseFloat(data.basalMetabolicRate) : null,
      totalDailyEnergyExpenditure: data.totalDailyEnergyExpenditure ? parseFloat(data.totalDailyEnergyExpenditure) : null,
      // Micro-nutrients
      vitaminA: data.vitaminA,
      vitaminC: data.vitaminC,
      vitaminD: data.vitaminD,
      vitaminE: data.vitaminE,
      vitaminK: data.vitaminK,
      thiamin: data.thiamin,
      riboflavin: data.riboflavin,
      niacin: data.niacin,
      vitaminB6: data.vitaminB6,
      folate: data.folate,
      vitaminB12: data.vitaminB12,
      calcium: data.calcium,
      iron: data.iron,
      magnesium: data.magnesium,
      phosphorus: data.phosphorus,
      zinc: data.zinc,
      potassium: data.potassium,
      sodium: data.sodium,
      copper: data.copper,
      manganese: data.manganese,
      selenium: data.selenium,
      chromium: data.chromium,
      molybdenum: data.molybdenum,
      iodine: data.iodine
    };

    console.log('createMeasurement called');
    console.log('createMeasurement param:', validatedData);

    const result = await db.insert(measurements).values(validatedData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating measurement:', error);
    res.status(500).json({ message: "Failed to create measurement" });
  }
}; 
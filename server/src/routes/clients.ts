import { Request, Response } from 'express';
import { db } from '../db';
import { measurements } from '../schema';

export const createMeasurement = async (req: Request, res: Response) => {
  console.log('==== REQ.BODY DEBUG ====', req.body);
  try {
    const { id } = req.params;
    console.log('basal_metabolic_rate:', req.body.basal_metabolic_rate);
    console.log('total_daily_energy_expenditure:', req.body.total_daily_energy_expenditure);
    
    const validatedData = {
      clientId: Number(id),
      date: req.body.date,
      weight: req.body.weight,
      height: req.body.height,
      bmi: req.body.bmi,
      basalMetabolicRate: req.body.basal_metabolic_rate ? Number(req.body.basal_metabolic_rate) : null,
      totalDailyEnergyExpenditure: req.body.total_daily_energy_expenditure ? Number(req.body.total_daily_energy_expenditure) : null
    };
    console.log('validatedData:', validatedData);
    console.log('Drizzle insert obj:', validatedData);
    const result = await db.insert(measurements).values(validatedData);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Ölçüm eklenirken bir hata oluştu' });
  }
}; 
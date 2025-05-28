-- Add missing micronutrient columns to measurements table
ALTER TABLE measurements
ADD COLUMN IF NOT EXISTS biotin numeric(5,2),
ADD COLUMN IF NOT EXISTS pantothenic_acid numeric(5,2); 
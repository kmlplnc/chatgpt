-- Add medications column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS medications TEXT;

-- Add medical_conditions column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS medical_conditions TEXT;

-- Add allergies column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS allergies TEXT; 
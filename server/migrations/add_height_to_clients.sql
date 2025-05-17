-- Add height column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS height NUMERIC(5,2);

-- Update existing records with a default height if needed
UPDATE clients SET height = 170.00 WHERE height IS NULL; 
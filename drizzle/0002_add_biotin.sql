-- Add biotin column to measurements table
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS biotin numeric(5,2); 
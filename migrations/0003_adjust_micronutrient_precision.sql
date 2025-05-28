-- Adjust precision for micronutrient columns that need larger values
ALTER TABLE measurements
ALTER COLUMN potassium TYPE numeric(6,2),
ALTER COLUMN sodium TYPE numeric(6,2); 
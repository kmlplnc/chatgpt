-- Adjust precision for all micronutrient columns that need larger values
ALTER TABLE measurements
ALTER COLUMN calcium TYPE numeric(6,2),
ALTER COLUMN phosphorus TYPE numeric(6,2),
ALTER COLUMN potassium TYPE numeric(6,2),
ALTER COLUMN sodium TYPE numeric(6,2); 
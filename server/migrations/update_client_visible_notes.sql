ALTER TABLE clients
ALTER COLUMN client_visible_notes TYPE jsonb
USING
  CASE
    WHEN client_visible_notes IS NULL OR client_visible_notes = '' THEN '[]'::jsonb
    ELSE to_jsonb(array[client_visible_notes])
  END; 
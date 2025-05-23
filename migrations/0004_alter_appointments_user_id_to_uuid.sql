-- appointments tablosunda user_id kolonunu integer'dan uuid'ye çevir
-- Eski integer veriler varsa, bu işlem hata verebilir. Gerekirse önce eski randevuları silin veya migrate edin.

ALTER TABLE appointments
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid; 
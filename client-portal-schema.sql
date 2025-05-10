-- Client tablosuna erişim kodu (access_code) kolonu ekleyelim
ALTER TABLE clients ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE;
-- Erişim kodlarının benzersiz olmasını ve NULL olmamasını sağlayalım
ALTER TABLE clients ALTER COLUMN access_code SET NOT NULL DEFAULT '';
-- İndeks ekleyelim (hızlı erişim için)
CREATE INDEX IF NOT EXISTS idx_clients_access_code ON clients(access_code);

-- Danışanların oturum bilgilerini tutacak tablo
CREATE TABLE IF NOT EXISTS client_sessions (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON client_sessions(session_token);

-- Önce mevcut users tablosunu sil
DROP TABLE IF EXISTS users CASCADE;

-- Users tablosunu yeniden oluştur
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subscription_status TEXT NOT NULL DEFAULT 'free',
    subscription_plan TEXT,
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP
); 
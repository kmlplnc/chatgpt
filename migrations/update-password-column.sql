-- Önce password sütununu password_hash olarak yeniden adlandır
ALTER TABLE users RENAME COLUMN password TO password_hash;

-- Eğer password_hash sütunu yoksa ve password sütunu varsa
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password'
    ) THEN
        ALTER TABLE users RENAME COLUMN password TO password_hash;
    END IF;
END $$; 
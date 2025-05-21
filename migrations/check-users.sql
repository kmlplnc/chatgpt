-- Tüm kullanıcıları listele
SELECT id, username, email, full_name, role, created_at, updated_at, subscription_status, subscription_plan
FROM users
ORDER BY id; 
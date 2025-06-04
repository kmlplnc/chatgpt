-- Create indexes for better performance (excluding users table)
-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Client Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_client_sessions_client_id ON client_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON client_sessions(session_token);

-- Measurements table indexes
CREATE INDEX IF NOT EXISTS idx_measurements_client_id ON measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(date);

-- Diet Plans table indexes
CREATE INDEX IF NOT EXISTS idx_diet_plans_client_id ON diet_plans(client_id);

-- Appointments table indexes
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON notifications(client_id);

-- Client Notes table indexes
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_user_id ON client_notes(user_id);

-- Food Journals table indexes
CREATE INDEX IF NOT EXISTS idx_food_journals_client_id ON food_journals(client_id);
CREATE INDEX IF NOT EXISTS idx_food_journals_date ON food_journals(date);

-- Progress Photos table indexes
CREATE INDEX IF NOT EXISTS idx_progress_photos_client_id ON progress_photos(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_date ON progress_photos(photo_date);

-- Client Goals table indexes
CREATE INDEX IF NOT EXISTS idx_client_goals_client_id ON client_goals(client_id);

-- Medications and Supplements table indexes
CREATE INDEX IF NOT EXISTS idx_medications_client_id ON medications_supplements(client_id);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date); 
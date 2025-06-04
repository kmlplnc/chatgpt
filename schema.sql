-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (must be created first as it's referenced by other tables)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    subscription_status VARCHAR(50) DEFAULT 'free',
    subscription_plan VARCHAR(50),
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table (depends on users)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    birth_date DATE,
    gender VARCHAR(10),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    target_weight DECIMAL(5,2),
    occupation VARCHAR(255),
    medical_conditions TEXT[],
    allergies TEXT[],
    medications TEXT[],
    notes TEXT,
    client_visible_notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    access_code VARCHAR(6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (depends on users)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Sessions table (depends on clients)
CREATE TABLE client_sessions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Measurements table (depends on clients)
CREATE TABLE measurements (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    bmi DECIMAL(5,2),
    body_fat_percentage DECIMAL(5,2),
    waist_circumference DECIMAL(5,2),
    hip_circumference DECIMAL(5,2),
    chest_circumference DECIMAL(5,2),
    arm_circumference DECIMAL(5,2),
    thigh_circumference DECIMAL(5,2),
    calf_circumference DECIMAL(5,2),
    basal_metabolic_rate DECIMAL(7,2),
    total_daily_energy_expenditure DECIMAL(7,2),
    activity_level VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diet Plans table (depends on clients)
CREATE TABLE diet_plans (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    calorie_goal INTEGER,
    protein_percentage INTEGER,
    carbs_percentage INTEGER,
    fat_percentage INTEGER,
    meals INTEGER DEFAULT 3,
    plan_data JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table (depends on clients and users)
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table (depends on users and clients)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    has_attachments BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attachments table (depends on messages, clients, and users)
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table (depends on users and clients)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    related_id INTEGER,
    scheduled_for TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Notes table (depends on clients and users)
CREATE TABLE client_notes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foods table (independent)
CREATE TABLE foods (
    fdc_id TEXT PRIMARY KEY,
    data_type TEXT,
    description TEXT NOT NULL,
    brand_name TEXT,
    ingredients TEXT,
    serving_size INTEGER,
    serving_size_unit TEXT,
    food_category TEXT,
    published_date TIMESTAMP,
    food_attributes JSONB,
    food_nutrients JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Saved Foods table (depends on users and foods)
CREATE TABLE saved_foods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    fdc_id TEXT REFERENCES foods(fdc_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Food Nutrients table (depends on foods)
CREATE TABLE food_nutrients (
    id SERIAL PRIMARY KEY,
    fdc_id TEXT REFERENCES foods(fdc_id) ON DELETE CASCADE,
    nutrient_id INTEGER,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    unit TEXT NOT NULL,
    percent_daily_value INTEGER
);

-- Food Journals table (depends on clients)
CREATE TABLE food_journals (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('kahvaltı', 'öğle yemeği', 'akşam yemeği', 'ara öğün', 'diğer')),
    food_items JSONB,
    total_calories INTEGER,
    notes TEXT,
    water_intake_ml INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Progress Photos table (depends on clients)
CREATE TABLE progress_photos (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    photo_date DATE NOT NULL,
    photo_type TEXT NOT NULL CHECK (photo_type IN ('ön', 'yan', 'arka', 'tam boy', 'diğer')),
    photo_path TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Client Goals table (depends on clients)
CREATE TABLE client_goals (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('kilo', 'vücut ölçüsü', 'beslenme', 'aktivite', 'diğer')),
    target_value TEXT NOT NULL,
    start_value TEXT,
    current_value TEXT,
    start_date DATE NOT NULL,
    target_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    completion_date DATE,
    progress_percentage INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Medications and Supplements table (depends on clients)
CREATE TABLE medications_supplements (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ilaç', 'takviye', 'vitamin', 'diğer')),
    dosage TEXT,
    frequency TEXT,
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Client Groups table (depends on users)
CREATE TABLE client_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Client Group Members table (depends on client_groups and clients)
CREATE TABLE client_group_members (
    group_id INTEGER NOT NULL REFERENCES client_groups(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (group_id, client_id)
);

-- Payments table (depends on clients)
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    invoice_number TEXT,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('bekleyen', 'tamamlanmış', 'iptal edilmiş', 'iade edilmiş')) DEFAULT 'bekleyen',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_client_id ON messages(client_id);
CREATE INDEX idx_food_journals_client_date ON food_journals(client_id, date);
CREATE INDEX idx_progress_photos_client_date ON progress_photos(client_id, photo_date);
CREATE INDEX idx_client_goals_client_id ON client_goals(client_id);
CREATE INDEX idx_medications_client_id ON medications_supplements(client_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_measurements_client_id ON measurements(client_id);
CREATE INDEX idx_diet_plans_client_id ON diet_plans(client_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_client_id ON notifications(client_id);
CREATE INDEX idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX idx_client_notes_user_id ON client_notes(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_client_sessions_client_id ON client_sessions(client_id);
CREATE INDEX idx_client_sessions_token ON client_sessions(session_token); 
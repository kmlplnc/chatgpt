-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'user',
  subscription_status TEXT DEFAULT 'free' NOT NULL,
  subscription_plan TEXT,
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  gender TEXT NOT NULL,
  height NUMERIC(5,2),
  occupation TEXT,
  medical_conditions TEXT,
  allergies TEXT,
  medications TEXT,
  notes TEXT,
  client_visible_notes TEXT,
  status TEXT DEFAULT 'active' NOT NULL,
  start_date DATE DEFAULT NOW() NOT NULL,
  end_date DATE,
  access_code TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) NOT NULL,
  date DATE DEFAULT NOW() NOT NULL,
  weight NUMERIC(5,2) NOT NULL,
  height NUMERIC(5,2) NOT NULL,
  bmi NUMERIC(5,2) NOT NULL,
  body_fat_percentage NUMERIC(5,2),
  waist_circumference NUMERIC(5,2),
  hip_circumference NUMERIC(5,2),
  chest_circumference NUMERIC(5,2),
  arm_circumference NUMERIC(5,2),
  thigh_circumference NUMERIC(5,2),
  calf_circumference NUMERIC(5,2),
  basal_metabolic_rate INTEGER,
  total_daily_energy_expenditure INTEGER,
  activity_level TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Diet Plans table
CREATE TABLE IF NOT EXISTS diet_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  calorie_goal INTEGER NOT NULL,
  protein_percentage INTEGER NOT NULL,
  carbs_percentage INTEGER NOT NULL,
  fat_percentage INTEGER NOT NULL,
  meals INTEGER NOT NULL,
  include_dessert BOOLEAN DEFAULT FALSE,
  include_snacks BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'draft',
  duration_days INTEGER DEFAULT 7,
  tags TEXT,
  diet_type TEXT,
  content JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Foods table
CREATE TABLE IF NOT EXISTS foods (
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

-- Saved Foods table
CREATE TABLE IF NOT EXISTS saved_foods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  fdc_id TEXT REFERENCES foods(fdc_id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Food Nutrients table
CREATE TABLE IF NOT EXISTS food_nutrients (
  id SERIAL PRIMARY KEY,
  fdc_id TEXT REFERENCES foods(fdc_id),
  nutrient_id INTEGER,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  unit TEXT NOT NULL,
  percent_daily_value INTEGER
);

-- Client Sessions table
CREATE TABLE IF NOT EXISTS client_sessions (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  date TIMESTAMP NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  has_attachments BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  related_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  scheduled_for TIMESTAMP
);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Food Journals table
CREATE TABLE IF NOT EXISTS food_journals (
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

-- Progress Photos table
CREATE TABLE IF NOT EXISTS progress_photos (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  photo_date DATE NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('ön', 'yan', 'arka', 'tam boy', 'diğer')),
  photo_path TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Client Goals table
CREATE TABLE IF NOT EXISTS client_goals (
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

-- Medications and Supplements table
CREATE TABLE IF NOT EXISTS medications_supplements (
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

-- Client Groups table
CREATE TABLE IF NOT EXISTS client_groups (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Client Group Members table
CREATE TABLE IF NOT EXISTS client_group_members (
  group_id INTEGER NOT NULL REFERENCES client_groups(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (group_id, client_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
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
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_food_journals_client_date ON food_journals(client_id, date);
CREATE INDEX IF NOT EXISTS idx_progress_photos_client_date ON progress_photos(client_id, photo_date);
CREATE INDEX IF NOT EXISTS idx_client_goals_client_id ON client_goals(client_id);
CREATE INDEX IF NOT EXISTS idx_medications_client_id ON medications_supplements(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date); 
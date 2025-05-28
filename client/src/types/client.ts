export interface Client {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  gender: "male" | "female";
  height: number;
  occupation: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  medications: string | null;
  notes: string | null;
  client_visible_notes: string | null;
  diet_preferences?: string | null;
  status: "active" | "inactive";
  start_date: string;
  end_date: string | null;
  access_code: string | null;
  created_at: string;
  updated_at: string;
  lastMeasurement?: any; // Optional field for the last measurement
}

export interface Measurement {
  id: number;
  clientId: number;
  date: string;
  weight: number;
  height: number;
  bmi: number;
  bodyFatPercentage?: number;
  waistCircumference?: number;
  hipCircumference?: number;
  chestCircumference?: number;
  armCircumference?: number;
  thighCircumference?: number;
  calfCircumference?: number;
  basalMetabolicRate: number;
  totalDailyEnergyExpenditure: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "veryActive";
  notes?: string;
  // Micro-nutrients
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  thiamin?: number;
  riboflavin?: number;
  niacin?: number;
  vitaminB6?: number;
  folate?: number;
  vitaminB12?: number;
  biotin?: number;
  pantothenicAcid?: number;
  calcium?: number;
  iron?: number;
  magnesium?: number;
  phosphorus?: number;
  zinc?: number;
  potassium?: number;
  sodium?: number;
  copper?: number;
  manganese?: number;
  selenium?: number;
  chromium?: number;
  molybdenum?: number;
  iodine?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: number;
  clientId: number;
  userId?: number;
  date: string;
  time: string;
  duration: number;
  title: string;
  type: string;
  status: 'scheduled' | 'completed' | 'canceled';
  location?: string;
  notes?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  clientId: number;
  content: string;
  fromClient: boolean;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentFormValues {
  date: string;
  time: string;
  duration: string;
  type: string;
  notes?: string;
}

export interface ClientApi {
  getClient: () => Promise<Client>;
  getMeasurements: () => Promise<Measurement[]>;
  getAppointments: () => Promise<Appointment[]>;
  getMessages: () => Promise<Message[]>;
  createMeasurement: (data: Partial<Measurement>) => Promise<Measurement>;
  updateMeasurement: (id: number, data: Partial<Measurement>) => Promise<Measurement>;
  deleteMeasurement: (id: number) => Promise<void>;
  createAppointment: (data: Partial<Appointment>) => Promise<Appointment>;
  updateAppointment: (id: number, data: Partial<Appointment>) => Promise<Appointment>;
  deleteAppointment: (id: number) => Promise<void>;
  sendMessage: (content: string) => Promise<Message>;
  markMessagesAsRead: (messageIds: number[]) => Promise<void>;
  updateClient: (data: Partial<Client>) => Promise<Client>;
  deleteClient: () => Promise<void>;
  generateAccessCode: () => Promise<string>;
} 
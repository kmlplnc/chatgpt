export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: "male" | "female";
  occupation?: string;
  medicalConditions?: string;
  allergies?: string;
  medications?: string;
  status: "active" | "inactive";
  startDate: string;
  endDate?: string;
  notes?: string;
  clientVisibleNotes?: string;
  accessCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Measurement {
  id: number;
  clientId: number;
  date: string;
  weight: string;
  height: string;
  bmi: string;
  bodyFatPercentage?: string;
  waistCircumference?: string;
  hipCircumference?: string;
  chestCircumference?: string;
  armCircumference?: string;
  thighCircumference?: string;
  calfCircumference?: string;
  basalMetabolicRate: number;
  totalDailyEnergyExpenditure: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "veryActive";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: number;
  clientId: number;
  date: string;
  time: string;
  duration: number;
  type: string;
  notes?: string;
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
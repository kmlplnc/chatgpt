export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  gender: 'male' | 'female' | 'other';
  occupation?: string;
  status: 'active' | 'inactive';
  startDate: string;
  endDate?: string;
  medicalConditions?: string;
  allergies?: string;
  medications?: string;
  notes?: string;
  clientVisibleNotes?: string;
  createdAt: string;
  updatedAt: string;
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
  basalMetabolicRate?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: number;
  clientId: number;
  type: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  clientId: number;
  content: string;
  fromClient: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
} 
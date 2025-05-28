export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  gender: 'male' | 'female' | 'other';
  birth_date?: string;
  height?: string;
  occupation?: string;
  medical_conditions?: string;
  allergies?: string;
  medications?: string;
  diet_preferences?: string;
  healthNotes?: string;
  clientVisibleNotes?: string;
  client_visible_notes?: string[];
  access_code?: string;
  created_at: string;
} 
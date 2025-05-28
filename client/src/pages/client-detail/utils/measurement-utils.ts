export function calculateAge(birthDate?: string): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('tr-TR');
};

export function parseWeight(weight: string): number {
  return parseFloat(weight.replace(',', '.'));
}

export function parseHeight(height: string): number {
  return parseFloat(height.replace(',', '.'));
}

export function calculateBmiFromString(weight: string, height: string): string {
  const weightNum = parseWeight(weight);
  const heightNum = parseHeight(height) / 100; // cm to m
  const bmi = weightNum / (heightNum * heightNum);
  return bmi.toFixed(1);
}

export function calculateBmrFromString(weight: string, height: string, age: number, gender: string): number {
  const weightNum = parseWeight(weight);
  const heightNum = parseHeight(height);
  
  // Mifflin-St Jeor Equation
  let bmr = 10 * weightNum + 6.25 * heightNum - 5 * age;
  bmr = gender === 'male' ? bmr + 5 : bmr - 161;
  
  return Math.round(bmr);
}

export function calculateTdeeFromBmr(bmr: number, activityLevel: string): number {
  const activityMultipliers: { [key: string]: number } = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very_active': 1.9
  };
  
  return Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));
}

export function getHealthStatus(bmi: number): { status: string; color: string } {
  if (bmi < 18.5) {
    return { status: 'Zayıf', color: 'text-yellow-500' };
  } else if (bmi < 25) {
    return { status: 'Normal', color: 'text-green-500' };
  } else if (bmi < 30) {
    return { status: 'Fazla Kilolu', color: 'text-orange-500' };
  } else {
    return { status: 'Obez', color: 'text-red-500' };
  }
}

export const getStatusColor = (value: number, bounds: { min: number; max: number; }): string => {
  if (value < bounds.min) return 'text-red-500';
  if (value > bounds.max) return 'text-red-500';
  return 'text-green-500';
};

export const getBMIColor = (bmi: number) => {
  if (bmi < 18.5) return 'text-yellow-500';
  if (bmi < 25) return 'text-green-500';
  if (bmi < 30) return 'text-orange-500';
  return 'text-red-500';
};

export const getBodyFatColor = (bodyFat: number, gender: string) => {
  const ranges = gender === 'male' 
    ? { essential: 2, athletic: 6, fitness: 14, average: 18, high: 25 }
    : { essential: 10, athletic: 14, fitness: 21, average: 25, high: 32 };

  if (bodyFat <= ranges.essential) return 'text-red-500';
  if (bodyFat <= ranges.athletic) return 'text-blue-500';
  if (bodyFat <= ranges.fitness) return 'text-green-500';
  if (bodyFat <= ranges.average) return 'text-yellow-500';
  if (bodyFat <= ranges.high) return 'text-orange-500';
  return 'text-red-500';
};

export function calculateChange(current: number, initial: number) {
  if (!initial) return 0;
  return ((current - initial) / initial) * 100;
}

export const calculateWHR = (waist?: string, hip?: string) => {
  if (!waist || !hip) return null;
  const waistNum = parseFloat(waist.replace(',', '.'));
  const hipNum = parseFloat(hip.replace(',', '.'));
  return waistNum / hipNum;
};

export const getWHRStatus = (whr: number, gender: string) => {
  if (gender === 'male') {
    if (whr < 0.9) return { status: 'Düşük Risk', color: 'text-green-500' };
    if (whr < 1.0) return { status: 'Orta Risk', color: 'text-yellow-500' };
    return { status: 'Yüksek Risk', color: 'text-red-500' };
  } else {
    if (whr < 0.8) return { status: 'Düşük Risk', color: 'text-green-500' };
    if (whr < 0.85) return { status: 'Orta Risk', color: 'text-yellow-500' };
    return { status: 'Yüksek Risk', color: 'text-red-500' };
  }
};

export const getBodyFatStatus = (bf: number, gender: string) => {
  const ranges = gender === 'male'
    ? { essential: 2, athletic: 6, fitness: 14, average: 18, high: 25 }
    : { essential: 10, athletic: 14, fitness: 21, average: 25, high: 32 };

  if (bf <= ranges.essential) return { status: 'Esansiyel Yağ', color: 'text-red-500' };
  if (bf <= ranges.athletic) return { status: 'Atletik', color: 'text-blue-500' };
  if (bf <= ranges.fitness) return { status: 'Fitness', color: 'text-green-500' };
  if (bf <= ranges.average) return { status: 'Ortalama', color: 'text-yellow-500' };
  if (bf <= ranges.high) return { status: 'Yüksek', color: 'text-orange-500' };
  return { status: 'Çok Yüksek', color: 'text-red-500' };
}; 
// Sağlık hesaplamaları için yardımcı fonksiyonlar

// Vücut Kitle İndeksi (BMI/VKİ) hesaplama
export const calculateBMI = (weight: number, height: number): number => {
  if (!weight || !height || height <= 0) return 0;
  const heightInMeters = height / 100; // cm'den metreye çevirme
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(2));
};

// BMI kategorisi belirleme
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "Zayıf";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Fazla Kilolu";
  if (bmi < 35) return "Obez (Sınıf 1)";
  if (bmi < 40) return "Obez (Sınıf 2)";
  return "Aşırı Obez (Sınıf 3)";
};

// Bazal Metabolizma Hızı (BMR/BMH) hesaplama - Mifflin-St Jeor Denklemi
export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: string
): number => {
  if (!weight || !height || !age) return 0;
  
  // Mifflin-St Jeor Denklemi
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  
  if (gender === "male") {
    return Math.round(baseBMR + 5);
  } else {
    return Math.round(baseBMR - 161);
  }
};

// Toplam Günlük Enerji Tüketimi (TDEE) hesaplama
export const calculateTDEE = (bmr: number, activityLevel: string): number => {
  if (!bmr) return 0;
  
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2, // Hareketsiz (ofis işi)
    light: 1.375, // Hafif aktivite (haftada 1-3 gün egzersiz)
    moderate: 1.55, // Orta aktivite (haftada 3-5 gün orta şiddetli egzersiz)
    active: 1.725, // Aktif (haftada 6-7 gün egzersiz)
    very_active: 1.9, // Çok aktif (fiziksel iş veya günde 2x egzersiz)
  };

  const multiplier = activityMultipliers[activityLevel] || 1.2; // Varsayılan olarak hareketsiz
  return Math.round(bmr * multiplier);
};

// Bel-Kalça Oranı (WHR) hesaplama
export const calculateWHR = (waist: number, hip: number): number => {
  if (!waist || !hip || hip <= 0) return 0;
  return Number((waist / hip).toFixed(2));
};

// WHR kategorisi belirleme
export const getWHRCategory = (whr: number, gender: string): string => {
  if (gender === "male") {
    if (whr < 0.85) return "Düşük Risk";
    if (whr < 0.95) return "Orta Risk";
    return "Yüksek Risk";
  } else {
    if (whr < 0.75) return "Düşük Risk";
    if (whr < 0.85) return "Orta Risk";
    return "Yüksek Risk";
  }
};

// Vücut Yağ Yüzdesi kategorisini belirleme
export const getBodyFatCategory = (bodyFatPercentage: number, gender: string): string => {
  if (!bodyFatPercentage) return "Belirsiz";
  
  if (gender === "male") {
    if (bodyFatPercentage < 6) return "Temel";
    if (bodyFatPercentage < 14) return "Atletik";
    if (bodyFatPercentage < 18) return "Fitness";
    if (bodyFatPercentage < 25) return "Ortalama";
    return "Yüksek";
  } else {
    if (bodyFatPercentage < 14) return "Temel";
    if (bodyFatPercentage < 21) return "Atletik";
    if (bodyFatPercentage < 25) return "Fitness";
    if (bodyFatPercentage < 32) return "Ortalama";
    return "Yüksek";
  }
};

// İdeal kilo aralığını hesaplama (BMI 18.5-24.9 aralığı baz alınarak)
export const calculateIdealWeightRange = (height: number): { min: number; max: number } => {
  if (!height || height <= 0) return { min: 0, max: 0 };
  
  const heightInMeters = height / 100; // cm'den metreye çevirme
  const minWeight = Math.round(18.5 * heightInMeters * heightInMeters);
  const maxWeight = Math.round(24.9 * heightInMeters * heightInMeters);
  
  return { min: minWeight, max: maxWeight };
};

// Günlük tahmini kalori ihtiyacı hesaplama (hedef bazlı)
export const calculateCalorieNeeds = (
  tdee: number,
  goal: string
): { maintenance: number; target: number } => {
  if (!tdee) return { maintenance: 0, target: 0 };
  
  const maintenance = tdee;
  let target = maintenance;
  
  switch (goal) {
    case "lose_weight":
      target = Math.round(maintenance * 0.8); // %20 kalori açığı
      break;
    case "maintain":
      target = maintenance;
      break;
    case "gain_weight":
      target = Math.round(maintenance * 1.15); // %15 kalori fazlası
      break;
    case "gain_muscle":
      target = Math.round(maintenance * 1.1); // %10 kalori fazlası
      break;
    default:
      target = maintenance;
  }
  
  return { maintenance, target };
};

// Makro besin oranlarını hesaplama
export const calculateMacros = (
  calories: number,
  goal: string,
  customRatio?: { protein: number; carbs: number; fat: number }
): { protein: number; carbs: number; fat: number; proteinCalories: number; carbsCalories: number; fatCalories: number } => {
  if (!calories) {
    return {
      protein: 0,
      carbs: 0,
      fat: 0,
      proteinCalories: 0,
      carbsCalories: 0,
      fatCalories: 0
    };
  }
  
  // Varsayılan makro oranları (hedef bazlı)
  let proteinRatio = 0.3; // %30
  let carbsRatio = 0.4; // %40
  let fatRatio = 0.3; // %30
  
  if (customRatio) {
    // Özel oranlar belirtilmişse kullan
    proteinRatio = customRatio.protein / 100;
    carbsRatio = customRatio.carbs / 100;
    fatRatio = customRatio.fat / 100;
  } else {
    // Hedef bazlı varsayılan oranlar
    switch (goal) {
      case "lose_weight":
        proteinRatio = 0.4; // %40
        carbsRatio = 0.3; // %30
        fatRatio = 0.3; // %30
        break;
      case "gain_muscle":
        proteinRatio = 0.35; // %35
        carbsRatio = 0.45; // %45
        fatRatio = 0.2; // %20
        break;
      case "maintain":
      default:
        // Varsayılan değerler (yukarıda ayarlandı)
        break;
    }
  }
  
  // Kalori bazlı makro hesaplamaları
  const proteinCalories = Math.round(calories * proteinRatio);
  const carbsCalories = Math.round(calories * carbsRatio);
  const fatCalories = Math.round(calories * fatRatio);
  
  // Gram cinsinden makrolar (protein: 4 kal/g, karbonhidrat: 4 kal/g, yağ: 9 kal/g)
  const protein = Math.round(proteinCalories / 4);
  const carbs = Math.round(carbsCalories / 4);
  const fat = Math.round(fatCalories / 9);
  
  return {
    protein,
    carbs,
    fat,
    proteinCalories,
    carbsCalories,
    fatCalories
  };
};
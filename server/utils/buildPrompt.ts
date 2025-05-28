type ClientData = {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  healthConditions?: string[];
  allergies?: string[];
  medications?: string[];
  dietType?: string;
  dietPreferences?: string[];
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
  bmi?: number;
  bodyFatPercentage?: number;
  basalMetabolicRate?: number;
  totalDailyEnergyExpenditure?: number;
  meals: number;
  sleepTime?: string;
  wakeTime?: string;
  weightGoal?: string;
  exerciseType?: string;
  exerciseFrequency?: string;
  foodLikes?: string;
  foodDislikes?: string;
  dailyWater?: number;
  // Mikro besinler
  vitaminA?: string | number;
  vitaminB12?: string | number;
  vitaminC?: string | number;
  vitaminD?: string | number;
  vitaminE?: string | number;
  vitaminK?: string | number;
  calcium?: string | number;
  iron?: string | number;
  magnesium?: string | number;
  potassium?: string | number;
  sodium?: string | number;
  zinc?: string | number;
  folate?: string | number;
  selenium?: string | number;
  // Çevre ölçümleri
  activityEnvironment?: string;
  lifestyle?: string;
  workType?: string;
  sleepQuality?: string;
  weather?: string;
  stressLevel?: string;
  pollutionLevel?: string;
  otherEnvironment?: string;
};

export function buildPrompt(data: ClientData): string {
  return `
Aşağıdaki bilgilere göre kişiselleştirilmiş bir diyet planı oluştur:

Kişisel Bilgiler:
- İsim: ${data.name}
- Yaş: ${data.age}
- Cinsiyet: ${data.gender}
- Boy: ${data.height} cm
- Kilo: ${data.weight} kg

Sağlık Durumu:
- Sağlık Koşulları: ${data.healthConditions?.join(', ') || 'Yok'}
- Alerjiler: ${data.allergies?.join(', ') || 'Yok'}
- İlaçlar: ${data.medications?.join(', ') || 'Yok'}

Diyet Tercihleri:
- Diyet Tipi: ${data.dietType}
- Diyet Tercihleri: ${data.dietPreferences?.join(', ') || 'Yok'}

Makro Dağılımı:
- Protein: %${data.proteinPercentage}
- Karbonhidrat: %${data.carbsPercentage}
- Yağ: %${data.fatPercentage}

Ölçümler:
- BMI: ${data.bmi}
- Vücut Yağ Oranı: %${data.bodyFatPercentage}
- BMR: ${data.basalMetabolicRate} kcal
- TDEE: ${data.totalDailyEnergyExpenditure} kcal

Mikro Besin Durumu:
- Vitamin A: ${data.vitaminA ?? 'Bilinmiyor'}
- Vitamin B12: ${data.vitaminB12 ?? 'Bilinmiyor'}
- Vitamin C: ${data.vitaminC ?? 'Bilinmiyor'}
- Vitamin D: ${data.vitaminD ?? 'Bilinmiyor'}
- Vitamin E: ${data.vitaminE ?? 'Bilinmiyor'}
- Vitamin K: ${data.vitaminK ?? 'Bilinmiyor'}
- Kalsiyum: ${data.calcium ?? 'Bilinmiyor'}
- Demir: ${data.iron ?? 'Bilinmiyor'}
- Magnezyum: ${data.magnesium ?? 'Bilinmiyor'}
- Potasyum: ${data.potassium ?? 'Bilinmiyor'}
- Sodyum: ${data.sodium ?? 'Bilinmiyor'}
- Çinko: ${data.zinc ?? 'Bilinmiyor'}
- Folat: ${data.folate ?? 'Bilinmiyor'}
- Selenyum: ${data.selenium ?? 'Bilinmiyor'}

Çevre ve Yaşam Tarzı:
- Aktivite Ortamı: ${data.activityEnvironment ?? 'Bilinmiyor'}
- Yaşam Tarzı: ${data.lifestyle ?? 'Bilinmiyor'}
- İş Tipi: ${data.workType ?? 'Bilinmiyor'}
- Uyku Kalitesi: ${data.sleepQuality ?? 'Bilinmiyor'}
- Hava Durumu: ${data.weather ?? 'Bilinmiyor'}
- Stres Seviyesi: ${data.stressLevel ?? 'Bilinmiyor'}
- Kirlilik Seviyesi: ${data.pollutionLevel ?? 'Bilinmiyor'}
- Diğer: ${data.otherEnvironment ?? 'Yok'}

Ek Bilgiler:
- Öğün Sayısı: ${data.meals}
- Uyku Saati: ${data.sleepTime}
- Uyanma Saati: ${data.wakeTime}
- Kilo Hedefi: ${data.weightGoal}
- Egzersiz Tipi: ${data.exerciseType}
- Egzersiz Sıklığı: ${data.exerciseFrequency}
- Sevdiği Yemekler: ${data.foodLikes}
- Sevmediği Yemekler: ${data.foodDislikes}
- Günlük Su: ${data.dailyWater} l

Lütfen cevabını JSON formatında ve detaylı bir diyet planı olarak ver.
`;
} 
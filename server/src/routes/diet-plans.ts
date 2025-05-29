import { Request, Response } from 'express';
import axios from 'axios';
import { storage } from '../../storage';
import { dietRequirementSchema } from '@shared/schema';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Veri dönüştürme yardımcı fonksiyonları
const parseJsonString = (value: any): any => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

const parseNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const parseArray = (value: any): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return value.split(',').map((item: string) => item.trim());
    }
  }
  return [];
};

// Veri dönüştürme fonksiyonu
const transformClientData = (client: any, measurement: any) => {
  return {
    name: `${client.first_name} ${client.last_name}`,
    age: client.birth_date 
      ? Math.floor((new Date().getTime() - new Date(client.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
      : 0,
    gender: client.gender?.toLowerCase() || 'unknown',
    height: parseNumber(measurement.height),
    weight: parseNumber(measurement.weight),
    activityLevel: measurement.activityLevel || "moderate",
    bmi: parseNumber(measurement.bmi),
    bodyFatPercentage: parseNumber(measurement.bodyFatPercentage),
    measurements: {
      waist: parseNumber(measurement.waistCircumference),
      hip: parseNumber(measurement.hipCircumference),
      chest: parseNumber(measurement.chestCircumference),
      arm: parseNumber(measurement.armCircumference),
      thigh: parseNumber(measurement.thighCircumference),
      calf: parseNumber(measurement.calfCircumference),
    },
    metabolicInfo: {
      bmr: parseNumber(measurement.basalMetabolicRate),
      tdee: parseNumber(measurement.totalDailyEnergyExpenditure),
    },
    healthStatus: {
      conditions: parseArray(client.medical_conditions),
      allergies: parseArray(client.allergies),
      medications: parseArray(client.medications),
      dietPreferences: parseArray(client.diet_preferences),
    },
    micronutrients: {
      vitamins: {
        vitaminA: parseNumber(measurement.vitaminA),
        vitaminC: parseNumber(measurement.vitaminC),
        vitaminD: parseNumber(measurement.vitaminD),
        vitaminE: parseNumber(measurement.vitaminE),
        vitaminK: parseNumber(measurement.vitaminK),
        thiamin: parseNumber(measurement.thiamin),
        riboflavin: parseNumber(measurement.riboflavin),
        niacin: parseNumber(measurement.niacin),
        vitaminB6: parseNumber(measurement.vitaminB6),
        folate: parseNumber(measurement.folate),
        vitaminB12: parseNumber(measurement.vitaminB12),
        biotin: parseNumber(measurement.biotin),
        pantothenicAcid: parseNumber(measurement.pantothenicAcid),
      },
      minerals: {
        calcium: parseNumber(measurement.calcium),
        iron: parseNumber(measurement.iron),
        magnesium: parseNumber(measurement.magnesium),
        phosphorus: parseNumber(measurement.phosphorus),
        zinc: parseNumber(measurement.zinc),
        potassium: parseNumber(measurement.potassium),
        sodium: parseNumber(measurement.sodium),
        copper: parseNumber(measurement.copper),
        manganese: parseNumber(measurement.manganese),
        selenium: parseNumber(measurement.selenium),
        chromium: parseNumber(measurement.chromium),
        molybdenum: parseNumber(measurement.molybdenum),
        iodine: parseNumber(measurement.iodine),
      },
    },
  };
};

// Sadece clientId'yi doğrulayan basit bir şema
const dietPlanRequestSchema = z.object({
  clientId: z.string().min(1, "Danışan ID'si gerekli"),
});

export const generateDietPlan = async (req: Request, res: Response) => {
  try {
    console.log('Received request body:', req.body);
    
    // Validate request data
    const validationResult = dietPlanRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return res.status(400).json({
        message: "Geçersiz veri formatı",
        errors: validationResult.error.errors
      });
    }

    const { clientId } = validationResult.data;
    
    // Danışan bilgilerini getir (Prisma ile)
    const client = await prisma.client.findUnique({
      where: { id: parseInt(clientId) },
    });

    if (!client) {
      return res.status(404).json({
        message: "Danışan bulunamadı",
      });
    }

    // Son ölçümü getir (Prisma ile)
    const latestMeasurement = await prisma.measurement.findFirst({
      where: { client_id: parseInt(clientId) },
      orderBy: { date: 'desc' },
    });

    if (!latestMeasurement) {
      return res.status(404).json({
        message: "Danışanın ölçüm bilgileri bulunamadı",
      });
    }

    // Verileri dönüştür
    const clientData = transformClientData(client, latestMeasurement);
    console.log('Transformed client data:', clientData);

    // Gemini API'ye gönderilecek prompt'u oluştur
    const prompt = `
      Aşağıdaki detaylı bilgilere göre kişiselleştirilmiş bir diyet planı oluştur.
      Lütfen yanıtını doğrudan JSON formatında ver, markdown veya başka bir formatlama kullanma.
      
      KİŞİSEL BİLGİLER:
      - İsim: ${clientData.name}
      - Yaş: ${clientData.age}
      - Cinsiyet: ${clientData.gender}
      - Boy: ${clientData.height} cm
      - Kilo: ${clientData.weight} kg
      - VKİ (BMI): ${clientData.bmi}
      - Vücut Yağ Oranı: ${clientData.bodyFatPercentage}%
      
      VÜCUT ÖLÇÜMLERİ:
      - Bel: ${clientData.measurements.waist} cm
      - Kalça: ${clientData.measurements.hip} cm
      - Göğüs: ${clientData.measurements.chest} cm
      - Kol: ${clientData.measurements.arm} cm
      - Bacak: ${clientData.measurements.thigh} cm
      - Baldır: ${clientData.measurements.calf} cm
      
      METABOLİK BİLGİLER:
      - Bazal Metabolizma Hızı (BMR): ${clientData.metabolicInfo.bmr} kcal
      - Günlük Enerji İhtiyacı (TDEE): ${clientData.metabolicInfo.tdee} kcal
      - Aktivite Seviyesi: ${clientData.activityLevel}
      
      SAĞLIK DURUMU:
      - Sağlık Koşulları: ${clientData.healthStatus.conditions.join(', ') || 'Yok'}
      - Alerjiler: ${clientData.healthStatus.allergies.join(', ') || 'Yok'}
      - İlaçlar: ${clientData.healthStatus.medications.join(', ') || 'Yok'}
      - Diyet Tercihleri: ${clientData.healthStatus.dietPreferences.join(', ') || 'Yok'}
      
      MİKROBESİN GEREKSİNİMLERİ:
      Vitaminler:
      - A Vitamini: ${clientData.micronutrients.vitamins.vitaminA} mcg
      - C Vitamini: ${clientData.micronutrients.vitamins.vitaminC} mg
      - D Vitamini: ${clientData.micronutrients.vitamins.vitaminD} mcg
      - E Vitamini: ${clientData.micronutrients.vitamins.vitaminE} mg
      - K Vitamini: ${clientData.micronutrients.vitamins.vitaminK} mcg
      - B1 Vitamini (Tiamin): ${clientData.micronutrients.vitamins.thiamin} mg
      - B2 Vitamini (Riboflavin): ${clientData.micronutrients.vitamins.riboflavin} mg
      - B3 Vitamini (Niasin): ${clientData.micronutrients.vitamins.niacin} mg
      - B6 Vitamini: ${clientData.micronutrients.vitamins.vitaminB6} mg
      - Folat: ${clientData.micronutrients.vitamins.folate} mcg
      - B12 Vitamini: ${clientData.micronutrients.vitamins.vitaminB12} mcg
      - Biotin: ${clientData.micronutrients.vitamins.biotin} mcg
      - Pantotenik Asit: ${clientData.micronutrients.vitamins.pantothenicAcid} mg
      
      Mineraller:
      - Kalsiyum: ${clientData.micronutrients.minerals.calcium} mg
      - Demir: ${clientData.micronutrients.minerals.iron} mg
      - Magnezyum: ${clientData.micronutrients.minerals.magnesium} mg
      - Fosfor: ${clientData.micronutrients.minerals.phosphorus} mg
      - Çinko: ${clientData.micronutrients.minerals.zinc} mg
      - Potasyum: ${clientData.micronutrients.minerals.potassium} mg
      - Sodyum: ${clientData.micronutrients.minerals.sodium} mg
      - Bakır: ${clientData.micronutrients.minerals.copper} mcg
      - Manganez: ${clientData.micronutrients.minerals.manganese} mg
      - Selenyum: ${clientData.micronutrients.minerals.selenium} mcg
      - Krom: ${clientData.micronutrients.minerals.chromium} mcg
      - Molibden: ${clientData.micronutrients.minerals.molybdenum} mcg
      - İyot: ${clientData.micronutrients.minerals.iodine} mcg
      
      Lütfen bu bilgilere göre detaylı bir diyet planı oluştur. Plan şunları içermeli:
      1. Günlük kalori hedefi ve makro besin dağılımı
      2. Her öğün için önerilen yemekler ve porsiyonlar
      3. Öğün zamanlaması
      4. Su tüketimi önerileri
      5. Özel notlar ve uyarılar
      6. Mikrobesin gereksinimlerini karşılayacak besin önerileri
      7. Sağlık durumuna özel öneriler
      8. Alerjilere ve ilaçlara dikkat edilmesi gereken noktalar

      Yanıtını aşağıdaki JSON formatında ver (markdown veya başka formatlama kullanma):
      {
        "description": "Kısa özet buraya",
        "dailyCalories": 2000,
        "macros": {
          "protein": 150,
          "carbs": 200,
          "fat": 67
        },
        "meals": [
          {
            "name": "Kahvaltı",
            "time": "08:00",
            "foods": [
              {
                "name": "Yulaf Ezmesi",
                "portion": "50g",
                "calories": 300,
                "macros": {
                  "protein": 10,
                  "carbs": 50,
                  "fat": 5
                },
                "micronutrients": {
                  "vitamins": {
                    "vitaminA": 0,
                    "vitaminC": 0,
                    // ... diğer vitaminler
                  },
                  "minerals": {
                    "calcium": 50,
                    "iron": 2,
                    // ... diğer mineraller
                  }
                }
              }
            ]
          }
        ],
        "waterIntake": "2.5 litre",
        "notes": "Özel notlar buraya",
        "healthConsiderations": [
          "Sağlık durumuna özel öneriler"
        ],
        "allergyWarnings": [
          "Alerjilere dikkat edilmesi gereken noktalar"
        ],
        "medicationInteractions": [
          "İlaç etkileşimlerine dikkat edilmesi gereken noktalar"
        ]
      }
    `;

    console.log('Gemini API isteği gönderiliyor...');
    const API_KEY = process.env.GOOGLE_API_KEY;
    const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    const body = {
      contents: [
        { parts: [{ text: prompt }] }
      ]
    };

    const response = await axios.post(`${GEMINI_URL}?key=${API_KEY}`, body, {
      timeout: 60000 // 60 saniye timeout
    });

    console.log('Gemini API yanıtı alındı');
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up the response text
    const cleanText = text
      .replace(/```json\n?|\n?```/g, '') // Remove markdown code blocks
      .replace(/^[\s\n]+|[\s\n]+$/g, '') // Trim whitespace and newlines
      .replace(/^[^{]*({.*})[^}]*$/, '$1'); // Extract just the JSON object if there's extra text
    
    // JSON formatındaki yanıtı parse et
    let planContent;
    try {
      planContent = JSON.parse(cleanText);
      console.log('Diyet planı JSON parse edildi');
    } catch (e) {
      console.warn('JSON parse hatası:', e);
      console.log('Raw response:', text);
      console.log('Cleaned response:', cleanText);
      
      // Try to fix common JSON formatting issues
      try {
        const fixedText = cleanText
          .replace(/(\w+):/g, '"$1":') // Add quotes to property names
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
        
        planContent = JSON.parse(fixedText);
        console.log('Diyet planı düzeltilmiş JSON ile parse edildi');
      } catch (fixError) {
        console.error('JSON düzeltme denemesi başarısız:', fixError);
        planContent = {
          description: "Diyet planı oluşturulurken bir hata oluştu",
          error: "JSON parse hatası",
          rawContent: text
        };
      }
    }

    // Veritabanına kaydet (Prisma ile)
    console.log('Diyet planı veritabanına kaydediliyor...');
    const savedPlan = await prisma.dietPlan.create({
      data: {
        client_id: parseInt(clientId),
        name: `${clientData.name} için Diyet Planı`,
        description: typeof planContent === 'object' ? planContent.description : text.split('\n')[0],
        calorie_goal: clientData.metabolicInfo.tdee || 0,
        protein_percentage: 30, // Varsayılan değerler
        carbs_percentage: 40,
        fat_percentage: 30,
        meals: 3,
        plan_data: typeof planContent === 'object' ? planContent : text,
      }
    });
    console.log('Diyet planı başarıyla kaydedildi, ID:', savedPlan.id);
    res.status(201).json(savedPlan);
  } catch (error: any) {
    console.error('Diyet planı oluşturma hatası:', error?.response?.data || error.message);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    
    // Hata mesajını daha açıklayıcı hale getir
    let errorMessage = "Diyet planı oluşturulurken bir hata oluştu";
    if (error?.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: error?.response?.data || error.message
    });
  }
};

// Tüm diyet planlarını getir
export const getDietPlans = async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    console.log('Session user id:', userId); // Kullanıcı id'sini logla
    if (!userId) {
      return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
    }

    const plans = await storage.getUserDietPlans(userId);
    res.json(plans);
  } catch (error: any) {
    console.error('Diyet planları getirme hatası:', error);
    res.status(500).json({ 
      message: "Diyet planları getirilirken bir hata oluştu",
      error: error.message
    });
  }
};

// Tek bir diyet planını getir
export const getDietPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
    }

    const plan = await storage.getDietPlan(Number(id));
    if (!plan) {
      return res.status(404).json({ message: "Diyet planı bulunamadı" });
    }

    // Kullanıcının kendi planına eriştiğinden emin ol
    if (plan.userId !== userId) {
      return res.status(403).json({ message: "Bu diyet planına erişim izniniz yok" });
    }

    res.json(plan);
  } catch (error: any) {
    console.error('Diyet planı getirme hatası:', error);
    res.status(500).json({ 
      message: "Diyet planı getirilirken bir hata oluştu",
      error: error.message
    });
  }
}; 
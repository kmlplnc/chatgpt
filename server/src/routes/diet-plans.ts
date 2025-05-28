import { Request, Response } from 'express';
import axios from 'axios';
import { storage } from '../../storage';

export const generateDietPlan = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log('Diyet planı oluşturma isteği:', data);

    // Gemini API'ye gönderilecek prompt'u oluştur
    const prompt = `
      Aşağıdaki bilgilere göre kişiselleştirilmiş bir diyet planı oluştur:
      
      Kişisel Bilgiler:
      - İsim: ${data.name}
      - Yaş: ${data.age}
      - Cinsiyet: ${data.gender}
      - Boy: ${data.height} cm
      - Kilo: ${data.weight} kg
      - Aktivite Seviyesi: ${data.activityLevel}
      
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
      
      Lütfen cevabının başında 1-2 cümlelik kısa bir özet (description) ver, ardından detaylı diyet planını ekle.
      Lütfen aşağıdaki formatta detaylı bir diyet planı oluştur:
      1. Günlük kalori hedefi ve makro dağılımı
      2. Her öğün için önerilen yemekler ve porsiyonlar
      3. Öğün zamanlaması
      4. Su tüketimi önerileri
      5. Egzersiz önerileri
      6. Özel notlar ve uyarılar

      Lütfen yanıtını JSON formatında ver. Örnek format:
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
                "calories": 300
              }
            ]
          }
        ],
        "waterIntake": "2.5 litre",
        "exercise": {
          "type": "Yürüyüş",
          "duration": "30 dakika",
          "frequency": "Her gün"
        },
        "notes": "Özel notlar buraya"
      }
    `;

    const API_KEY = process.env.GOOGLE_API_KEY;
    const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    const body = {
      contents: [
        { parts: [{ text: prompt }] }
      ]
    };
    const response = await axios.post(`${GEMINI_URL}?key=${API_KEY}`, body);
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Gemini yanıtı:', text);

    // JSON formatındaki yanıtı parse et
    let planContent;
    try {
      planContent = JSON.parse(text);
    } catch (e) {
      // JSON parse edilemezse, metni olduğu gibi kullan
      planContent = text;
    }

    // Veritabanına kaydet
    const savedPlan = await storage.createDietPlan({
      userId: req.session?.user?.id || null,
      name: data.name,
      description: typeof planContent === 'object' ? planContent.description : text.split('\n')[0],
      calorieGoal: data.calorieGoal || 0,
      proteinPercentage: data.proteinPercentage,
      carbsPercentage: data.carbsPercentage,
      fatPercentage: data.fatPercentage,
      meals: data.meals,
      includeDessert: data.includeDessert,
      includeSnacks: data.includeSnacks,
      status: "active",
      durationDays: 7,
      tags: data.dietType || "",
      dietType: data.dietType,
      content: typeof planContent === 'object' ? JSON.stringify(planContent) : planContent, // Tüm içeriği JSON string olarak kaydet
    });

    res.status(201).json(savedPlan);
  } catch (error: any) {
    console.error('Diyet planı oluşturma hatası:', error?.response?.data || error.message);
    try { console.error('JSON.stringify:', JSON.stringify(error, null, 2)); } catch(e) {}
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    res.status(500).json({ 
      message: "Diyet planı oluşturulurken bir hata oluştu",
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
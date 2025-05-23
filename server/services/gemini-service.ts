import { GoogleGenerativeAI } from "@google/generative-ai";
import type { DietRequirement } from "@shared/schema";

interface GeminiResponse {
  text(): string;
}

interface GeminiResult {
  response: GeminiResponse;
}

interface MealAnalysis {
  macronutrients: {
    protein: number;
    carbs: number;
    fat: number;
  };
  calories: number;
  nutrients: string[];
  benefits: string[];
  improvements: string[];
  rawText?: string;
}

interface DietTips {
  tips: string[];
  summary: string;
}

interface DietPlanContent {
  summary?: string;
  [key: string]: any;
}

// Google Gemini API modelini kullanacak servis
class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: string = "gemini-1.5-pro"; // En güncel Gemini modeli

  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY çevre değişkeni ayarlanmamış");
    }
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }

  // Diyet planı oluşturma
  async generateDietPlan(requirements: DietRequirement) {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `Create a personalized diet plan based on the following requirements:
        Name: ${requirements.name}
        Age: ${requirements.age}
        Gender: ${requirements.gender}
        Height: ${requirements.height} cm
        Weight: ${requirements.weight} kg
        Activity Level: ${requirements.activityLevel}
        Diet Type: ${requirements.dietType}
        Allergies: ${requirements.allergies?.join(", ") || "None"}
        Health Conditions: ${requirements.healthConditions?.join(", ") || "None"}
        
        Please provide a detailed diet plan including:
        1. Daily calorie target
        2. Macronutrient distribution
        3. Meal timing and frequency
        4. Food recommendations
        5. Portion sizes
        6. Hydration guidelines
        7. Any specific considerations based on the provided information`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        data: text,
      };
    } catch (error) {
      console.error("Error generating diet plan:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  // Öğün besin değerlerini analiz etme
  async analyzeMeal(mealDescription: string): Promise<MealAnalysis> {
    try {
      // API anahtarı geçerliliğini kontrol et
      if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === "GOOGLE_API_KEY") {
        throw new Error("Google Gemini API anahtarı geçersiz veya ayarlanmamış. Lütfen geçerli bir API anahtarı ekleyin.");
      }
      
      const model = this.genAI.getGenerativeModel({ model: this.model });
      
      const prompt = `
        Aşağıdaki öğünün besin değerlerini analiz et:
        
        "${mealDescription}"
        
        Şunları içeren detaylı bir analiz sağla:
        1. Tahmini makro besinler (protein, karbonhidrat, yağ - gram cinsinden)
        2. Tahmini kalori miktarı
        3. İçerdiği temel besin öğeleri
        4. Sağlık faydaları
        5. Potansiyel iyileştirmeler
        
        Yanıtını şu anahtarları içeren bir JSON nesnesi olarak formatla: macronutrients (protein, carbs, fat içeren bir nesne), calories, nutrients (dizi), benefits (dizi), improvements (dizi).
      `;
      
      const result = await model.generateContent(prompt) as GeminiResult;
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text) as MealAnalysis;
      } catch (parseError) {
        console.error("JSON parse hatası:", parseError);
        return {
          macronutrients: { protein: 0, carbs: 0, fat: 0 },
          calories: 0,
          nutrients: ["Belirlenemedi"],
          benefits: ["Belirlenemedi"],
          improvements: ["Belirlenemedi"],
          rawText: text
        };
      }
    } catch (error) {
      console.error("Gemini öğün analizi hatası:", error);
      
      // API anahtarı hatası için daha kullanıcı dostu bir mesaj
      if (error.message?.includes("API key not valid") || 
          error.message?.includes("API_KEY_INVALID") ||
          error.message?.includes("anahtarı geçersiz")) {
        throw new Error("Google Gemini API anahtarı geçersiz. Sistem yöneticinize başvurun ve yeni bir API anahtarı talep edin.");
      }
      
      throw new Error(`Öğün analizi yapılamadı: ${error.message}`);
    }
  }

  // Diyet tavsiyeleri üretme
  async generateDietTips(context: string): Promise<DietTips> {
    try {
      // API anahtarı geçerliliğini kontrol et
      if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === "GOOGLE_API_KEY") {
        throw new Error("Google Gemini API anahtarı geçersiz veya ayarlanmamış. Lütfen geçerli bir API anahtarı ekleyin.");
      }
      
      const model = this.genAI.getGenerativeModel({ model: this.model });
      
      const prompt = `
        Aşağıdaki bağlama dayalı kişiselleştirilmiş diyet tavsiyeleri sağla:
        
        "${context}"
        
        Kanıta dayalı ve uygulanabilir 5 spesifik beslenme tavsiyesi oluştur.
        Yanıtını şu anahtarları içeren bir JSON nesnesi olarak formatla: tips (dizi), summary (string).
      `;
      
      const result = await model.generateContent(prompt) as GeminiResult;
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text) as DietTips;
      } catch (parseError) {
        console.error("JSON parse hatası:", parseError);
        return {
          tips: ["Belirlenemedi"],
          summary: text
        };
      }
    } catch (error) {
      console.error("Gemini diyet tavsiyeleri üretme hatası:", error);
      
      // API anahtarı hatası için daha kullanıcı dostu bir mesaj
      if (error.message?.includes("API key not valid") || 
          error.message?.includes("API_KEY_INVALID") ||
          error.message?.includes("anahtarı geçersiz")) {
        throw new Error("Google Gemini API anahtarı geçersiz. Sistem yöneticinize başvurun ve yeni bir API anahtarı talep edin.");
      }
      
      throw new Error(`Diyet tavsiyeleri oluşturulamadı: ${error.message}`);
    }
  }

  // Diyet planı prompt'u oluşturma yardımcı metodu
  private buildDietPlanPrompt(requirements: DietRequirement): string {
    return `
      Aşağıdaki gereksinimlere göre detaylı bir 7 günlük diyet planı oluştur:
      
      Kişisel Bilgiler:
      - İsim: ${requirements.name}
      - Yaş: ${requirements.age}
      - Cinsiyet: ${requirements.gender}
      - Boy: ${requirements.height} cm
      - Kilo: ${requirements.weight} kg
      - Aktivite Seviyesi: ${requirements.activityLevel}
      
      Diyet Gereksinimleri:
      - Diyet Türü: ${requirements.dietType}
      - Kalori Hedefi: ${requirements.calorieGoal || "profile'a göre hesaplanmış"}
      - Makro Besin Dağılımı: Protein %${requirements.proteinPercentage}, Karbonhidrat %${requirements.carbsPercentage}, Yağ %${requirements.fatPercentage}
      - Günlük Öğün Sayısı: ${requirements.meals}
      - Atıştırmalık İçersin mi: ${requirements.includeSnacks ? "Evet" : "Hayır"}
      - Tatlı İçersin mi: ${requirements.includeDessert ? "Evet" : "Hayır"}
      
      ${requirements.allergies ? `Alerjiler/İntoleranslar: ${requirements.allergies}` : ""}
      ${requirements.healthConditions ? `Sağlık Durumları: ${requirements.healthConditions}` : ""}
      
      Her gün için şunları sağla:
      1. Günün öğünlerinin özeti
      2. Porsiyon boyutlarıyla detaylı öğün planı
      3. Her öğün için toplam kalori ve makro besinler
      4. Günlük toplam beslenme özeti
      
      Yanıtını şu anahtarları içeren bir JSON nesnesi olarak formatla:
      - summary (string): Diyet planının kısa genel bakışı
      - days (dizi): Her biri şunları içeren 7 günlük nesnelerden oluşan bir dizi:
        - dayNumber (sayı)
        - meals (dizi): Şunları içeren öğün nesnelerinin dizisi:
          - name (string): Öğünün adı (örn. Kahvaltı, Öğle Yemeği)
          - foods (dizi): Şunları içeren yiyecek öğelerinin dizisi:
            - name (string): Yiyeceğin adı
            - portion (string): Porsiyon boyutu
            - calories (sayı): Tahmini kaloriler
            - protein (sayı): Gram cinsinden protein
            - carbs (sayı): Gram cinsinden karbonhidrat
            - fat (sayı): Gram cinsinden yağ
          - totalCalories (sayı): Öğün için toplam kaloriler
          - totalProtein (sayı): Öğün için toplam protein
          - totalCarbs (sayı): Öğün için toplam karbonhidrat
          - totalFat (sayı): Öğün için toplam yağ
        - dailyTotals (nesne):
          - calories (sayı)
          - protein (sayı)
          - carbs (sayı)
          - fat (sayı)
      - nutritionTips (dizi): Bu plana özgü diyet tavsiyeleriyle dizi
    `;
  }

  // Diyet planı için etiketler oluşturma yardımcı metodu
  private generateTags(requirements: DietRequirement): string[] {
    const tags: string[] = [requirements.dietType];
    
    // Aktivite seviyesi etiketi ekleme
    tags.push(requirements.activityLevel);
    
    // Makro odaklı etiket ekleme
    if (requirements.proteinPercentage >= 30) {
      tags.push("yüksek-protein");
    }
    if (requirements.carbsPercentage <= 25) {
      tags.push("düşük-karbonhidrat");
    }
    if (requirements.fatPercentage >= 40) {
      tags.push("yüksek-yağ");
    }
    
    // Özel durum etiketleri varsa ekleme
    if (requirements.healthConditions) {
      const conditions = requirements.healthConditions.toLowerCase();
      if (conditions.includes("diyabet")) tags.push("diyabet-dostu");
      if (conditions.includes("kalp") || conditions.includes("kardiyovasküler")) tags.push("kalp-sağlığı");
      if (conditions.includes("tansiyon") || conditions.includes("hipertansiyon")) tags.push("düşük-sodyum");
    }
    
    return tags;
  }
}

// Singleton örneği oluştur ve dışa aktar
export const geminiService = new GeminiService();
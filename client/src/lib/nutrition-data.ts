export interface NutrientRequirement {
  name: string;
  unit: string;
  dailyValue: number;
  criticalLevel: number; // Uyarı verilecek minimum seviye
  healthConditionWarnings?: {
    [key: string]: {
      message: string;
      criticalLevel: number;
      recommendations?: string[];
    };
  };
  dietSpecificWarnings?: {
    [key: string]: {
      message: string;
      criticalLevel: number;
      recommendations?: string[];
    };
  };
  absorptionFactors?: {
    increases?: string[];
    decreases?: string[];
  };
}

export interface DietType {
  id: string;
  name: string;
  description: string;
  criticalNutrients: string[]; // Özel dikkat edilmesi gereken besinler
  recommendations?: string[];
}

export interface HealthCondition {
  id: string;
  name: string;
  description: string;
  criticalNutrients: string[];
  restrictedNutrients: string[];
  recommendations: string[];
}

export const HEALTH_CONDITIONS: HealthCondition[] = [
  {
    id: 'diabetes',
    name: 'Diyabet',
    description: 'Kan şekeri düzenlemesi gerektiren metabolik durum',
    criticalNutrients: ['Fiber', 'Magnesium', 'Chromium', 'Vitamin D'],
    restrictedNutrients: ['Sodium', 'SaturatedFat', 'AddedSugar'],
    recommendations: [
      'Düşük glisemik indeksli besinler tercih edilmeli',
      'Öğünler arası 2-3 saat olmalı',
      'Kompleks karbonhidratlar tercih edilmeli'
    ]
  },
  {
    id: 'hypertension',
    name: 'Hipertansiyon',
    description: 'Yüksek tansiyon durumu',
    criticalNutrients: ['Potassium', 'Magnesium', 'Calcium'],
    restrictedNutrients: ['Sodium', 'Alcohol'],
    recommendations: [
      'Sodyum alımı günlük 1500mg altında olmalı',
      'Potasyum açısından zengin besinler tüketilmeli',
      'DASH diyeti prensipleri uygulanmalı'
    ]
  },
  {
    id: 'metabolicSyndrome',
    name: 'Metabolik Sendrom',
    description: 'Metabolik bozuklukların bir arada görüldüğü durum',
    criticalNutrients: ['Fiber', 'Omega3', 'Vitamin D', 'Magnesium'],
    restrictedNutrients: ['SaturatedFat', 'TransFat', 'AddedSugar', 'Sodium'],
    recommendations: [
      'Düşük glisemik indeksli besinler tercih edilmeli',
      'Omega-3 yağ asitleri alımı artırılmalı',
      'İşlenmiş gıdalardan kaçınılmalı'
    ]
  }
];

export const DIET_TYPES: DietType[] = [
  {
    id: 'vegan',
    name: 'Vegan',
    description: 'Hiçbir hayvansal ürün içermeyen beslenme',
    criticalNutrients: ['B12', 'D', 'Iron', 'Zinc', 'Calcium', 'Omega3', 'Iodine'],
    recommendations: [
      'B12 takviyesi alınmalı',
      'D vitamini seviyesi düzenli kontrol edilmeli',
      'Demir emilimini artırmak için C vitamini alımına dikkat edilmeli',
      'Kalsiyum kaynakları çeşitlendirilmeli',
      'Omega-3 için keten tohumu, chia tohumu ve ceviz tüketilmeli'
    ]
  },
  {
    id: 'vegetarian',
    name: 'Vejetaryen',
    description: 'Süt ürünleri ve yumurta içeren, et içermeyen beslenme',
    criticalNutrients: ['B12', 'Iron', 'Zinc', 'Omega3'],
    recommendations: [
      'B12 seviyesi düzenli kontrol edilmeli',
      'Demir emilimini artırmak için C vitamini alımına dikkat edilmeli',
      'Çinko kaynakları çeşitlendirilmeli'
    ]
  },
  {
    id: 'keto',
    name: 'Ketojenik',
    description: 'Düşük karbonhidrat, yüksek yağ içeren beslenme',
    criticalNutrients: ['Fiber', 'Magnesium', 'Potassium', 'Sodium'],
    recommendations: [
      'Elektrolit dengesi korunmalı',
      'Lif alımı için düşük karbonhidratlı sebzeler tüketilmeli',
      'Su tüketimi artırılmalı'
    ]
  },
  {
    id: 'paleo',
    name: 'Paleo',
    description: 'İşlenmemiş, doğal besinlere dayalı beslenme',
    criticalNutrients: ['Calcium', 'Vitamin D', 'Fiber'],
    recommendations: [
      'Kalsiyum kaynakları çeşitlendirilmeli',
      'D vitamini seviyesi düzenli kontrol edilmeli',
      'Lif alımı için sebze ve meyve tüketimi artırılmalı'
    ]
  }
];

export const NUTRIENT_REQUIREMENTS: { [key: string]: NutrientRequirement } = {
  // Vitaminler
  'A': {
    name: 'A Vitamini',
    unit: 'mcg',
    dailyValue: 900,
    criticalLevel: 600,
    healthConditionWarnings: {
      'diabetes': {
        message: 'A vitamini seviyesi düzenli kontrol edilmeli',
        criticalLevel: 700,
        recommendations: ['Beta-karoten kaynakları tercih edilmeli']
      }
    },
    dietSpecificWarnings: {
      'vegan': {
        message: 'Beta-karoten kaynaklarına dikkat edilmeli',
        criticalLevel: 700,
        recommendations: ['Havuç, balkabağı, tatlı patates tüketimi artırılmalı']
      }
    }
  },
  'C': {
    name: 'C Vitamini',
    unit: 'mg',
    dailyValue: 90,
    criticalLevel: 60,
    healthConditionWarnings: {
      'diabetes': {
        message: 'C vitamini alımı artırılmalı',
        criticalLevel: 100,
        recommendations: ['Antioksidan etkisi için yeterli alım önemli']
      }
    }
  },
  'D': {
    name: 'D Vitamini',
    unit: 'mcg',
    dailyValue: 20,
    criticalLevel: 15,
    healthConditionWarnings: {
      'diabetes': {
        message: 'D vitamini seviyesi düzenli kontrol edilmeli',
        criticalLevel: 20,
        recommendations: ['Güneş ışığına maruziyet artırılmalı']
      }
    },
    dietSpecificWarnings: {
      'vegan': {
        message: 'D vitamini takviyesi önerilir',
        criticalLevel: 20,
        recommendations: ['D2 veya D3 takviyesi alınmalı']
      }
    }
  },
  'E': {
    name: 'E Vitamini',
    unit: 'mg',
    dailyValue: 15,
    criticalLevel: 10
  },
  'K': {
    name: 'K Vitamini',
    unit: 'mcg',
    dailyValue: 120,
    criticalLevel: 80
  },
  'B1': {
    name: 'B1 Vitamini (Tiamin)',
    unit: 'mg',
    dailyValue: 1.2,
    criticalLevel: 0.8
  },
  'B2': {
    name: 'B2 Vitamini (Riboflavin)',
    unit: 'mg',
    dailyValue: 1.3,
    criticalLevel: 0.9
  },
  'B3': {
    name: 'B3 Vitamini (Niasin)',
    unit: 'mg',
    dailyValue: 16,
    criticalLevel: 12
  },
  'B6': {
    name: 'B6 Vitamini',
    unit: 'mg',
    dailyValue: 1.7,
    criticalLevel: 1.2
  },
  'B12': {
    name: 'B12 Vitamini',
    unit: 'mcg',
    dailyValue: 2.4,
    criticalLevel: 1.8,
    healthConditionWarnings: {
      'diabetes': {
        message: 'B12 seviyesi düzenli kontrol edilmeli',
        criticalLevel: 2.4,
        recommendations: ['Metformin kullanımı B12 emilimini etkileyebilir']
      }
    },
    dietSpecificWarnings: {
      'vegan': {
        message: 'B12 takviyesi önerilir',
        criticalLevel: 2.4,
        recommendations: ['Günlük B12 takviyesi alınmalı']
      },
      'vegetarian': {
        message: 'B12 seviyesi düzenli kontrol edilmeli',
        criticalLevel: 2.0,
        recommendations: ['Süt ürünleri ve yumurta tüketimi artırılmalı']
      }
    }
  },
  'Folate': {
    name: 'Folat',
    unit: 'mcg',
    dailyValue: 400,
    criticalLevel: 300
  },

  // Mineraller
  'Calcium': {
    name: 'Kalsiyum',
    unit: 'mg',
    dailyValue: 1000,
    criticalLevel: 800,
    healthConditionWarnings: {
      'hypertension': {
        message: 'Kalsiyum alımı önemli',
        criticalLevel: 1000,
        recommendations: ['DASH diyeti prensipleri uygulanmalı']
      }
    },
    dietSpecificWarnings: {
      'vegan': {
        message: 'Kalsiyum takviyesi gerekebilir',
        criticalLevel: 900,
        recommendations: [
          'Kalsiyum içeren bitkisel kaynaklar çeşitlendirilmeli',
          'Kalsiyum takviyesi düşünülebilir'
        ]
      }
    }
  },
  'Iron': {
    name: 'Demir',
    unit: 'mg',
    dailyValue: 18,
    criticalLevel: 12,
    absorptionFactors: {
      increases: ['Vitamin C'],
      decreases: ['Kalsiyum', 'Çay', 'Kahve']
    },
    healthConditionWarnings: {
      'diabetes': {
        message: 'Demir seviyesi düzenli kontrol edilmeli',
        criticalLevel: 15,
        recommendations: ['Hemorokromatozis riski açısından dikkatli olunmalı']
      }
    },
    dietSpecificWarnings: {
      'vegan': {
        message: 'Demir emilimini artırmak için C vitamini alımına dikkat edilmeli',
        criticalLevel: 15,
        recommendations: [
          'Demir içeren besinler C vitamini ile tüketilmeli',
          'Çay ve kahve yemeklerden 2 saat sonra içilmeli'
        ]
      }
    }
  },
  'Magnesium': {
    name: 'Magnezyum',
    unit: 'mg',
    dailyValue: 420,
    criticalLevel: 320
  },
  'Phosphorus': {
    name: 'Fosfor',
    unit: 'mg',
    dailyValue: 700,
    criticalLevel: 500
  },
  'Potassium': {
    name: 'Potasyum',
    unit: 'mg',
    dailyValue: 3500,
    criticalLevel: 2800
  },
  'Sodium': {
    name: 'Sodyum',
    unit: 'mg',
    dailyValue: 2300,
    criticalLevel: 1500
  },
  'Zinc': {
    name: 'Çinko',
    unit: 'mg',
    dailyValue: 11,
    criticalLevel: 8,
    dietSpecificWarnings: {
      'vegan': {
        message: 'Çinko takviyesi gerekebilir',
        criticalLevel: 10
      },
      'vegetarian': {
        message: 'Çinko seviyesi düzenli kontrol edilmeli',
        criticalLevel: 9
      }
    }
  },
  'Selenium': {
    name: 'Selenyum',
    unit: 'mcg',
    dailyValue: 55,
    criticalLevel: 40
  },
  'Copper': {
    name: 'Bakır',
    unit: 'mg',
    dailyValue: 0.9,
    criticalLevel: 0.7
  },
  'Manganese': {
    name: 'Manganez',
    unit: 'mg',
    dailyValue: 2.3,
    criticalLevel: 1.8
  },
  'Chromium': {
    name: 'Krom',
    unit: 'mcg',
    dailyValue: 35,
    criticalLevel: 25
  },
  'Molybdenum': {
    name: 'Molibden',
    unit: 'mcg',
    dailyValue: 45,
    criticalLevel: 35
  },
  'Iodine': {
    name: 'İyot',
    unit: 'mcg',
    dailyValue: 150,
    criticalLevel: 120
  }
};

// Besin değerlerini hesaplamak için yardımcı fonksiyonlar
export function calculateNutrientPercentage(
  currentValue: number,
  requirement: NutrientRequirement
): number {
  return (currentValue / requirement.dailyValue) * 100;
}

export function getNutrientStatus(
  currentValue: number,
  requirement: NutrientRequirement,
  dietType?: string,
  healthConditions?: string[]
): {
  status: 'success' | 'warning' | 'critical';
  message?: string;
  recommendations?: string[];
} {
  const percentage = calculateNutrientPercentage(currentValue, requirement);
  let status: 'success' | 'warning' | 'critical' = 'success';
  let message: string | undefined;
  let recommendations: string[] = [];

  // Sağlık durumlarına göre kontrol
  if (healthConditions) {
    for (const condition of healthConditions) {
      const warning = requirement.healthConditionWarnings?.[condition];
      if (warning && percentage < warning.criticalLevel) {
        status = 'critical';
        message = warning.message;
        recommendations = warning.recommendations || [];
        break;
      }
    }
  }

  // Diyet tipine göre kontrol
  if (dietType && requirement.dietSpecificWarnings?.[dietType]) {
    const dietWarning = requirement.dietSpecificWarnings[dietType];
    if (percentage < dietWarning.criticalLevel) {
      status = 'critical';
      message = dietWarning.message;
      recommendations = [...recommendations, ...(dietWarning.recommendations || [])];
    }
  }

  // Genel kontrol
  if (status !== 'critical' && percentage < requirement.criticalLevel) {
    status = 'warning';
    message = `Önerilen değerin ${percentage.toFixed(0)}%'i karşılandı`;
  }

  return { status, message, recommendations };
}

// Besin değerlerini toplamak için yardımcı fonksiyon
export function sumNutrients(nutrients: Array<{ [key: string]: number }>): { [key: string]: number } {
  return nutrients.reduce((acc, curr) => {
    Object.entries(curr).forEach(([key, value]) => {
      acc[key] = (acc[key] || 0) + value;
    });
    return acc;
  }, {} as { [key: string]: number });
}

// Besin emilimini etkileyen faktörleri kontrol et
export function checkAbsorptionFactors(
  nutrient: string,
  mealNutrients: { [key: string]: number }
): { increases: string[]; decreases: string[] } {
  const requirement = NUTRIENT_REQUIREMENTS[nutrient];
  if (!requirement?.absorptionFactors) return { increases: [], decreases: [] };

  const factors = requirement.absorptionFactors;
  const presentInMeal = {
    increases: factors.increases?.filter(factor => mealNutrients[factor]) || [],
    decreases: factors.decreases?.filter(factor => mealNutrients[factor]) || []
  };

  return presentInMeal;
} 
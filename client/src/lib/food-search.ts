import { toast } from "react-hot-toast";

export interface Micronutrient {
  value: number | null;
  unit: string;
  percent: number | null;
}

export interface Micronutrients {
  vitamins: {
    a: Micronutrient;
    c: Micronutrient;
    d: Micronutrient;
    e: Micronutrient;
    k: Micronutrient;
    b1: Micronutrient;
    b2: Micronutrient;
    b3: Micronutrient;
    b6: Micronutrient;
    b12: Micronutrient;
    folate: Micronutrient;
  };
  minerals: {
    iron: Micronutrient;
    magnesium: Micronutrient;
    phosphorus: Micronutrient;
    potassium: Micronutrient;
    calcium: Micronutrient;
    zinc: Micronutrient;
    sodium: Micronutrient;
    copper: Micronutrient;
    manganese: Micronutrient;
    selenium: Micronutrient;
    molybdenum: Micronutrient;
    iodine: Micronutrient;
    chromium: Micronutrient;
  };
}

export interface FoodSearchResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  micronutrients: Micronutrients;
}

// FatSecret API için gerekli bilgiler
const FATSECRET_API_KEY = '3da68e90d639401d9e7d3f2c93a4678c';
const FATSECRET_API_SECRET = '20b14eb83d9e4002a322dc6c292aaebSS1S';
const FATSECRET_API_URL = 'https://platform.fatsecret.com/rest/server.api';

interface OAuthParams {
  oauth_consumer_key: string;
  oauth_nonce: string;
  oauth_signature_method: string;
  oauth_timestamp: string;
  oauth_version: string;
  format: string;
  method: string;
  [key: string]: string; // Diğer parametreler için
}

// API isteği için gerekli parametreleri oluştur
const generateOAuthParams = (method: string): OAuthParams => {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = Math.random().toString(36).substring(2, 15);

  return {
    oauth_consumer_key: FATSECRET_API_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp.toString(),
    oauth_version: '1.0',
    format: 'json',
    method: method
  };
};

// OAuth imzası oluştur
const generateOAuthSignature = (params: OAuthParams, method: string, url: string): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc: Record<string, string>, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

  const paramString = Object.entries(sortedParams)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(FATSECRET_API_SECRET)}&`;

  // HMAC-SHA1 imzası oluştur
  const signature = require('crypto')
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  return signature;
};

// Besin ara
export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  if (!query.trim()) return [];

  try {
    const params = generateOAuthParams('foods.search');
    params.query = query;

    const signature = generateOAuthSignature(params, 'GET', FATSECRET_API_URL);
    params.oauth_signature = signature;

    const response = await fetch(`${FATSECRET_API_URL}?${new URLSearchParams(params)}`);
    const data = await response.json();

    if (data.foods?.food) {
      return data.foods.food.map((food: any) => ({
        id: food.food_id,
        name: food.food_name,
        calories: parseFloat(food.food_description.match(/Calories: (\d+)/)?.[1] || '0'),
        protein: parseFloat(food.food_description.match(/Protein: (\d+(\.\d+)?)g/)?.[1] || '0'),
        carbs: parseFloat(food.food_description.match(/Carbs: (\d+(\.\d+)?)g/)?.[1] || '0'),
        fat: parseFloat(food.food_description.match(/Fat: (\d+(\.\d+)?)g/)?.[1] || '0'),
        servingSize: parseFloat(food.food_description.match(/Serving Size: (\d+(\.\d+)?)/)?.[1] || '100'),
        servingUnit: food.food_description.match(/Serving Size: \d+(\.\d+)?\s*(\w+)/)?.[2] || 'g'
      }));
    }

    return [];
  } catch (error) {
    console.error('Besin arama hatası:', error);
    toast.error('Besin bilgileri alınırken bir hata oluştu');
    return [];
  }
}

// Besin detaylarını getir
export async function getFoodDetails(foodId: string): Promise<FoodSearchResult | null> {
  try {
    const params = generateOAuthParams('food.get');
    params.food_id = foodId;

    const signature = generateOAuthSignature(params, 'GET', FATSECRET_API_URL);
    params.oauth_signature = signature;

    const response = await fetch(`${FATSECRET_API_URL}?${new URLSearchParams(params)}`);
    const data = await response.json();

    if (data.food) {
      const food = data.food;
      return {
        id: food.food_id,
        name: food.food_name,
        calories: parseFloat(food.food_description.match(/Calories: (\d+)/)?.[1] || '0'),
        protein: parseFloat(food.food_description.match(/Protein: (\d+(\.\d+)?)g/)?.[1] || '0'),
        carbs: parseFloat(food.food_description.match(/Carbs: (\d+(\.\d+)?)g/)?.[1] || '0'),
        fat: parseFloat(food.food_description.match(/Fat: (\d+(\.\d+)?)g/)?.[1] || '0'),
        servingSize: parseFloat(food.food_description.match(/Serving Size: (\d+(\.\d+)?)/)?.[1] || '100'),
        servingUnit: food.food_description.match(/Serving Size: \d+(\.\d+)?\s*(\w+)/)?.[2] || 'g'
      };
    }

    return null;
  } catch (error) {
    console.error('Besin detayları alma hatası:', error);
    toast.error('Besin detayları alınırken bir hata oluştu');
    return null;
  }
}

// Besin detaylarını parse et
function parseFoodDetails(food: any): FoodSearchResult {
  const servingSize = parseFloat(food.serving_size) || 100;
  const servingUnit = food.serving_unit || 'g';

  // Vitamin ve mineral değerlerini parse et
  const vitamins = {
    a: parseNutrient(food.vitamin_a, 'IU', 5000),
    c: parseNutrient(food.vitamin_c, 'mg', 90),
    d: parseNutrient(food.vitamin_d, 'IU', 600),
    e: parseNutrient(food.vitamin_e, 'mg', 15),
    k: parseNutrient(food.vitamin_k, 'mcg', 120),
    b1: parseNutrient(food.thiamin, 'mg', 1.2),
    b2: parseNutrient(food.riboflavin, 'mg', 1.3),
    b3: parseNutrient(food.niacin, 'mg', 16),
    b6: parseNutrient(food.vitamin_b6, 'mg', 1.7),
    b12: parseNutrient(food.vitamin_b12, 'mcg', 2.4),
    folate: parseNutrient(food.folate, 'mcg', 400)
  };

  const minerals = {
    iron: parseNutrient(food.iron, 'mg', 18),
    magnesium: parseNutrient(food.magnesium, 'mg', 420),
    phosphorus: parseNutrient(food.phosphorus, 'mg', 700),
    potassium: parseNutrient(food.potassium, 'mg', 3500),
    calcium: parseNutrient(food.calcium, 'mg', 1000),
    zinc: parseNutrient(food.zinc, 'mg', 11),
    sodium: parseNutrient(food.sodium, 'mg', 2300),
    copper: parseNutrient(food.copper, 'mg', 0.9),
    manganese: parseNutrient(food.manganese, 'mg', 2.3),
    selenium: parseNutrient(food.selenium, 'mcg', 55),
    molybdenum: parseNutrient(food.molybdenum, 'mcg', 45),
    iodine: parseNutrient(food.iodine, 'mcg', 150),
    chromium: parseNutrient(food.chromium, 'mcg', 35)
  };

  return {
    id: food.food_id,
    name: food.food_name,
    calories: parseFloat(food.calories) || 0,
    protein: parseFloat(food.protein) || 0,
    carbs: parseFloat(food.carbohydrate) || 0,
    fat: parseFloat(food.fat) || 0,
    servingSize,
    servingUnit,
    micronutrients: {
      vitamins,
      minerals
    }
  };
}

// Besin değerini parse et
function parseNutrient(value: any, unit: string, dailyValue: number): Micronutrient {
  if (!value || isNaN(parseFloat(value))) {
    return { value: null, unit, percent: null };
  }

  const numValue = parseFloat(value);
  const percent = Math.round((numValue / dailyValue) * 100);

  return {
    value: numValue,
    unit,
    percent
  };
} 
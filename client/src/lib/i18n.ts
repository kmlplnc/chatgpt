// Translation dictionaries
const foodTranslations: Record<string, Record<string, string>> = {
  tr: {
    // Food categories
    "Vegetables": "Sebzeler",
    "Fruits": "Meyveler",
    "Meat": "Et",
    "Fish": "Balık",
    "Dairy": "Süt Ürünleri",
    "Grains": "Tahıllar",
    "Legumes": "Baklagiller",
    "Nuts": "Kuruyemişler",
    "Seeds": "Tohumlar",
    "Herbs": "Otlar",
    "Spices": "Baharatlar",
    "Oils": "Yağlar",
    "Beverages": "İçecekler",
    "Snacks": "Atıştırmalıklar",
    "Desserts": "Tatlılar",
    
    // Common food items
    "Apple": "Elma",
    "Banana": "Muz",
    "Orange": "Portakal",
    "Chicken": "Tavuk",
    "Beef": "Dana Eti",
    "Salmon": "Somon",
    "Rice": "Pirinç",
    "Bread": "Ekmek",
    "Milk": "Süt",
    "Yogurt": "Yoğurt",
    "Cheese": "Peynir",
    "Egg": "Yumurta",
    "Olive Oil": "Zeytinyağı",
    "Water": "Su",
    "Coffee": "Kahve",
    "Tea": "Çay",
  },
  en: {
    // English translations (identity mapping)
    "Vegetables": "Vegetables",
    "Fruits": "Fruits",
    "Meat": "Meat",
    "Fish": "Fish",
    "Dairy": "Dairy",
    "Grains": "Grains",
    "Legumes": "Legumes",
    "Nuts": "Nuts",
    "Seeds": "Seeds",
    "Herbs": "Herbs",
    "Spices": "Spices",
    "Oils": "Oils",
    "Beverages": "Beverages",
    "Snacks": "Snacks",
    "Desserts": "Desserts",
    
    // Common food items
    "Apple": "Apple",
    "Banana": "Banana",
    "Orange": "Orange",
    "Chicken": "Chicken",
    "Beef": "Beef",
    "Salmon": "Salmon",
    "Rice": "Rice",
    "Bread": "Bread",
    "Milk": "Milk",
    "Yogurt": "Yogurt",
    "Cheese": "Cheese",
    "Egg": "Egg",
    "Olive Oil": "Olive Oil",
    "Water": "Water",
    "Coffee": "Coffee",
    "Tea": "Tea",
  }
};

const uiTranslations: Record<string, Record<string, string>> = {
  tr: {
    // Common UI elements
    "Add": "Ekle",
    "Remove": "Kaldır",
    "Edit": "Düzenle",
    "Delete": "Sil",
    "Save": "Kaydet",
    "Cancel": "İptal",
    "Search": "Ara",
    "Filter": "Filtrele",
    "Sort": "Sırala",
    "View": "Görüntüle",
    "Details": "Detaylar",
    "Close": "Kapat",
    "Submit": "Gönder",
    "Loading": "Yükleniyor...",
    "Error": "Hata",
    "Success": "Başarılı",
    "Warning": "Uyarı",
    "Info": "Bilgi",
    
    // Food card specific
    "Calories": "Kalori",
    "Protein": "Protein",
    "Carbs": "Karbonhidrat",
    "Fat": "Yağ",
    "Fiber": "Lif",
    "Sugar": "Şeker",
    "Sodium": "Sodyum",
    "per serving": "porsiyon başına",
    "Serving Size": "Porsiyon Miktarı",
    "Nutrition Facts": "Besin Değerleri",
    "Ingredients": "İçindekiler",
    "Allergens": "Alerjenler",
    "Add to Saved": "Kaydedilenlere Ekle",
    "Remove from Saved": "Kaydedilenlerden Çıkar",
  },
  en: {
    // English translations (identity mapping)
    "Add": "Add",
    "Remove": "Remove",
    "Edit": "Edit",
    "Delete": "Delete",
    "Save": "Save",
    "Cancel": "Cancel",
    "Search": "Search",
    "Filter": "Filter",
    "Sort": "Sort",
    "View": "View",
    "Details": "Details",
    "Close": "Close",
    "Submit": "Submit",
    "Loading": "Loading...",
    "Error": "Error",
    "Success": "Success",
    "Warning": "Warning",
    "Info": "Info",
    
    // Food card specific
    "Calories": "Calories",
    "Protein": "Protein",
    "Carbs": "Carbs",
    "Fat": "Fat",
    "Fiber": "Fiber",
    "Sugar": "Sugar",
    "Sodium": "Sodium",
    "per serving": "per serving",
    "Serving Size": "Serving Size",
    "Nutrition Facts": "Nutrition Facts",
    "Ingredients": "Ingredients",
    "Allergens": "Allergens",
    "Add to Saved": "Add to Saved",
    "Remove from Saved": "Remove from Saved",
  }
};

// Get current language from localStorage or default to 'en'
const getCurrentLanguage = (): string => {
  return localStorage.getItem('language') || 'en';
};

// Translate food items
export function translateFood(key: string): string {
  const lang = getCurrentLanguage();
  return foodTranslations[lang]?.[key] || key;
}

// Translate UI elements
export function translateUI(key: string): string {
  const lang = getCurrentLanguage();
  return uiTranslations[lang]?.[key] || key;
}

// Set language
export function setLanguage(lang: string): void {
  if (foodTranslations[lang] && uiTranslations[lang]) {
    localStorage.setItem('language', lang);
  }
}

// Get available languages
export function getAvailableLanguages(): string[] {
  return Object.keys(foodTranslations);
} 
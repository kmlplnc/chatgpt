import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number with commas for thousands
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format date to display in a human-friendly format
export function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// Calculate BMI based on weight in kg and height in cm
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

// Get BMI category
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

// Calculate daily calorie needs using Harris-Benedict equation
export function calculateDailyCalories(
  age: number,
  gender: "male" | "female",
  weightKg: number,
  heightCm: number,
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active"
): number {
  // Base BMR calculation using Harris-Benedict equation
  let bmr;
  
  if (gender === "male") {
    bmr = 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);
  }
  
  // Activity multiplier
  const activityMultipliers = {
    sedentary: 1.2,        // Little or no exercise
    light: 1.375,          // Light exercise 1-3 days/week
    moderate: 1.55,        // Moderate exercise 3-5 days/week
    active: 1.725,         // Hard exercise 6-7 days/week
    very_active: 1.9       // Very hard exercise & physical job or 2x training
  };
  
  return Math.round(bmr * activityMultipliers[activityLevel]);
}

// Calculate macronutrient distribution
export function calculateMacros(
  calories: number,
  proteinPercentage: number,
  carbPercentage: number,
  fatPercentage: number
) {
  const proteinCals = calories * (proteinPercentage / 100);
  const carbCals = calories * (carbPercentage / 100);
  const fatCals = calories * (fatPercentage / 100);
  
  return {
    proteinGrams: Math.round(proteinCals / 4),
    carbGrams: Math.round(carbCals / 4),
    fatGrams: Math.round(fatCals / 9),
  };
}

// Truncate text to specified length
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// Get a CSS color variable value
export function getCSSVar(variable: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable);
}

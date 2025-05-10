import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates BMI (Body Mass Index)
 * @param weight Weight in kg
 * @param height Height in cm
 * @returns BMI value
 */
export function calculateBMI(weight: number, height: number): number {
  // BMI = weight(kg) / (height(m) * height(m))
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

/**
 * Formats a date string to a localized format
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "Belirtilmemiş";
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch (error) {
    return dateString.toString();
  }
}

/**
 * Calculates BMH (Bazal Metabolizma Hızı - Basal Metabolic Rate) using the Mifflin-St Jeor Equation
 * @param weight Weight in kg
 * @param height Height in cm
 * @param age Age in years
 * @param gender 'male' or 'female'
 * @returns BMH value in calories
 */
export function calculateBMH(
  weight: number,
  height: number,
  age: number,
  gender: "male" | "female"
): number {
  // Mifflin-St Jeor Equation
  // BMH (men) = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
  // BMH (women) = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
  
  const commonCalculation = 10 * weight + 6.25 * height - 5 * age;
  
  return gender === "male"
    ? commonCalculation + 5
    : commonCalculation - 161;
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use calculateBMH instead
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: "male" | "female"
): number {
  return calculateBMH(weight, height, age, gender);
}

/**
 * Calculates TDEE (Total Daily Energy Expenditure) based on BMH and activity level
 * @param bmh Bazal Metabolizma Hızı (Basal Metabolic Rate)
 * @param activityLevel Activity level factor
 * @returns TDEE value in calories
 */
export function calculateTDEE(bmh: number, activityLevel: string): number {
  // Activity level multipliers
  const activityMultipliers: {[key: string]: number} = {
    sedentary: 1.2, // Little or no exercise
    light: 1.375, // Light exercise 1-3 days/week
    moderate: 1.55, // Moderate exercise 3-5 days/week
    active: 1.725, // Heavy exercise 6-7 days/week
    very_active: 1.9, // Very heavy exercise, physical job or training twice a day
  };
  
  const multiplier = activityMultipliers[activityLevel] || 1.2;
  return bmh * multiplier;
}

/**
 * Gets a color class based on BMI value
 * @param bmi BMI value
 * @returns CSS color class
 */
export function getBMIColorClass(bmi: number): string {
  if (bmi < 18.5) return "text-blue-500"; // Underweight
  if (bmi < 25) return "text-green-500"; // Normal
  if (bmi < 30) return "text-yellow-500"; // Overweight
  if (bmi < 35) return "text-orange-500"; // Obese Class I
  if (bmi < 40) return "text-red-500"; // Obese Class II
  return "text-red-700"; // Obese Class III
}

/**
 * Gets BMI category text based on BMI value
 * @param bmi BMI value
 * @returns BMI category text
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Zayıf";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Kilolu";
  if (bmi < 35) return "Obez - I";
  if (bmi < 40) return "Obez - II";
  return "Aşırı Obez - III";
}
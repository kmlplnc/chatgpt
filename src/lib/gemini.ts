import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

// Service account credentials
const credentials = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'service-account.json'), 'utf-8')
);

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(credentials.client_email);

// Function to generate text using Gemini
export async function generateText(prompt: string): Promise<string> {
  try {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    throw error;
  }
}

// Function to analyze images using Gemini
export async function analyzeImage(imagePath: string, prompt: string): Promise<string> {
  try {
    // For image analysis, use the gemini-pro-vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    // Read the image file
    const imageBytes = fs.readFileSync(imagePath);

    // Generate content from image and prompt
    const result = await model.generateContent([prompt, imageBytes]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    throw error;
  }
} 
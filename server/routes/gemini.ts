import { Router } from 'express';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = Router();
const API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro-vision-latest:generateContent';
const GEMINI_VISION_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';

// Text generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const body = {
      contents: [
        { parts: [{ text: prompt }] }
      ]
    };
    const response = await axios.post(`${GEMINI_URL}?key=${API_KEY}`, body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Gemini generate error:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

// Image analysis endpoint
router.post('/analyze-image', async (req, res) => {
  try {
    const { imagePath, prompt } = req.body;
    if (!imagePath || !prompt) {
      return res.status(400).json({ error: 'Image path and prompt are required' });
    }
    const fs = await import('fs');
    const imageBytes = fs.readFileSync(imagePath);
    const body = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: imageBytes.toString('base64'),
                mimeType: 'image/jpeg'
              }
            },
            { text: prompt }
          ]
        }
      ]
    };
    const response = await axios.post(`${GEMINI_VISION_URL}?key=${API_KEY}`, body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in /analyze-image endpoint:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to analyze image', details: error?.response?.data || error.message });
  }
});

export default router; 
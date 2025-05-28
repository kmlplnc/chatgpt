import { Router } from 'express';
import { generateText, analyzeImage } from '../../lib/gemini';

const router = Router();

// Text generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await generateText(prompt);
    res.json({ response });
  } catch (error) {
    console.error('Error in /generate endpoint:', error);
    res.status(500).json({ error: 'Failed to generate text' });
  }
});

// Image analysis endpoint
router.post('/analyze-image', async (req, res) => {
  try {
    const { imagePath, prompt } = req.body;
    
    if (!imagePath || !prompt) {
      return res.status(400).json({ error: 'Image path and prompt are required' });
    }

    const response = await analyzeImage(imagePath, prompt);
    res.json({ response });
  } catch (error) {
    console.error('Error in /analyze-image endpoint:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

export default router; 
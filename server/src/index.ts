import express from 'express';
import { generateDietPlan, getDietPlans, getDietPlan } from './routes/diet-plans';

const app = express();
app.use(express.json());

// Diyet planı route'ları
app.post('/api/generate/diet-plan', generateDietPlan);
app.get('/api/diet-plans', getDietPlans);
app.get('/api/diet-plans/:id', getDietPlan);

// Diğer route'lar buraya eklenebilir

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 
import express from 'express';

const app = express();
app.use(express.json());

// Diyet planı route'ları

// Diğer route'lar buraya eklenebilir

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 
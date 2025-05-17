import { Router } from "express";
import fetch from "node-fetch";

export const fatsecretRouter = Router();

let fatsecretToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getFatSecretToken() {
  if (fatsecretToken && Date.now() < tokenExpiresAt) return fatsecretToken;

  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(
        process.env.FATSECRET_CLIENT_ID + ":" + process.env.FATSECRET_CLIENT_SECRET
      ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials&scope=basic"
  });
  const data = await res.json();
  fatsecretToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // 1dk erken bitir
  return fatsecretToken;
}

// Arama endpoint'i
fatsecretRouter.get("/search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "query parametresi gerekli" });

  const token = await getFatSecretToken();
  const apiRes = await fetch(`https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query as string)}&format=json`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await apiRes.json();
  res.json(data);
});

// Detay endpoint'i
fatsecretRouter.get("/food", async (req, res) => {
  const { food_id } = req.query;
  if (!food_id) return res.status(400).json({ error: "food_id parametresi gerekli" });

  const token = await getFatSecretToken();
  const apiRes = await fetch(`https://platform.fatsecret.com/rest/server.api?method=food.get&food_id=${encodeURIComponent(food_id as string)}&format=json`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await apiRes.json();
  res.json(data);
}); 
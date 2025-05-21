import { Router } from "express";
import { storage } from "../storage";

const userRouter = Router();

userRouter.get("/premium-status", async (req, res) => {
  if (!req.session?.user) {
    return res.json({ isPremium: false });
  }
  const user = await storage.getUser(req.session.user.id);
  const isPremium = user?.subscription_status === "active" && user?.subscription_plan === "premium";
  res.json({ isPremium });
});

export default userRouter; 
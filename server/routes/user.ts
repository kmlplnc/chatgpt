import { Router } from "express";
import { storage } from "../storage";

const userRouter = Router();

userRouter.get("/premium-status", async (req, res) => {
  if (!req.session?.user) {
    return res.json({ isPremium: false });
  }
  const user = await storage.getUser(req.session.user.id);
  const isPremium = user?.subscriptionStatus === "active" && user?.subscriptionPlan === "premium";
  res.json({ isPremium });
});

export default userRouter; 
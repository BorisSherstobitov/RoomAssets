import { Router } from "express";
import { listAssets } from "../data/assets.repo.js";

export const assetsRouter = Router();

assetsRouter.get("/", (req, res) => {
  const items = listAssets();
  res.json({ items, page: 1, total: items.length });
});

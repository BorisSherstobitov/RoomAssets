import { Router } from "express";
import { listRooms } from "../data/rooms.repo.js";

export const roomsRouter = Router();

roomsRouter.get("/", (_req, res) => {
  const items = listRooms();
  res.json({ items, page: 1, total: items.length });
});

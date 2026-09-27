import express from "express";
import cors from "cors";
import "./data/db.js";
import "./data/seed.js";
import { roomsRouter } from "./routes/rooms.js";
import { assetsRouter } from "./routes/assets.js";
import { bookingsRouter } from "./routes/bookings.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

// CORS_ORIGIN может содержать несколько адресов через запятую
// (напр. GitHub Pages + локальная разработка)
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/rooms", roomsRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/bookings", bookingsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND" });
});

app.listen(PORT, () => {
  console.log(`[server] Room & Assets API запущен на порту ${PORT}`);
});

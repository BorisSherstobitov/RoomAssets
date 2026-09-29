import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  listBookings, getBooking, insertBooking, updateBookingById, deleteBookingById, replaceAllBookings,
} from "../data/bookings.repo.js";
import { findOverlappingBookings } from "../utils/overlap.js";

export const bookingsRouter = Router();

// 1. Базовая объектная схема — без .superRefine, чтобы работал .partial()
const bookingObjectSchema = z.object({
  resourceType: z.enum(["room", "asset"]),
  resourceId: z.string().min(1),
  title: z.string().min(1),
  start: z.string().datetime(), // ISO-8601 / RFC 3339
  end: z.string().datetime(),
  notes: z.string().optional(),
});

// 2. Схема для POST: объект + проверка, что start < end (Zod v4: superRefine принимает один аргумент — callback)
const bookingInputSchema = bookingObjectSchema.superRefine((b, ctx) => {
  if (new Date(b.start) >= new Date(b.end)) {
    ctx.addIssue({
      code: "custom",
      message: "start должен быть раньше end",
      path: ["end"],
    });
  }
});

// 3. Схема для PUT: сначала partial (это ZodObject), потом refine
const bookingUpdateSchema = bookingObjectSchema.partial().superRefine((b, ctx) => {
  // Проверяем только если оба поля присутствуют в патче
  if (b.start && b.end && new Date(b.start) >= new Date(b.end)) {
    ctx.addIssue({
      code: "custom",
      message: "start должен быть раньше end",
      path: ["end"],
    });
  }
});

// GET /api/bookings?q=&from=&to=&date=&resourceType=&resourceId=
// from/to (ISO) — период; возвращаются брони, пересекающиеся с ним. date (YYYY-MM-DD) — сутки по UTC.
bookingsRouter.get("/", (req, res) => {
  const { q, date, from, to, resourceType, resourceId } = req.query;
  const items = listBookings({
    q: typeof q === "string" ? q : undefined,
    date: typeof date === "string" ? date : undefined,
    from: typeof from === "string" ? from : undefined,
    to: typeof to === "string" ? to : undefined,
    resourceType: resourceType === "room" || resourceType === "asset" ? resourceType : undefined,
    resourceId: typeof resourceId === "string" ? resourceId : undefined,
  });
  res.json({ items, page: 1, total: items.length });
});

// POST /api/bookings — создание с проверкой пересечений (Task_1.pdf п.1)
bookingsRouter.post("/", (req, res) => {
  const parsed = bookingInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const conflicts = findOverlappingBookings(listBookings(), parsed.data);
  if (conflicts.length > 0) {
    return res.status(409).json({
      error: "BOOKING_OVERLAP",
      message: "Интервал пересекается с существующей бронью этого ресурса",
      conflicts,
    });
  }

  const booking = { ...parsed.data, id: nanoid(10) };
  insertBooking(booking);
  res.status(201).json(booking);
});

// PUT /api/bookings/:id — редактирование с проверкой пересечений (исключая саму себя)
bookingsRouter.put("/:id", (req, res) => {
  const existing = getBooking(req.params.id);
  if (!existing) return res.status(404).json({ error: "NOT_FOUND" });

  const parsed = bookingUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const candidate = { ...existing, ...parsed.data };
  const conflicts = findOverlappingBookings(listBookings(), candidate, existing.id);
  if (conflicts.length > 0) {
    return res.status(409).json({
      error: "BOOKING_OVERLAP",
      message: "Интервал пересекается с существующей бронью этого ресурса",
      conflicts,
    });
  }

  const updated = updateBookingById(req.params.id, parsed.data);
  res.json(updated);
});

// DELETE /api/bookings/:id
bookingsRouter.delete("/:id", (req, res) => {
  const existing = getBooking(req.params.id);
  if (!existing) return res.status(404).json({ error: "NOT_FOUND" });
  deleteBookingById(req.params.id);
  res.status(204).send();
});

// POST /api/bookings/import — массовая замена (используется фронтом при импорте JSON)
const importSchema = z.array(z.object({
  id: z.string(),
  resourceType: z.enum(["room", "asset"]),
  resourceId: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  notes: z.string().optional(),
}));

bookingsRouter.post("/import", (req, res) => {
  const parsed = importSchema.safeParse(req.body.bookings);
  if (!parsed.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }
  replaceAllBookings(parsed.data);
  res.json({ imported: parsed.data.length });
});
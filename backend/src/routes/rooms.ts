import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  listRooms, getRoom, insertRoom, updateRoom, deleteRoomWithBookings, roomIdExists, roomCodeTaken,
  replaceAllRooms,
} from "../data/rooms.repo.js";
import { countBookingsByResource } from "../data/bookings.repo.js";

export const roomsRouter = Router();

// Вручную можно выставить только "available" или "maintenance".
// "booked" вычисляется автоматически по таблице броней и в API не принимается.
const roomFields = z.object({
  code: z.string().trim().min(1, "Укажите номер аудитории").max(20, "Номер аудитории слишком длинный"),
  name: z.string().trim().min(1, "Укажите название аудитории").max(100, "Название слишком длинное"),
  capacity: z.number().int("Вместимость должна быть целым числом").min(1, "Вместимость должна быть не меньше 1").max(100000, "Слишком большая вместимость"),
  equipment: z
    .array(z.string().trim().min(1).max(40))
    .max(30)
    .transform((items) => [...new Set(items)]),
  status: z.enum(["available", "maintenance"], { message: "Допустимые статусы: available, maintenance" }),
});

const roomCreateSchema = roomFields.extend({
  equipment: roomFields.shape.equipment.default([]),
  status: roomFields.shape.status.default("available"),
});

const roomUpdateSchema = roomFields.partial();

function validationError(res: import("express").Response, error: z.ZodError) {
  return res.status(400).json({
    error: "VALIDATION_ERROR",
    message: error.issues[0]?.message ?? "Некорректные данные",
    details: error.flatten(),
  });
}

// GET /api/rooms — статус "booked" вычисляется на момент запроса
roomsRouter.get("/", (_req, res) => {
  const items = listRooms();
  res.json({ items, page: 1, total: items.length });
});

// POST /api/rooms — создание аудитории
roomsRouter.post("/", (req, res) => {
  const parsed = roomCreateSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  if (roomCodeTaken(parsed.data.code)) {
    return res.status(409).json({ error: "CODE_EXISTS", message: `Аудитория с номером «${parsed.data.code}» уже существует` });
  }

  // id = номер аудитории (как в начальных данных), если он "безопасный" и свободен
  const preferredId = /^[\w-]+$/.test(parsed.data.code) && !roomIdExists(parsed.data.code) ? parsed.data.code : nanoid(10);
  const room = insertRoom({ id: preferredId, ...parsed.data });
  res.status(201).json(room);
});

// PUT /api/rooms/:id — редактирование (можно передавать часть полей)
roomsRouter.put("/:id", (req, res) => {
  const existing = getRoom(req.params.id);
  if (!existing) return res.status(404).json({ error: "NOT_FOUND" });

  const parsed = roomUpdateSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  if (parsed.data.code !== undefined && roomCodeTaken(parsed.data.code, existing.id)) {
    return res.status(409).json({ error: "CODE_EXISTS", message: `Аудитория с номером «${parsed.data.code}» уже существует` });
  }

  const updated = updateRoom(existing.id, parsed.data);
  res.json(updated);
});

// DELETE /api/rooms/:id[?force=true]
// Если у аудитории есть брони — 409 HAS_BOOKINGS; с force=true аудитория удаляется вместе с бронями.
roomsRouter.delete("/:id", (req, res) => {
  const existing = getRoom(req.params.id);
  if (!existing) return res.status(404).json({ error: "NOT_FOUND" });

  const bookingsCount = countBookingsByResource("room", existing.id);
  if (bookingsCount > 0 && req.query.force !== "true") {
    return res.status(409).json({
      error: "HAS_BOOKINGS",
      message: `У аудитории есть брони (${bookingsCount}). Они будут удалены вместе с ней.`,
      bookingsCount,
    });
  }

  deleteRoomWithBookings(existing.id);
  res.status(204).send();
});

// POST /api/rooms/import — полная замена таблицы аудиторий (используется фронтом при импорте JSON).
// Тело: { "rooms": [ { id?, code, name, capacity, equipment?, status? }, ... ] }.
// Статус приводится к ручному: "maintenance" остаётся, всё остальное (в т.ч. "booked") -> "available".
// Аудитории, которых нет в файле, удаляются вместе со своими бронями.
const roomImportItem = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  code: roomFields.shape.code,
  name: roomFields.shape.name,
  capacity: roomFields.shape.capacity,
  equipment: roomFields.shape.equipment.default([]),
  status: z.string().optional(),
});
const roomImportSchema = z.array(roomImportItem).max(5000);

roomsRouter.post("/import", (req, res) => {
  const parsed = roomImportSchema.safeParse(req.body?.rooms);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const idx = typeof issue?.path[0] === "number" ? `Запись №${issue.path[0] + 1}: ` : "";
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: issue ? `${idx}${issue.message}` : "Ожидается массив rooms",
      details: parsed.error.flatten(),
    });
  }

  const usedIds = new Set<string>();
  const usedCodes = new Set<string>();
  const items = [];
  for (const r of parsed.data) {
    if (usedCodes.has(r.code)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: `В файле повторяется номер аудитории «${r.code}»` });
    }
    usedCodes.add(r.code);

    let id = r.id;
    if (!id) id = /^[\w-]+$/.test(r.code) && !usedIds.has(r.code) ? r.code : nanoid(10);
    if (usedIds.has(id)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: `В файле повторяется id «${id}»` });
    }
    usedIds.add(id);

    items.push({
      id,
      code: r.code,
      name: r.name,
      capacity: r.capacity,
      equipment: r.equipment,
      status: r.status === "maintenance" ? ("maintenance" as const) : ("available" as const),
    });
  }

  const result = replaceAllRooms(items);
  res.json(result);
});

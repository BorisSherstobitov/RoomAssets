import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  listAssets, getAsset, insertAsset, updateAsset, deleteAssetWithBookings, assetIdExists, inventoryCodeTaken,
  replaceAllAssets,
} from "../data/assets.repo.js";
import { countBookingsByResource } from "../data/bookings.repo.js";

export const assetsRouter = Router();

// Вручную можно выставить только "available" или "maintenance".
// "in_use" вычисляется автоматически по таблице броней и в API не принимается.
const assetFields = z.object({
  inventoryCode: z.string().trim().min(1, "Укажите инвентарный номер").max(40, "Инвентарный номер слишком длинный"),
  name: z.string().trim().min(1, "Укажите название").max(100, "Название слишком длинное"),
  status: z.enum(["available", "maintenance"], { message: "Допустимые статусы: available, maintenance" }),
});

const assetCreateSchema = assetFields.extend({
  status: assetFields.shape.status.default("available"),
});

const assetUpdateSchema = assetFields.partial();

function validationError(res: import("express").Response, error: z.ZodError) {
  return res.status(400).json({
    error: "VALIDATION_ERROR",
    message: error.issues[0]?.message ?? "Некорректные данные",
    details: error.flatten(),
  });
}

// GET /api/assets — статус "in_use" вычисляется на момент запроса
assetsRouter.get("/", (_req, res) => {
  const items = listAssets();
  res.json({ items, page: 1, total: items.length });
});

// POST /api/assets — создание единицы инвентаря
assetsRouter.post("/", (req, res) => {
  const parsed = assetCreateSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  if (inventoryCodeTaken(parsed.data.inventoryCode)) {
    return res.status(409).json({
      error: "CODE_EXISTS",
      message: `Оборудование с инв. номером «${parsed.data.inventoryCode}» уже существует`,
    });
  }

  let id = `a-${nanoid(8)}`;
  while (assetIdExists(id)) id = `a-${nanoid(8)}`;

  const asset = insertAsset({ id, ...parsed.data });
  res.status(201).json(asset);
});

// PUT /api/assets/:id — редактирование (можно передавать часть полей)
assetsRouter.put("/:id", (req, res) => {
  const existing = getAsset(req.params.id);
  if (!existing) return res.status(404).json({ error: "NOT_FOUND" });

  const parsed = assetUpdateSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  if (parsed.data.inventoryCode !== undefined && inventoryCodeTaken(parsed.data.inventoryCode, existing.id)) {
    return res.status(409).json({
      error: "CODE_EXISTS",
      message: `Оборудование с инв. номером «${parsed.data.inventoryCode}» уже существует`,
    });
  }

  const updated = updateAsset(existing.id, parsed.data);
  res.json(updated);
});

// DELETE /api/assets/:id[?force=true]
// Если у оборудования есть брони — 409 HAS_BOOKINGS; с force=true оно удаляется вместе с бронями.
assetsRouter.delete("/:id", (req, res) => {
  const existing = getAsset(req.params.id);
  if (!existing) return res.status(404).json({ error: "NOT_FOUND" });

  const bookingsCount = countBookingsByResource("asset", existing.id);
  if (bookingsCount > 0 && req.query.force !== "true") {
    return res.status(409).json({
      error: "HAS_BOOKINGS",
      message: `У оборудования есть брони (${bookingsCount}). Они будут удалены вместе с ним.`,
      bookingsCount,
    });
  }

  deleteAssetWithBookings(existing.id);
  res.status(204).send();
});

// POST /api/assets/import — полная замена таблицы инвентаря (используется фронтом при импорте JSON).
// Тело: { "assets": [ { id?, inventoryCode, name, status? }, ... ] }.
// Статус приводится к ручному: "maintenance" остаётся, всё остальное (в т.ч. "in_use") -> "available".
// Оборудование, которого нет в файле, удаляется вместе со своими бронями.
const assetImportItem = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  inventoryCode: assetFields.shape.inventoryCode,
  name: assetFields.shape.name,
  status: z.string().optional(),
});
const assetImportSchema = z.array(assetImportItem).max(5000);

assetsRouter.post("/import", (req, res) => {
  const parsed = assetImportSchema.safeParse(req.body?.assets);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const idx = typeof issue?.path[0] === "number" ? `Запись №${issue.path[0] + 1}: ` : "";
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: issue ? `${idx}${issue.message}` : "Ожидается массив assets",
      details: parsed.error.flatten(),
    });
  }

  const usedIds = new Set<string>();
  const usedCodes = new Set<string>();
  const items = [];
  for (const a of parsed.data) {
    if (usedCodes.has(a.inventoryCode)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: `В файле повторяется инв. номер «${a.inventoryCode}»` });
    }
    usedCodes.add(a.inventoryCode);

    let id = a.id;
    if (!id) {
      id = `a-${nanoid(8)}`;
      while (usedIds.has(id)) id = `a-${nanoid(8)}`;
    }
    if (usedIds.has(id)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: `В файле повторяется id «${id}»` });
    }
    usedIds.add(id);

    items.push({
      id,
      inventoryCode: a.inventoryCode,
      name: a.name,
      status: a.status === "maintenance" ? ("maintenance" as const) : ("available" as const),
    });
  }

  const result = replaceAllAssets(items);
  res.json(result);
});
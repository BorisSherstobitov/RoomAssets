import { http as msw, HttpResponse } from "msw";
import { roomsPayload, assetsPayload, bookingsPayload } from "./data";
import type { BookingDto } from "@/api/bookingsApi";

// in-memory копия для CRUD в dev-режиме (сбрасывается при перезагрузке страницы)
let bookings: BookingDto[] = [...bookingsPayload.items];

export const handlers = [
  // --- из Установка_библиотеки_и_создание_моков.pdf ---
  msw.get("/api/rooms", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    return HttpResponse.json({ ...roomsPayload, page });
  }),

  // --- моё дополнение: assets, по тому же паттерну ---
  msw.get("/api/assets", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    return HttpResponse.json({ ...assetsPayload, page });
  }),

  // --- моё дополнение: bookings CRUD (упрощённо, без проверки пересечений —
  //     эта бизнес-логика реализуется на backend, см. backend/src/utils/overlap.ts) ---
  msw.get("/api/bookings", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase();
    const date = url.searchParams.get("date");
    const resourceType = url.searchParams.get("resourceType");

    let items = bookings;
    if (q) {
      items = items.filter(
        (b) => b.title.toLowerCase().includes(q) || (b.notes ?? "").toLowerCase().includes(q)
      );
    }
    if (date) {
      items = items.filter((b) => b.start.slice(0, 10) === date);
    }
    if (resourceType) {
      items = items.filter((b) => b.resourceType === resourceType);
    }
    return HttpResponse.json({ items, page: 1, total: items.length });
  }),

  msw.post("/api/bookings", async ({ request }) => {
    const body = (await request.json()) as Omit<BookingDto, "id">;
    const created: BookingDto = { ...body, id: `b-${Date.now()}` };
    bookings = [...bookings, created];
    return HttpResponse.json(created, { status: 201 });
  }),

  msw.put("/api/bookings/:id", async ({ params, request }) => {
    const body = (await request.json()) as Partial<BookingDto>;
    bookings = bookings.map((b) => (b.id === params.id ? { ...b, ...body } : b));
    return HttpResponse.json(bookings.find((b) => b.id === params.id));
  }),

  msw.delete("/api/bookings/:id", ({ params }) => {
    bookings = bookings.filter((b) => b.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];

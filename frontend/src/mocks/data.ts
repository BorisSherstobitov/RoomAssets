import type { RoomsResponseDto } from "@/api/roomsApi";
import type { AssetsResponseDto } from "@/api/assetsApi";
import type { BookingsResponseDto } from "@/api/bookingsApi";

// --- из Установка_библиотеки_и_создание_моков.pdf ---
export const roomsPayload: RoomsResponseDto = {
  items: [
    { id: "201", code: "201", name: "Конференц-зал", capacity: 50, equipment: ["projector", "microphone", "wifi"], status: "available" },
    { id: "101", code: "101", name: "Лекционная аудитория", capacity: 120, equipment: ["projector", "wifi"], status: "available" },
    { id: "102", code: "102", name: "Компьютерный класс", capacity: 30, equipment: ["computers", "projector", "board", "wifi"], status: "booked" },
    { id: "202", code: "202", name: "Семинарская", capacity: 25, equipment: ["board", "wifi"], status: "maintenance" },
  ],
  page: 1,
  total: 156,
};

// --- моё дополнение: по аналогии, для Asset (модель из Task_1.pdf) ---
export const assetsPayload: AssetsResponseDto = {
  items: [
    { id: "a-proj-1", name: "Проектор Epson", inventoryCode: "PRJ001", status: "available" },
    { id: "a-lap-1", name: "Ноутбук Dell", inventoryCode: "LAP014", status: "in_use" },
    { id: "a-mic-1", name: "Микрофон Shure", inventoryCode: "MIC003", status: "maintenance" },
  ],
  page: 1,
  total: 3,
};

// --- моё дополнение: пример брони (совпадает с seed.example.json из Task_1.pdf) ---
export const bookingsPayload: BookingsResponseDto = {
  items: [
    {
      id: "b-1",
      resourceType: "room",
      resourceId: "r-101",
      title: "Семинар",
      start: "2025-09-05T08:00:00Z",
      end: "2025-09-05T09:30:00Z",
      notes: "Нужен HDMI",
    },
  ],
  page: 1,
  total: 1,
};

import { db } from "./db.js";

const roomsCount = (db.prepare("SELECT COUNT(*) as c FROM rooms").get() as { c: number }).c;

if (roomsCount === 0) {
  const insertRoom = db.prepare(
    "INSERT INTO rooms (id, code, name, capacity, equipment, status) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertAsset = db.prepare(
    "INSERT INTO assets (id, name, inventoryCode, status) VALUES (?, ?, ?, ?)"
  );
  const insertBooking = db.prepare(
    "INSERT INTO bookings (id, resourceType, resourceId, title, start, end, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  const tx = db.transaction(() => {
    insertRoom.run("201", "201", "Конференц-зал", 50, JSON.stringify(["projector", "microphone", "wifi"]), "available");
    insertRoom.run("101", "101", "Лекционная аудитория", 120, JSON.stringify(["projector", "wifi"]), "available");
    insertRoom.run("102", "102", "Компьютерный класс", 30, JSON.stringify(["computers", "projector", "board", "wifi"]), "booked");
    insertRoom.run("202", "202", "Семинарская", 25, JSON.stringify(["board", "wifi"]), "maintenance");

    insertAsset.run("a-proj-1", "Проектор Epson", "PRJ001", "available");
    insertAsset.run("a-lap-1", "Ноутбук Dell", "LAP014", "in_use");
    insertAsset.run("a-mic-1", "Микрофон Shure", "MIC003", "maintenance");

    insertBooking.run("b-1", "room", "101", "Семинар", "2025-09-05T08:00:00Z", "2025-09-05T09:30:00Z", "Нужен HDMI");
  });

  tx();
  console.log("[seed] Начальные данные загружены");
}

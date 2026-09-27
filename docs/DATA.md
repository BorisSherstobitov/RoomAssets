# DATA.md — модель данных

Модель сущностей (из Task_1.pdf):

- **Room**: `id, name, capacity, features[]`
- **Asset**: `id, name, inventoryCode/serial, status`
- **Booking**: `id, resourceType (room | asset), resourceId, title, start, end, notes`

Время хранится в формате **ISO-8601 / RFC 3339 в UTC**, отображается в локальной таймзоне
пользователя (через `date-fns`, см. `frontend/src/utils/date.ts`).

## Формат импорта/экспорта (единый JSON-файл)

См. `seed/seed.example.json`:

```json
{
  "rooms": [...],
  "assets": [...],
  "bookings": [...]
}
```

## API-контракт backend (REST)

| Метод | Путь | Описание |
|---|---|---|
| GET | /api/rooms | список аудиторий |
| GET | /api/assets | список инвентаря |
| GET | /api/bookings?q=&date=&resourceType= | список броней с фильтрами |
| POST | /api/bookings | создание брони (400 при пересечении интервалов) |
| PUT | /api/bookings/:id | редактирование брони |
| DELETE | /api/bookings/:id | удаление брони |

Формат ответа списков: `{ "items": [...], "page": number, "total": number }`.

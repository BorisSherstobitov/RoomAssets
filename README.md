# Room & Assets

Приложение для управления бронированием аудиторий и инвентаря.
Frontend: Vite + React + TypeScript + MUI. Backend: Node.js + Express + TypeScript.

- **Демо (frontend, GitHub Pages):** [TODO: ссылка]
- **API (backend, Render):** [TODO: ссылка]

## Структура репозитория

```
RoomAssets/
├─ frontend/   # SPA (Vite+React+TS), деплоится на GitHub Pages
├─ backend/    # REST API (Express+TS), деплоится на Render
├─ seed/       # пример данных для импорта
├─ docs/       # SPEC/UI/DATA/DECISIONS/TESTS/COMPAT
├─ Justfile / Makefile
└─ .github/workflows/  # CI/CD
```

## Требования

- Node.js 20.19+ или 22.12+ (см. `frontend/package.json` → `engines`)
- npm 10+
- (опционально) Docker + Docker Compose v2
- (опционально) [Just](https://github.com/casey/just)

## Быстрый запуск без Docker

### 1. Backend

```bash
cd backend
npm install
npm run dev
# сервер поднимется на http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npx msw init public --save   # один раз, генерирует mockServiceWorker.js
npm run dev
# откройте http://localhost:5173
```

В dev-режиме фронтенд по умолчанию использует MSW-моки (`VITE_API_URL=/api` из `.env.development`).
Чтобы фронтенд ходил на реальный backend локально — поменяйте `frontend/.env.development` на
`VITE_API_URL=http://localhost:4000/api` и уберите вызов моков (либо просто запустите backend —
запросы к несуществующим MSW-роутам не перехватываются, но лучше явно переключить URL).

## Запуск через Docker (рекомендуется — одинаково на Windows и Linux)

```bash
just docker-dev
# или
docker compose -f docker-compose.base.yml -f docker-compose.dev.yml up --build
```

Frontend: http://localhost:5173, backend: http://localhost:4000.

## Продакшн-сборка

```bash
just build          # соберёт frontend/dist и backend/dist
just release         # скопирует frontend/dist в release/
```

## CI/CD

При пуше в `main`:
- `.github/workflows/frontend-deploy.yml` собирает фронтенд и публикует его на GitHub Pages;
- backend разворачивается на Render автоматически при пуше (Render слушает репозиторий напрямую).

Пошаговая первичная настройка (Render + GitHub Pages) — см. [`docs/DEPLOY.md`](docs/DEPLOY.md).
Обоснование выбора инструментов — в [`docs/DECISIONS.md`](docs/DECISIONS.md), итоговый отчёт — в [`REPORT.md`](REPORT.md).

## Документация

- [`docs/SPEC.md`](docs/SPEC.md) — пользовательские истории и границы MVP
- [`docs/UI.md`](docs/UI.md) — описание экранов
- [`docs/DATA.md`](docs/DATA.md) — модель данных и API-контракт
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — выбор стека
- [`docs/TESTS.md`](docs/TESTS.md) — ручные сценарии проверки
- [`docs/COMPAT.md`](docs/COMPAT.md) — совместимость Windows/Linux

# Room & Assets — единые команды для Windows/Linux (запуск: `just <цель>`)
# Официальный репозиторий Just: https://github.com/casey/just

# --- Frontend ---

install-frontend:
    cd frontend && npm install

dev-frontend:
    cd frontend && npm run dev

build-frontend:
    cd frontend && npm run build

preview-frontend:
    cd frontend && npm run preview

# --- Backend ---

install-backend:
    cd backend && npm install

dev-backend:
    cd backend && npm run dev

build-backend:
    cd backend && npm run build

# --- Общее ---

install: install-frontend install-backend

# Запуск фронта и бэка одновременно для локальной разработки (в двух терминалах)
dev:
    just dev-backend & just dev-frontend

# Docker
docker-dev:
    docker compose -f docker-compose.base.yml -f docker-compose.dev.yml up --build

docker-prod:
    docker compose -f docker-compose.base.yml -f docker-compose.yml up --build -d

docker-down:
    docker compose down

# Сборка релизного артефакта фронтенда в release/
release:
    just build-frontend
    mkdir -p release
    cp -r frontend/dist/* release/

.PHONY: install install-frontend install-backend dev dev-frontend dev-backend \
        build build-frontend build-backend preview release docker-dev docker-prod docker-down

install-frontend:
	cd frontend && npm install

install-backend:
	cd backend && npm install

install: install-frontend install-backend

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && npm run dev

build-frontend:
	cd frontend && npm run build

build-backend:
	cd backend && npm run build

build: build-frontend build-backend

preview:
	cd frontend && npm run preview

release: build-frontend
	mkdir -p release
	cp -r frontend/dist/* release/

docker-dev:
	docker compose -f docker-compose.base.yml -f docker-compose.dev.yml up --build

docker-prod:
	docker compose -f docker-compose.base.yml -f docker-compose.yml up --build -d

docker-down:
	docker compose down

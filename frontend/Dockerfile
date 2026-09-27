# ---- базовые зависимости
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- dev: Vite + HMR
FROM node:24-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm","run","dev"]

# ---- build: собираем статическую дистрибуцию
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- prod: nginx + статика
FROM nginx:1.27-alpine AS prod
RUN rm -f /etc/nginx/conf.d/default.conf
COPY ./nginx/nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80

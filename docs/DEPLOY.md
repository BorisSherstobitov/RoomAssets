# DEPLOY.md — первичная настройка деплоя (сделать один раз вручную)

## 1. Backend → Render

1. Зарегистрируйтесь на [render.com](https://render.com), подключите GitHub-аккаунт.
2. New → Blueprint → выберите этот репозиторий. Render найдёт `render.yaml` в корне и
   предложит создать сервис `room-assets-api` автоматически (Docker, `backend/Dockerfile`).
3. После первого деплоя скопируйте публичный URL сервиса
   (вида `https://room-assets-api-xxxx.onrender.com`).
4. В Render → Environment обновите `CORS_ORIGIN` на реальный адрес GitHub Pages
   (см. шаг 2.4 ниже) — по умолчанию в `render.yaml` стоит плейсхолдер.
5. Проверьте `https://<ваш-сервис>.onrender.com/health` — должен вернуть `{"status":"ok"}`.

**Важно (free-план):** сервис "засыпает" при неактивности, первый запрос после простоя
может выполняться 30–60 секунд. Перед демонстрацией преподавателю откройте `/health` заранее,
чтобы "разбудить" сервис.

## 2. Frontend → GitHub Pages

1. В репозитории: Settings → Pages → Source: **GitHub Actions** (не "Deploy from a branch").
2. Settings → Secrets and variables → Actions → вкладка **Variables** → добавьте
   `VITE_API_URL` = `https://<ваш-сервис>.onrender.com/api` (адрес из шага 1.3, с `/api` в конце).
3. Запушьте изменения в `frontend/**` в ветку `main` — сработает
   `.github/workflows/frontend-deploy.yml`, соберёт и опубликует сайт.
4. Итоговый адрес будет вида `https://<username>.github.io/<repo-name>/` — проверьте
   в Settings → Pages после первого успешного деплоя (вкладка Actions покажет зелёную галочку).
5. Вернитесь к шагу 1.4 и пропишите этот адрес в `CORS_ORIGIN` на Render (без завершающего слэша).

## 3. Проверка полного цикла

1. Откройте адрес GitHub Pages.
2. Откройте DevTools → Network, создайте бронь — запрос должен уйти на
   `https://<ваш-сервис>.onrender.com/api/bookings`, а не в MSW-моки.
3. Обновите страницу — бронь должна сохраниться (данные лежат в SQLite на Render Disk).

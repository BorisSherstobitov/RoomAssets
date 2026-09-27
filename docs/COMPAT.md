# COMPAT.md — совместимость Windows/Linux

## Меры, заложенные в проект

- `.gitattributes` с `* text=auto eol=lf` — нормализация переводов строк (см. Task_1.pdf,
  раздел про CRLF/LF).
- `.editorconfig` фиксирует `end_of_line = lf` для всех файлов, кроме `.md`.
- `Justfile` + `Makefile` — одинаковые команды на обеих ОС без ручной адаптации путей.
- Docker-контейнеры (dev/prod) — гарантируют идентичное окружение независимо от хост-ОС.
- Node версия зафиксирована в `package.json` → `engines` (`>=20.19 <21 || >=22.12`), как в
  Настройка_проекта_Vite_React_TypeScript.pdf.

## Наблюдения (заполнить по факту тестирования)

| Аспект | Windows | Linux |
|---|---|---|
| Версия Node.js | [TODO] | [TODO] |
| Установка через nvm-windows / nvm | [TODO] | [TODO] |
| Пути (`\` vs `/`) | [TODO] | [TODO] |
| Bind-mount Docker (скорость HMR) | [TODO, см. рекомендацию хранить проект в WSL из Docker.pdf] | [TODO] |
| Локаль/часовой пояс | [TODO] | [TODO] |

[TODO: опишите конкретные проблемы, с которыми столкнулись, и как их решили]

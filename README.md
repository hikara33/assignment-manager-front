# assignment-manager-front

Клиент для [Assignment Manager API](https://github.com/hikara33/assignment-manager): React 19, Next.js 16 (App Router), TypeScript, Tailwind CSS 4.

## Запуск

Скопируйте переменные окружения и поднимите бэкенд на `http://localhost:3000`.

```bash
copy .env.local.example .env.local
npm install
npm run dev
```

Откройте [http://localhost:3001](http://localhost:3001) (порт **3001**, чтобы не конфликтовать с API на 3000).

## Интеграция с бэкендом

- **Access JWT** — заголовок `Authorization: Bearer …` для защищённых маршрутов.
- **Refresh** — httpOnly cookie `refreshToken`; при `401` клиент вызывает `GET /auth/refresh` с `credentials: 'include'`, затем повторяет запрос. Если обновление не удалось, сессия сбрасывается и открываются экраны входа.
- **CORS** на бэкенде должен разрешать origin фронта и **`credentials: true`**. В репозитории API задано `FRONTEND_URL` (по умолчанию `http://localhost:3001`).
Ссылки в письмах с приглашениями в группу ведут на `{FRONTEND_URL}/invite?token=…`.

## Функции UI

Вход и регистрация, дашборд и аналитические эндпоинты API, список и создание заданий, смена статуса «выполнено», профиль, группы (создание, участники, приглашения по email, выход, удаление группы, передача владения), страница `/invite` для токена из письма, админка (пользователи и предметы) для роли `ADMIN`.

Список «моих групп» на фронте собирается из заданий, где указана группа. Для пустой группы без заданий удобнее добавить на бэкенде отдельный эндпоинт вроде `GET /group` со списком групп текущего пользователя.

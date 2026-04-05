# assignment-manager-front

Клиент для [Assignment Manager API](https://github.com/hikara33/assignment-manager)

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=tanstackquery&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-FFB200?style=for-the-badge&logo=zustand&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

## Запуск

Скопируйте переменные окружения и поднимите бэкенд на `http://localhost:3000`.

```bash
copy .env.local.example .env.local
npm install
npm run dev
```

Откройте [http://localhost:3001](http://localhost:3001) (порт **3001**, чтобы не конфликтовать с API на 3000).

Если фронт поднялся на **3000**: вы запустили не `npm run dev`, а напрямую `next dev` / кнопку IDE без скрипта, либо в окружении задан `PORT=3000`. В `.env.local` задайте `PORT=3001` (см. пример) и всегда используйте `npm run dev`.

## Интеграция с бэкендом

- **Access JWT** — заголовок `Authorization: Bearer …` для защищённых маршрутов.
- **Refresh** — httpOnly cookie `refreshToken`; при `401` клиент вызывает `GET /auth/refresh` с `credentials: 'include'`, затем повторяет запрос. Если обновление не удалось, сессия сбрасывается и открываются экраны входа.
- **CORS** на бэкенде должен разрешать origin фронта и **`credentials: true`**. В репозитории API задано `FRONTEND_URL` (по умолчанию `http://localhost:3001`).
Ссылки в письмах с приглашениями в группу ведут на `{FRONTEND_URL}/invite?token=…`.

## Функции UI

Вход и регистрация, дашборд и аналитические эндпоинты API, список и создание заданий, смена статуса «выполнено», профиль, группы (создание, участники, приглашения по email, выход, удаление группы, передача владения), страница `/invite` для токена из письма, админка (пользователи и предметы) для роли `ADMIN`.

Список «моих групп» на фронте собирается из заданий, где указана группа. Для пустой группы без заданий удобнее добавить на бэкенде отдельный эндпоинт вроде `GET /group` со списком групп текущего пользователя.
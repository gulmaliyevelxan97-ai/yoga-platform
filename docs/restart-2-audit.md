# Аудит RESTART 2.0

Исходный снимок — GitHub commit `cf69a6a64154862a6bd6e8e3bdd1ea9ecb7efa60`. Ветка сайта `main` начиналась с `b98336a34a2882414372bbc96d784773d5759366`. В исходном снимке прошли 50 автоматических тестов. Открытый PR № 1 относится к предыдущему закрытому пилоту.

Сайт состоит из 12 статических страниц, JavaScript и CSS. Кабинет под `app/` использует ES modules, локальное хранилище, отдельный manifest и service worker. Пилот собирает SDK Supabase через esbuild. При обычной сборке конфигурация облака равна `null`. PostgreSQL и RLS защищают персональные данные, расписание и контент Академии. Клиент запрашивает серверный снимок при входе, обновлении вручную и возвращении в активную вкладку при подходящих условиях.

В исходной версии ошибки callback могли оставлять пользователя без понятного сообщения. Курсы и занятия имели ограниченные метаданные. Администратор мог менять школьные роли. В кабинете отсутствовал настраиваемый план, а история дневника не фильтровалась. Изменения и доступность описаны в архитектуре и дорожной карте.

## Перечень исходных медиа

24 файла, около 3,7 МБ в `assets/`. Байтное совпадение проверяется Git object hash. Список относится к файлам в репозитории. Связи внешних видеоматериалов описаны в `video-data.js`, `video-labels.js` и `video-library.js`.
- `assets/author.webp`
- `assets/brand/restart-1188.webp`
- `assets/brand/restart-640.webp`
- `assets/brand/restart-dawn-1280.webp`
- `assets/brand/restart-dawn-640.webp`
- `assets/brand/yoga-space-archive.jpg`
- `assets/breath.webp`
- `assets/founder-championship.webp`
- `assets/founder-nunchaku-first-frame.webp`
- `assets/founder-portrait.mp4`
- `assets/founder-workshop-group.webp`
- `assets/founder-workshop-outdoors.webp`
- `assets/founder-workshop-talk.webp`
- `assets/founder-yoga.mp4`
- `assets/founder-yoga.webp`
- `assets/hero.webp`
- `assets/lake.jpg`
- `assets/meditation.webp`
- `assets/performance.webp`
- `assets/pwa/restart-192.png`
- `assets/pwa/restart-512.png`
- `assets/pwa/restart-apple.png`
- `assets/pwa/restart-maskable.png`
- `assets/yoga.webp`

## Критерии готовности

- Сайт и кабинет. Сохраняются прямые ссылки, языки, навигация и исходные файлы. Проверяются клавиатура, три языка и мобильные размеры.
- Академия, расписание и роли. Миграции проверяются на чистой базе вместе со старыми. Разные пользователи получают только свой контент и данные. При конкурентных заявках на последнее место подтверждается одна.
- Пилот. Требуются доступ к закрытому HTTPS-адресу, реальный цикл Auth и доставка письма, два аккаунта для подтверждения RLS, проверка Samsung и синхронизация с двух устройств.

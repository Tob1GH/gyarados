# Gyarados: Library and Digital Asset Management front end

React 18 + Vite + Tailwind CSS (JavaScript). Four screens: Dashboard, Library, Digital assets, Loans.
Every screen reads live data from a backend API.

## Run it

```bash
npm install
cp .env.example .env      # set VITE_API_URL to your backend
npm run mock              # optional: starts a mock API on :4000
npm run dev               # http://localhost:5173
```

## API contract

All routes are relative to `VITE_API_URL`. Lists return `{ items: [...], total: number }`.

| Method | Route | Notes |
|---|---|---|
| POST | `/auth/login` | body `{ email, password }`, returns `{ token, user }`. 401 with `{ message }` on bad credentials |
| POST | `/auth/register` | body `{ name, email, password }`, returns `{ token, user }` |
| GET | `/auth/me` | returns `{ id, name, email }` for the token |
| POST | `/auth/logout` | |
| GET | `/stats` | `totalBooks, availableCopies, activeLoans, overdueLoans, totalAssets, storageUsedMb, storageQuotaMb` |
| GET | `/categories` | `["Fiction", "Design", ...]` |
| GET | `/books?q=&category=&status=` | `status`: `available` or `unavailable`. Book: `id, title, author, category, year, copiesTotal, copiesAvailable` |
| POST | `/books/:id/borrow` | body `{ member }` |
| GET | `/loans?status=&limit=` | `status`: `active`, `overdue`, `returned`. Loan: `id, bookId, bookTitle, member, borrowedAt, dueAt, returnedAt?, status` |
| POST | `/loans/:id/return` | |
| GET | `/assets?q=&type=&sort=recent&limit=` | `type`: `image`, `video`, `audio`, `document`. Asset: `id, title, type, format, sizeBytes, tags[], collection, owner, createdAt, url, thumbnailUrl?` |
| POST | `/assets` | multipart: `file, title, tags, size, mime, filename` |
| DELETE | `/assets/:id` | |

Every route except `/auth/login` and `/auth/register` must require the header `Authorization: Bearer <token>` and answer `401` without it. The app then clears the saved session and returns to the sign-in page.

Mock demo account: `demo@gyarados.test` / `demo1234`.

Errors: respond with a non-2xx status and `{ "message": "..." }`. The message is shown in a toast.

## Using Next.js instead

The components are framework-neutral. Move `src/pages/*` to `app/*/page.jsx` with `'use client'` at the top,
replace `react-router-dom` links and `useSearchParams` with `next/link` and `next/navigation`,
and rename `VITE_API_URL` to `NEXT_PUBLIC_API_URL` in `src/api/client.js`.

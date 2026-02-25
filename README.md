# RiseFit Remake

RiseFit Remake adalah sistem manajemen gym yang terdiri dari:

- **Pelanggan (USER)**: overview member, lihat produk, booking membership, riwayat (order & attendance).
- **Office (ADMIN/BACKOFFICE)**: dashboard operasional, inventory, purchasing, accounting, marketing, admin finance.
- **Backend API**: REST API (Elysia + Bun) dengan database PostgreSQL (Prisma).

---

## 📁 Project Structure

This project is organized as a Bun monorepo:

```text
risefit-remake/
├── backend/                  # Elysia API workspace
│   ├── prisma/               # Prisma Database ORM
│   │   ├── migrations/       # SQL migration history
│   │   ├── models/           # Modular Prisma schemas
│   │   └── schema.prisma     # Main Prisma schema file
│   ├── src/                  # Backend application source code
│   │   ├── config/           # Application configuration (Env, etc.)
│   │   ├── middleware/       # Shared middleware (Auth, CORS)
│   │   ├── modules/          # Business logic and controllers
│   │   └── routes/           # REST API route definitions
│   └── package.json          # Backend dependencies and scripts
│
├── frontend/                 # React + Vite frontend workspace
│   ├── src/                  # Frontend application source code
│   │   ├── assets/           # Static assets (images, icons)
│   │   ├── components/       # Shared UI components (shadcn/ui)
│   │   ├── helpers/          # Utility and helper functions
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # React component layouts
│   │   ├── lib/              # Integrations and configs (axios, utils)
│   │   ├── pages/            # Application page views
│   │   ├── route/            # App routing configurations
│   │   ├── services/         # API integration services
│   │   └── store/            # Global state management using Zustand
│   ├── vite.config.ts        # Vite configuration file
│   └── package.json          # Frontend dependencies and scripts
│
├── scripts/                  # Utility scripts / docs kecil
├── package.json              # Root workspace scripts (runner)
└── .gitignore
```

---

## 🧩 Sistem & Modul

### Roles

- `USER`: pelanggan/member (layout pelanggan).
- `BACKOFFICE`: operasional/office.
- `ADMIN`: admin (punya akses admin panel + office).

### Backend (REST API)

Folder utama:

- `backend/src/routes/` — definisi route per modul.
- `backend/src/modules/` — controller/service per domain.
- `backend/prisma/` — Prisma schema/migrations/seed.

Ringkasan endpoint (base URL default: `http://localhost:8001` sesuai `.env.example`):

- Auth: `POST /auth/register|/auth/signup`, `POST /auth/login|/auth/signin`, `GET /auth/me`
- Users: `GET /users/me`, `PATCH /users/me`, admin/backoffice: `GET /users`, `PATCH /users/:id/role`, dll
- Profile: `GET /profile/me`, `PATCH /profile/me`, admin/backoffice: `GET /profile/:id`
- Membership: `GET /memberships`, `GET /memberships/me`, `POST /memberships/subscribe`
- Products: `GET /products`, `GET /products/:id`, admin/backoffice: `POST /products`, `PATCH /products/:id`, stock movements
- Cart: `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`, `DELETE /cart/items/:itemId`
- Orders: `GET /orders`, admin/backoffice: `GET /orders/all`, `POST /orders`, `POST /orders/from-cart`, `POST /orders/:id/checkout`
- Invoices: `POST /invoices`, `GET /invoices/:id`, `GET /invoices/order/:orderId`
- Payment: `POST /payment/token`, `POST /payment/notification` (webhook Midtrans)
- Attendance: `GET /attendance/me`, `GET /attendance/qr`, admin/backoffice: `GET /attendance`, `POST /attendance/scan`
- Agents: admin/backoffice modul agent & movement

### Frontend

Folder penting:

- `frontend/src/route/AppRouter.tsx` — route + proteksi role.
- `frontend/src/route/app-nav.ts` — menu berdasarkan role.
- `frontend/src/components/ui/` — komponen shadcn/ui.
- `frontend/src/pages/pelanggan/*` — layout/halaman pelanggan (USER).
- `frontend/src/pages/office/*` — halaman office (ADMIN/BACKOFFICE).

---

## ⚙️ Configuration

### Backend env (`backend/.env`)

Lihat contoh: `backend/.env.example`.

Wajib:

- `DATABASE_URL`
- `JWT_SECRET`

Opsional:

- `PORT` (default 8000 di code, contoh pakai 8001)
- CORS: `CORS_ORIGIN`, `CORS_CREDENTIALS`
- Midtrans: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`
- Attendance radius: `GYM_LAT`, `GYM_LNG`, `GYM_RADIUS_METERS`

### Frontend env (`frontend/.env`)

Lihat contoh: `frontend/.env.example`.

- `VITE_API_BASE_URL` (arah ke backend)
- `VITE_MIDTRANS_CLIENT_KEY` (kalau dipakai di UI)

---

## 🚀 Getting Started

### Prerequisites

- Bun
- PostgreSQL

### Install & Run (dev)

Backend:

```bash
cd backend
bun install
cp .env.example .env
bun run prisma:generate
bun run prisma:migrate
bun run dev
```

Frontend:

```bash
cd frontend
bun install
cp .env.example .env
bun run dev
```

### Run dari root (setelah install per workspace)

```bash
bun run backend:dev
bun run frontend:dev
```

---

## 🧪 Quality

```bash
bun run backend:test
bun run frontend:lint
bun run frontend:build
```


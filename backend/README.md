# Elysia with Bun runtime

## Getting Started
Requirements:
- Bun
- PostgreSQL

## Development
To start the development server run:
```bash
bun run dev
```

## Prisma
Generate client:
```bash
bun run prisma:generate
```

Run migrations (requires a running database):
```bash
bun run prisma:migrate
```

Seed:
```bash
bun run prisma:seed
```

## API
Default base URL: `http://localhost:8000`

Routes:
- `POST /auth/signup`, `POST /auth/signin`, `GET /auth/me`
- `GET /products`, `POST /products` (admin/backoffice)
- `GET /cart`, `POST /cart/items`
- `POST /orders`, `POST /orders/from-cart`, `POST /orders/:id/checkout`
- `POST /payment/token`, `POST /payment/notification` (Midtrans webhook)

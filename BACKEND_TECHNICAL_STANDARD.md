# BACKEND_TECHNICAL_STANDARD

## 1. Tech Stack

- **NestJS**: 10.x atau 11.x (LTS stabil, dengan dukungan fitur modular terakhir)
- **Node.js**: 20.x LTS
- **Prisma**: 5.x
- **PostgreSQL**: 16.x atau 15.x LTS
- **TypeScript**: 5.5.x atau terbaru yang kompatibel

> Rekomendasi versi harus dipatok pada rilis stabil yang mendukung fitur terbaru Prisma, NestJS, dan PostgreSQL tanpa memaksakan breaking change.

---

## 2. Folder Structure

```
backend/
  src/
    auth/
    users/
    common/
    config/
    prisma/
    modules/
    shared/
    utils/
  prisma/
  .env.example
  package.json
  tsconfig.json
  README.md
```

### Fungsi setiap folder

- `auth/`
  - Modul otentikasi dan otorisasi.
  - Mendukung strategi JWT, refresh token, dan middleware auth.

- `users/`
  - Modul user management dan profil.
  - Berisi service, dto, dan domain logic pengguna.

- `common/`
  - Komponen shared global seperti pipes, guards, interceptors, filters, decorators, dan error handling.

- `config/`
  - Konfigurasi global aplikasi.
  - Struktur untuk `ConfigModule`, validasi env, dan konfigurasi runtime.

- `prisma/`
  - Prisma module service dan adapter.
  - Struktur untuk `PrismaService` dan integrasi lifecycle.

- `modules/`
  - Folder untuk modul bisnis lain di masa depan.
  - Menampung submodule yang berkembang seiring implementasi ERP.

- `shared/`
  - Tipe bersama, constants, helper model, dan shared DTO yang dipakai lintas modul.

- `utils/`
  - Utilitas kecil non-domain seperti date helper, logger helper, error formatter.

- `prisma/`
  - Root Prisma schema dan migrasi.
  - `schema.prisma` dan folder `migrations`.

---

## 3. Naming Convention

### Folder

- gunakankan `kebab-case`
- contoh: `auth`, `user-profiles`, `stock-transactions`

### File

- gunakan `kebab-case` untuk file umum
- contoh: `auth.module.ts`, `user.service.ts`, `create-user.dto.ts`

### DTO

- gunakan PascalCase dan akhiri `Dto`
- contoh: `CreateUserDto`, `UpdateProfileDto`

### Entity

- gunakan PascalCase
- contoh: `User`, `ProductVariant`, `OrderItem`

### Service

- gunakan PascalCase dan akhiri `Service`
- contoh: `AuthService`, `UsersService`

### Controller

- gunakan PascalCase dan akhiri `Controller`
- contoh: `UsersController`, `AuthController`

### Enum

- gunakan PascalCase dan akhiri `Enum` jika dibutuhkan, atau gunakan singular noun
- contoh: `UserStatus`, `OrderStatus`, `StockTransactionType`

### Interface

- gunakan PascalCase dan akhiri `Interface` jika perlu, atau `I` prefix tidak direkomendasikan
- contoh: `UserProfile`, `LoginPayload`

### Prisma Model

- gunakan PascalCase
- contoh: `User`, `ProductVariant`, `OrderItem`

### Database Table

- gunakan `snake_case`
- contoh: `users`, `product_variants`, `order_items`

### Database Column

- gunakan `snake_case`
- contoh: `created_at`, `updated_at`, `marketplace_shop_id`

---

## 4. API Convention

### URL endpoint

- gunakan `kebab-case` untuk path
- gunakan `plural resource`
- contoh:
  - `GET /api/users`
  - `GET /api/users/:id`
  - `POST /api/auth/login`
  - `PATCH /api/users/:id`

### HTTP Method

- `GET` untuk baca
- `POST` untuk create
- `PATCH` untuk partial update
- `PUT` untuk replace update
- `DELETE` untuk hapus

### Pagination

- query param standar:
  - `page` (default `1`)
  - `limit` (default `20`)
- alternatif offset:
  - `offset`
  - `limit`

### Sorting

- gunakan param `sort_by` dan `sort_order`
- contoh:
  - `?sort_by=created_at&sort_order=desc`

### Filtering

- gunakan query param yang jelas dan named
- contoh:
  - `?status=active&created_after=2026-01-01`

### Search

- gunakan query param `q`
- contoh:
  - `?q=nama produk`

### Error Response

Gunakan format standar:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["field is required", "other error"]
}
```

### Success Response

Gunakan format standar:

```json
{
  "statusCode": 200,
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 0
    }
  }
}
```

Untuk single resource:

```json
{
  "statusCode": 200,
  "data": {
    "id": "...",
    "name": "..."
  }
}
```

---

## 5. Logging Standard

### Apa yang dicatat

- request masuk penting: path, method, status, duration, user id
- error dan exception stack
- auth event penting: login success/failure, token refresh
- lifecycle startup/shutdown

### Apa yang tidak dicatat

- password mentah
- token JWT refresh secara penuh
- data sensitif pengguna
- payload body sensitif seperti kartu kredit

### Format log

- JSON structured log
- field minimal:
  - `timestamp`
  - `level`
  - `context`
  - `message`
  - `requestId`
  - `userId` (jika tersedia)
  - `meta`

### Level log

- `error`
- `warn`
- `info`
- `debug`
- `verbose`

---

## 6. Error Handling

### Validation Error

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["field name is required", "email must be an email"]
}
```

### Unauthorized

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authentication credentials were missing or invalid."
}
```

### Forbidden

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You do not have permission to access this resource."
}
```

### Not Found

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Resource not found."
}
```

### Conflict

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Resource already exists or conflict detected."
}
```

### Internal Server Error

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred."
}
```

---

## 7. Security Standard

- **JWT**: gunakan access token untuk API.
- **Refresh Token**: simpan sebagai httpOnly secure cookie atau secure storage.
- **Password Hash**: gunakan `bcrypt` atau `argon2`.
- **Rate Limit**: implementasi throttling per IP dan per user untuk endpoint auth / sensitive.
- **CORS**: hanya izinkan origin frontend resmi.
- **Helmet**: gunakan untuk header keamanan default.
- **Validation**: pakai `class-validator` + `class-transformer` dan `ValidationPipe` global.
- **SQL Injection Protection**: gunakan Prisma query builder dan hindari query string manual.

---

## 8. Environment Variable

Daftar ENV yang akan digunakan:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `APP_NAME`
- `LOG_LEVEL`
- `CORS_ORIGINS`
- `TIMEZONE`
- `DEFAULT_LANGUAGE`

---

## 9. Code Style

### Import

- `import { Named } from '@nestjs/common';`
- urutkan import: built-in, eksternal, alias, relatif

### Penamaan Function

- gunakan `camelCase`
- contoh: `getUserById()`, `createUser()`

### Penamaan Variable

- gunakan `camelCase`
- contoh: `userId`, `orderStatus`

### Async/Await

- gunakan `async/await`
- selalu gunakan `try/catch` pada boundary service/controller yang menangani error
- hindari `.then()` dalam kode bisnis utama

### Transaction Prisma

- gunakan `prisma.$transaction([...])` untuk operasi multi-step atomik
- pisahkan logika transaksi ke service khusus ketika perlu
- jangan menulis transaksi panjang di controller

---

## 10. Development Rules

- Jangan mengubah frontend.
- Semua endpoint harus kompatibel dengan frontend saat ini.
- Semua dummy service nantinya hanya diganti menjadi API.
- Tidak boleh mengubah workflow ERP yang sudah ada.
- Backend foundation harus fokus pada infrastrukur, konfigurasi, dan standar sebelum implementasi business logic.

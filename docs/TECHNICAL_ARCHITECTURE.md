# SecureShare V1 — Technical Architecture

## System Architecture

### High-Level Design

SecureShare uses a **3-tier architecture**:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Presentation │────▶│   Business   │────▶│     Data         │
│    (Bolt UI)  │◀────│   (FastAPI)  │◀────│  (PostgreSQL +   │
│              │     │              │     │   File System)   │
└──────────────┘     └──────────────┘     └──────────────────┘
   Next.js              Python             PostgreSQL + Disk
   Tailwind CSS         AES-256            Encrypted Storage
   React                JWT/Bcrypt         Audit Logs
```

### Component Interaction

```
Browser ──HTTP──▶ Next.js ──API──▶ FastAPI ──SQL──▶ PostgreSQL
                     │                │
                     │                ├──Read/Write──▶ File System
                     │                │                (Encrypted)
                     │                │
                     └─────JWT────────┘
```

---

## API Architecture

### REST API Endpoints

| Method | Endpoint                     | Auth | Description              |
|--------|------------------------------|------|--------------------------|
| POST   | `/api/auth/register`         | No   | Register new user        |
| POST   | `/api/auth/login`            | No   | Login, get JWT token     |
| GET    | `/api/auth/me`               | Yes  | Get user profile         |
| POST   | `/api/files/upload`          | Yes  | Upload & encrypt file    |
| GET    | `/api/files/`                | Yes  | List user's files        |
| GET    | `/api/files/{file_id}`       | Yes  | Get file metadata        |
| GET    | `/api/files/{id}/download`   | No*  | Download & decrypt file  |
| DELETE | `/api/files/{file_id}`       | Yes  | Delete file              |
| GET    | `/`                          | No   | Health check             |
| GET    | `/health`                    | No   | Detailed health check    |

*Download is public for public files, may require password.

### Request/Response Flow

```
Client Request
    │
    ▼
┌──────────────────────┐
│  CORS Middleware      │  ← Verify origin (localhost:3000)
│  (Cross-Origin)      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  OAuth2 Middleware    │  ← Extract JWT from Authorization header
│  (Token Extraction)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Pydantic Validation │  ← Validate request body/params
│  (Input Validation)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Route Handler       │  ← Business logic
│  (Endpoint Function) │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Response Model      │  ← Format response
│  (Pydantic Schema)   │
└──────────┘
```

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────────────┐
│        USERS         │
├──────────────────────┤
│ id          PK  INT  │
│ username    UQ  STR  │
│ email       UQ  STR  │
│ hashed_password  STR │
│ created_at      DT   │
└─────────┬────────────┘
          │
          │ 1:N (one user has many files)
          │
          ▼
┌──────────────────────┐
│        FILES         │
├──────────────────────┤
│ id          PK  INT  │
│ file_id     UQ  STR  │──── Public identifier
│ original_filename STR│
│ stored_path     STR  │──── Path to encrypted file
│ file_size       INT  │
│ mime_type       STR  │
│ encryption_key  STR  │──── AES-256 key (hex)
│ encryption_iv   STR  │──── AES IV (hex)
│ file_hash       STR  │──── SHA-256 fingerprint
│ owner_id    FK  INT  │──── → users.id
│ password_hash   STR  │──── Optional Bcrypt hash
│ expires_at      DT   │
│ is_one_time    BOOL  │
│ is_downloaded  BOOL  │
│ download_count  INT  │
│ max_downloads   INT  │
│ is_public      BOOL  │
│ created_at      DT   │
└─────────┬────────────┘
          │
          │ 1:N (one file has many download logs)
          │
          ▼
┌──────────────────────┐
│    DOWNLOAD_LOGS     │
├──────────────────────┤
│ id          PK  INT  │
│ file_id     FK  INT  │──── → files.id
│ downloaded_by   STR  │
│ ip_address      STR  │
│ user_agent      STR  │
│ downloaded_at   DT   │
└──────────────────────┘
```

---

## Data Flow Diagrams

### File Upload Flow

```
User ──[Select File]──▶ Bolt UI ──[HTTP POST multipart]──▶ FastAPI
                                                              │
                                                    ┌─────────┴─────────┐
                                                    │ 1. Verify JWT     │
                                                    │ 2. Validate size  │
                                                    │ 3. Read file data │
                                                    └─────────┬─────────┘
                                                              │
                                                    ┌─────────┴─────────┐
                                                    │ 4. SHA-256 hash   │
                                                    │    (fingerprint)  │
                                                    └─────────┬─────────┘
                                                              │
                                                    ┌─────────┴─────────┐
                                                    │ 5. Generate key   │
                                                    │    (256-bit)      │
                                                    │ 6. Generate IV    │
                                                    │    (128-bit)      │
                                                    └─────────┬─────────┘
                                                              │
                                                    ┌─────────┴─────────┐
                                                    │ 7. AES-256-CBC    │
                                                    │    ENCRYPT        │
                                                    └─────────┬─────────┘
                                                              │
                                              ┌───────────────┴───────────────┐
                                              │                               │
                                              ▼                               ▼
                                     ┌──────────────┐              ┌──────────────┐
                                     │  File System  │              │  PostgreSQL   │
                                     │  Store .enc   │              │  Store meta   │
                                     └──────────────┘              └──────────────┘
                                                              │
FastAPI ──[JSON: file_id, URL]──▶ Bolt UI ──[Show Link]──▶ User
```

### File Download Flow

```
User ──[Click Link]──▶ Bolt UI ──[GET /download]──▶ FastAPI
                                                        │
                                              ┌─────────┴─────────┐
                                              │ 1. Find in DB     │
                                              │ 2. Check expired  │
                                              │ 3. Check password │
                                              │ 4. Check limits   │
                                              │ 5. Check one-time │
                                              └─────────┬─────────┘
                                                        │
                                              ┌─────────┴─────────┐
                                              │ 6. Read .enc file │
                                              │ 7. AES-256 DECRYPT│
                                              └─────────┬─────────┘
                                                        │
                                              ┌─────────┴─────────┐
                                              │ 8. SHA-256 verify │
                                              │    (integrity)    │
                                              └─────────┬─────────┘
                                                        │
                                              ┌─────────┴─────────┐
                                              │ 9. Update count   │
                                              │ 10. Log download  │
                                              └─────────┬─────────┘
                                                        │
FastAPI ──[Binary: file data]──▶ Browser ──[Save As]──▶ User
```

---

## Authentication Flow

```
┌───────────┐                    ┌───────────┐                 ┌───────────┐
│  Browser  │                    │  FastAPI  │                 │ PostgreSQL│
└─────┬─────┘                    └─────┬─────┘                 └─────┬─────┘
      │                                │                             │
      │── POST /register ────────────▶│                             │
      │   {user, email, pass}         │                             │
      │                                │── Bcrypt(pass) ───────────▶│
      │                                │   Store hash               │
      │◀── 201 Created ──────────────│                             │
      │                                │                             │
      │── POST /login ──────────────▶│                             │
      │   {user, pass}                │                             │
      │                                │── Find user ──────────────▶│
      │                                │◀── User + hash ───────────│
      │                                │                             │
      │                                │── Bcrypt verify ──────────│
      │                                │   pass vs hash             │
      │                                │                             │
      │                                │── Create JWT ──────────────│
      │                                │   {sub: user, exp: 1hr}    │
      │◀── {access_token} ──────────│                             │
      │                                │                             │
      │── GET /files ────────────────▶│                             │
      │   Authorization: Bearer JWT   │                             │
      │                                │── Verify JWT ──────────────│
      │                                │── Extract username ────────│
      │                                │── Find user ──────────────▶│
      │                                │◀── User object ───────────│
      │◀── {files: [...]} ──────────│                             │
```

---

## Security Architecture

### Encryption Details

| Parameter      | Value                    | Purpose                    |
|----------------|--------------------------|----------------------------|
| Algorithm      | AES-256-CBC              | Symmetric encryption       |
| Key Size       | 256 bits (32 bytes)      | Encryption strength        |
| IV Size        | 128 bits (16 bytes)      | Prevent pattern detection  |
| Block Size     | 128 bits (16 bytes)      | AES standard               |
| Padding        | PKCS7                    | Handle non-aligned data    |
| Key Storage    | PostgreSQL (hex encoded) | Key persistence            |

### Password Security

| Parameter      | Value              | Purpose                      |
|----------------|--------------------|------------------------------|
| Algorithm      | Bcrypt             | Password hashing             |
| Salt           | Auto-generated     | Prevent rainbow tables       |
| Work Factor    | 12 rounds          | Brute-force resistance       |
| Output         | 60-char hash       | Stored in database           |

### Token Security

| Parameter      | Value              | Purpose                      |
|----------------|--------------------|------------------------------|
| Format         | JWT (JSON Web Token)| Stateless authentication    |
| Algorithm      | HS256              | Token signing                |
| Expiry         | 60 minutes         | Limit token lifetime         |
| Claims         | sub, exp           | User identity + expiry       |

---

## Frontend Architecture

### Next.js App Router Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout (nav, footer, providers)
│   ├── page.tsx            # Landing page (hero, features)
│   ├── login/page.tsx      # Login form
│   ├── register/page.tsx   # Registration form
│   ├── dashboard/page.tsx  # User's file dashboard
│   ├── upload/page.tsx     # File upload with options
│   └── download/
│       └── [fileId]/
│           └── page.tsx    # Download page (password prompt)
├── components/
│   ├── Navbar.tsx          # Navigation bar
│   ├── Footer.tsx          # Site footer
│   ├── FileCard.tsx        # File display card
│   ├── UploadZone.tsx      # Drag-and-drop upload
│   └── ProgressBar.tsx     # Upload progress bar
└── lib/
    ├── api.ts              # API client (fetch wrapper)
    └── auth.tsx            # Auth context & provider
```

### State Management

```
AuthProvider (Context API)
├── user: User | null
├── token: string | null
├── login(username, password)
├── register(username, email, password)
├── logout()
└── isAuthenticated: boolean
```

---

## Performance Considerations

| Optimization              | Implementation                        |
|---------------------------|---------------------------------------|
| Database Indexing         | file_id, username, email indexed      |
| Async I/O                | SQLAlchemy async + FastAPI async      |
| File Streaming            | Large files streamed (not buffered)   |
| Connection Pooling        | SQLAlchemy pool for DB connections    |
| Code Splitting            | Next.js automatic per-route splitting |
| Lazy Loading              | Components loaded on demand           |
| Docker Layer Caching      | Requirements installed before code    |

# 🔐 SecureShare — Enterprise Zero-Trust Cryptographic File Vault

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![Security](https://img.shields.io/badge/Encryption-AES--256--CBC-red?logo=lock&logoColor=white)
![Tests](https://img.shields.io/badge/Pytest-38%2F38%20Passing-brightgreen?logo=pytest&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

<p><strong>A zero-trust, defense-in-depth secure file sharing platform engineered with applied cryptography, mandatory owner access approval, bit-level integrity verification, and anti-forensic data destruction.</strong></p>

[Quick Start](#-getting-started) • [Security Architecture](#-security-architecture) • [Access Request Workflow](#-access-request--owner-approval-workflow) • [API Reference](#-api-reference) • [Test Suite](#-automated-testing--verification)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Security Architecture & Cryptography](#-security-architecture--cryptography)
- [Access Request & Owner Approval Workflow](#-access-request--owner-approval-workflow)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Docker Setup](#docker-setup)
- [Automated Testing & Verification](#-automated-testing--verification)
- [API Reference](#-api-reference)
- [Project Directory Structure](#-project-directory-structure)
- [Documentation Index](#-documentation-index)

---

## 🚀 Overview

Standard cloud storage platforms (Google Drive, Dropbox, FTP) encrypt data in transit but frequently retain plaintext or server-managed keys at rest. If storage disks or administrative credentials are breached, confidential files are vulnerable to unauthorized exposure or silent tampering.

**SecureShare** solves this problem by enforcing a **Zero-Trust Security Model**:
1. Files are encrypted on-the-fly with **AES-256-CBC** using keys derived via client-server **ECDH (Elliptic-Curve Diffie-Hellman)** key exchange.
2. Shared links are **restricted by default**—recipients cannot download files until the file owner explicitly reviews and approves their access request.
3. Every downloaded file is verified with **SHA-256 hashing** before delivery to ensure zero tampering or bit corruption.
4. User identities are guarded by **Bcrypt password hashing** and mandatory **RFC 6238 TOTP Two-Factor Authentication (Google Authenticator)**.

---

## ✨ Key Features

### 🛡️ Applied Cryptography & Zero-Trust Storage
- **Ephemeral ECDH P-256 Handshake:** Client and server negotiate public keys via the WebCrypto API and derive a session key using HKDF-SHA256, protecting against Man-in-the-Middle (MitM) eavesdropping.
- **AES-256-CBC File Encryption:** Military-grade 256-bit symmetric encryption at rest. Unique random 128-bit Initialization Vectors (IV) ensure identical files yield distinct ciphertexts.
- **SHA-256 Integrity Fingerprint:** A SHA-256 digest is generated on upload and strictly verified prior to decryption. Any bit modification raises an immediate `HTTP 500` tamper alert.

### 🔐 Owner Approval & Access Request System
- **Restricted Shared Links:** Uploaded files generate private sharing links (`/download/[fileId]`). Visiting an unapproved link displays an **Access Restricted** status.
- **Recipient Request Workflow:** Recipients click **Request Access**, notifying the owner with request status set to `PENDING`.
- **Owner Control Dashboard:** File owners review pending requests and have one-click **Approve** and **Reject** controls.
- **Granular Revocation:** File owners can revoke previously approved access permissions at any time, instantly invalidating future download attempts.
- **Strict Backend Authorization:** Unauthorized visitors or link forwarders attempting direct API calls are rejected with `HTTP 401 Unauthorized` or `HTTP 403 Forbidden`.

### 🔑 Identity & Threat Defense
- **Bcrypt Salted Hashing:** Passwords are hashed with an adaptive work factor and per-user cryptographic salts to thwart rainbow table and GPU brute-force attacks.
- **TOTP 2FA (RFC 6238):** Hardware-synced Time-based One-Time Passwords (compatible with Google Authenticator, Authy) generated via HMAC-SHA1 over a 30-second time step.
- **Brute-Force Rate Limiting (`SlowAPI`):** Token-bucket rate limiting restricts authentication endpoints to 5 attempts per minute per IP, blocking automated credential stuffing.
- **Anti-Forensic File Shredding:** When a file is deleted, raw sectors on disk are overwritten with cryptographically pseudo-random bytes (`os.urandom`) and synced to physical media via `os.fsync()` before deletion.
- **Comprehensive Audit Telemetry:** Tracks `FILE_UPLOADED`, `ACCESS_REQUESTED`, `ACCESS_APPROVED`, `ACCESS_REJECTED`, `ACCESS_REVOKED`, `FILE_DOWNLOADED`, and `UNAUTHORIZED_ACCESS_ATTEMPT` with client IP and user agent.

---

## 🔒 Security Architecture & Cryptography

| Algorithm / Mechanism | Standard / Specification | Purpose | Layer |
|:---|:---|:---|:---|
| **ECDH (P-256)** | NIST SP 800-56A | Ephemeral asymmetric key agreement | Transport / Upload Handshake |
| **HKDF-SHA256** | RFC 5869 | Extracts and expands uniform 256-bit AES keys from shared ECDH point | Key Derivation |
| **AES-256-CBC** | FIPS 197 / NIST SP 800-38A | Bulk payload confidentiality at rest | Storage / In-Memory Decryption |
| **SHA-256** | FIPS 180-4 | Bit-level data integrity and tamper detection | Payload Verification |
| **Bcrypt** | OpenBSD Blowfish Cipher | Adaptive password hashing with random per-user salt | Identity Verification |
| **TOTP 2FA** | RFC 6238 / RFC 4226 | Time-based 6-digit one-time authentication codes | Multi-Factor Authentication |
| **JWT (HMAC-SHA256)** | RFC 7519 | Stateless bearer authentication token (60 min expiry) | Session Authorization |
| **DoD File Shredding** | DoD 5220.22-M Concept | Random byte overwrite + disk sync before unlink | Anti-Forensics Data Deletion |

---

## 🔄 Access Request & Owner Approval Workflow

```text
[ Recipient opens /download/{fileId} ]
                  │
                  ▼
   Does recipient have APPROVED status?
         ├── YES ──► Decrypt AES-256-CBC ──► Verify SHA-256 ──► Download File
         │
         └── NO
              │
              ▼
    Displays "Access Restricted"
              │
              ▼
   Recipient clicks "Request Access"
              │
              ▼
   Backend creates AccessRequest (status = PENDING)
              │
              ▼
   File Owner views Dashboard -> "Access Requests" Tab
              │
              ├── Click [Approve] ──► Status = APPROVED ──► Recipient unlocks Download
              │
              ├── Click [Reject]  ──► Status = REJECTED ──► Recipient sees Access Denied
              │
              └── Click [Revoke]  ──► Status = REVOKED  ──► Download immediately blocked (403)
```

---

## 🛠 Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, TypeScript
- **Cryptography:** WebCrypto API (Browser client), `cryptography` & `pycryptodome` (Python core), `pyotp` (TOTP 2FA)
- **Database:** SQLite (Async local development via `aiosqlite`), PostgreSQL (Production via `asyncpg`)
- **Security & Ops:** SlowAPI (Rate Limiting), Docker & Docker Compose, Pytest (Async Test Engine)

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** >= 18.x and **npm**
- **Python** >= 3.11 (3.12 recommended)
- **Git**
- *(Optional)* **Docker & Docker Compose**

---

### Local Development Setup

#### 1. Clone Repository
```bash
git clone https://github.com/Yashaswini2114sm/secureshare.git
cd secureshare
```

#### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
- Interactive API Docs (Swagger UI): **`http://localhost:8000/docs`**
- Alternative Docs (ReDoc): **`http://localhost:8000/redoc`**

#### 3. Frontend Setup
Open a new terminal window:
```bash
cd secureshare/frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
- Web Application: **`http://localhost:3000`**

---

### Docker Setup

To run the complete production container stack (Frontend, Backend, and PostgreSQL):

```bash
cd secureshare/backend
docker compose up -d --build
```

---

## 🧪 Automated Testing & Verification

SecureShare contains a comprehensive automated test suite with **38 test cases** covering 100% of cryptographic routines, authentication boundaries, and access approval flows.

```bash
cd backend
source venv/bin/activate
pytest -v
```

### Test Suite Summary:
- **Authentication Suite (13 tests):** User registration, duplicate username/email checks, email validation, password strength, TOTP 2FA generation and validation, invalid 2FA rejection, profile retrieval, expired token rejection.
- **Cryptography Suite (11 tests):** 256-bit key generation, 128-bit IV randomness, AES-256 roundtrip encryption/decryption, binary payloads, large files (10KB+), wrong-key failure, SHA-256 avalanche effect, bit-level integrity verification, ECDH P-256 key agreement.
- **File Operations & Access Control Suite (14 tests):** Authenticated upload, unauthorized upload rejection (401), empty file rejection, file listing, password-protected downloads, one-time self-destructing downloads, secure shredding on deletion, unauthorized download rejection without token (401), non-approved user download blocking (403), full Access Request and Owner Approval workflow, Request Rejection, and Owner Access Revocation enforcement.

**Status:** `38 passed in ~19s (100% pass rate)`

---

## 📚 API Reference

### 🔐 Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `POST` | `/api/auth/register` | Register new user account; returns TOTP secret and QR code URI | No |
| `POST` | `/api/auth/login` | Authenticate with username, password, and 6-digit TOTP code; returns JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer JWT |

### 📁 File Management Endpoints (`/api/files`)

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `POST` | `/api/files/upload` | Upload and encrypt file with AES-256-CBC, ECDH public key, optional password/expiry | Bearer JWT |
| `GET` | `/api/files/` | List files uploaded by authenticated user | Bearer JWT |
| `GET` | `/api/files/{file_id}` | Retrieve file metadata | Bearer JWT |
| `GET` | `/api/files/{file_id}/download` | Decrypt and download file (verifies SHA-256, requires owner or approved access) | Bearer JWT / Query Token |
| `DELETE`| `/api/files/{file_id}` | Overwrite disk sectors with random bytes and shred database record | Bearer JWT (Owner Only) |

### 🛡️ Access Control & Approval Endpoints (`/api/files`)

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `GET` | `/api/files/{file_id}/access-status` | Check caller's relationship with file (`NONE`, `PENDING`, `APPROVED`, `REJECTED`, `REVOKED`) | Optional JWT |
| `POST` | `/api/files/{file_id}/request-access` | Recipient submits request to access private file | Bearer JWT |
| `GET` | `/api/files/access-requests/owner` | List all incoming access requests for files owned by user | Bearer JWT (Owner Only) |
| `POST` | `/api/files/access-requests/{id}/approve` | Owner approves access request for recipient | Bearer JWT (Owner Only) |
| `POST` | `/api/files/access-requests/{id}/reject` | Owner rejects access request | Bearer JWT (Owner Only) |
| `POST` | `/api/files/access-requests/{id}/revoke` | Owner revokes previously granted permission | Bearer JWT (Owner Only) |

---

## 📂 Project Directory Structure

```text
secureshare/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application, CORS, SlowAPI limiter
│   │   ├── config.py            # Pydantic environment configuration
│   │   ├── database.py          # SQLAlchemy async session & table initializer
│   │   ├── models.py            # Database models (User, File, AccessRequest, AuditLog)
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── auth.py              # Bcrypt, JWT handler, TOTP 2FA, auth dependencies
│   │   ├── encryption.py        # AES-256-CBC, ECDH P-256, HKDF, SHA-256, shredder
│   │   └── routers/
│   │       ├── auth_router.py   # Registration, 2FA login, profile routes
│   │       └── file_router.py   # Upload, download, access requests & approvals
│   ├── tests/
│   │   ├── conftest.py          # Pytest async fixtures & isolated test DB setup
│   │   ├── test_auth.py         # Authentication & 2FA tests (13 tests)
│   │   ├── test_encryption.py   # Cryptography & integrity tests (11 tests)
│   │   └── test_files.py        # File operations, access requests & approvals (14 tests)
│   ├── Dockerfile               # Backend Docker container specification
│   ├── docker-compose.yml       # Production multi-container orchestration
│   └── requirements.txt         # Python dependencies
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/page.tsx   # Owner dashboard with My Files and Access Requests tabs
│   │   ├── download/[fileId]/   # Access-restricted download page with Request button
│   │   ├── upload/page.tsx      # Secure upload page with live Cryptographic Console
│   │   ├── login/page.tsx       # Login page with password and 2FA TOTP input
│   │   ├── register/page.tsx    # User registration with QR code 2FA setup
│   │   └── layout.tsx           # Glassmorphism dark UI layout & navigation
│   ├── components/              # Reusable UI components (Navbar, FileCard, UploadZone)
│   ├── lib/
│   │   ├── api.ts               # Centralized API client with JWT attachment & crypto calls
│   │   └── auth.tsx             # React Auth context and session management
│   └── package.json             # Next.js and frontend dependencies
│
└── docs/
    ├── ALGORITHMS_EXPLAINED.md  # In-depth breakdown of all 8 cryptographic algorithms
    ├── INTERVIEW_GUIDE.md       # ESA Rubrics alignment, defense strategies, and top Q&A
    ├── PROJECT_OVERVIEW.md      # High-level architecture and feature documentation
    ├── REVIEW_1_DOCUMENTATION.md# Project review report and implementation analysis
    ├── SECURITY_ARCHITECTURE.md # Defense-in-depth model and threat mitigations
    └── SETUP_AND_DEPLOYMENT.md  # Detailed deployment instructions for local and cloud
```

---

## 📖 Documentation Index

For in-depth explanations and interview preparation, refer to the documents in [`docs/`](docs/):

- 📘 [**Algorithms Explained**](docs/ALGORITHMS_EXPLAINED.md) — Detailed mathematical and implementation analysis of AES-256, ECDH, HKDF, SHA-256, Bcrypt, and TOTP.
- 🎓 [**Interview Guide & Rubrics Defense**](docs/INTERVIEW_GUIDE.md) — Mapped directly to academic evaluation rubrics with model answers to common security questions.
- 🏗️ [**Technical Architecture**](docs/TECHNICAL_ARCHITECTURE.md) — Detailed system design, data flow diagrams, and schema specifications.
- 🚢 [**Setup and Deployment Guide**](docs/SETUP_AND_DEPLOYMENT.md) — Comprehensive guide for configuring environments and deploying with Docker.

---

<div align="center">
  <sub>Engineered with precision for advanced Computer Networks & Security (CNS).</sub>
</div>

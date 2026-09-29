# 🔐 SecureShare — Enterprise-Grade Cryptographic File Vault

<div align="center">
  <p><strong>A zero-trust, defense-in-depth file sharing platform built for modern security engineering.</strong></p>
</div>

---

## 🚀 Overview

SecureShare is a full-stack secure file sharing platform engineered to prioritize data confidentiality, integrity, and identity verification. Designed as an advanced Computer Networks & Security (CNS) project, it moves beyond basic CRUD operations by implementing real-world applied cryptography and DevSecOps principles.

## ✨ Security Architecture

- **Elliptic-Curve Diffie-Hellman (ECDH)** — Ephemeral P-256 key exchange to prevent Man-in-the-Middle (MitM) attacks during file uploads.
- **AES-256-CBC Encryption** — Military-grade symmetric file encryption for data-at-rest.
- **SHA-256 Integrity Verification** — Cryptographic hashing to detect file tampering or corruption.
- **Google Authenticator 2FA (TOTP)** — HMAC-SHA1 time-based one-time passwords for zero-trust identity verification.
- **DoD 5220.22-M File Shredding** — Anti-forensic data destruction overwrites disk sectors with cryptographic noise before inode deletion.
- **Brute-Force Protection** — Dynamic IP rate limiting (`SlowAPI`) to block automated intrusion attempts.
- **SIEM-Ready Audit Logging** — Comprehensive tracking of all security events (logins, failures, uploads) for incident response.
- **Bcrypt Password Hashing** — Irreversible, salted password hashing to neutralize rainbow table attacks.

## 🛠 Tech Stack

| Layer     | Technology       |
|-----------|------------------|
| Frontend  | Next.js, React, Tailwind CSS |
| Backend   | Python, FastAPI, SQLAlchemy |
| Database  | PostgreSQL |
| Cryptography | `cryptography`, `pyotp`, WebCrypto API |
| Infrastructure | Docker Compose, Prometheus, Grafana |

---

## ⚡ Quick Start (Docker)

The easiest way to run the entire stack (Frontend, Backend API, PostgreSQL Database) is via Docker.

```bash
# Clone the repository
git clone https://github.com/Yashaswini2114sm/secureshare.git
cd secureshare/backend

# Spin up the containers in detached mode
docker compose up -d --build
```

The app will instantly be available at:
- **Frontend App:** `http://localhost:3000`
- **Backend API Docs (Swagger):** `http://localhost:8000/docs`

---

## 📖 Documentation & Study Guides

| Document | Description |
|----------|-------------|
| [Project Overview](docs/PROJECT_OVERVIEW.md) | Detailed breakdown of all 8 cryptographic algorithms and why they matter. |
| [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) | System design, API, database schema |
| [Algorithms Explained](docs/ALGORITHMS_EXPLAINED.md) | AES-256, SHA-256, Bcrypt, JWT deep dives |
| [Interview Q&A](INTERVIEW_QUESTIONS_AND_ANSWERS.md) | 20 detailed technical interview questions for security roles. |

---

## 🧪 Local Development Setup

If you prefer to run the stack natively without Docker:

### 1. Backend API
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Next.js
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
secureshare/
├── backend/                 # FastAPI Python Server
│   ├── app/
│   │   ├── main.py         # App entry + Rate Limiting
│   │   ├── models.py       # SQL Models + AuditLogs
│   │   ├── auth.py         # JWT + Bcrypt + TOTP
│   │   ├── encryption.py   # AES-256 + ECDH
│   │   └── routers/        # API endpoints
│   └── docker-compose.yml
├── frontend/                # Next.js React UI
│   ├── app/                # Pages (App Router)
│   └── lib/                # API client & Auth state
└── docs/                    # Security Documentation
```

---

*Built with ❤️ and Math.*

# 🔐 SecureShare V1

**Secure File Sharing with AES-256 Encryption**

SecureShare is a full-stack secure file sharing platform that encrypts files before storage, ensuring complete data confidentiality. Built as a Computer Networks & Security (CNS) final year project.

---

## ✨ Features

- **AES-256-CBC Encryption** — Military-grade file encryption
- **SHA-256 Integrity** — File fingerprint verification on every download
- **JWT Authentication** — Stateless, secure user sessions
- **Bcrypt Password Hashing** — Irreversible password protection
- **Password-Protected Downloads** — Optional extra security layer
- **Auto-Expiration** — Files self-destruct after configurable time
- **One-Time Downloads** — File deactivates after first download
- **Download Tracking** — Full audit trail with IP logging
- **Real-Time Upload Progress** — Visual progress bar
- **Responsive Dark UI** — Glassmorphism design, works on all devices

---

## 🛠 Tech Stack

| Layer     | Technology       |
|-----------|------------------|
| Frontend  | Next.js + Tailwind CSS |
| Backend   | FastAPI (Python) |
| Database  | PostgreSQL / SQLite |
| Encryption| AES-256-CBC      |
| Hashing   | SHA-256 + Bcrypt |
| Auth      | JWT              |
| DevOps    | Docker Compose   |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker (Full Stack)
```bash
cd backend
docker-compose up --build
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Project Overview](docs/PROJECT_OVERVIEW.md) | Features, architecture, motivation |
| [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) | System design, API, database schema |
| [Algorithms Explained](docs/ALGORITHMS_EXPLAINED.md) | AES-256, SHA-256, Bcrypt, JWT |
| [Setup & Deployment](docs/SETUP_AND_DEPLOYMENT.md) | Installation, Docker, testing |
| [Interview Q&A](INTERVIEW_QUESTIONS_AND_ANSWERS.md) | 20 detailed interview questions |

---

## 🧪 Testing

```bash
cd backend
pytest tests/ -v --cov=app
```

---

## 📁 Project Structure

```
secureshare/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # App entry point
│   │   ├── config.py       # Settings
│   │   ├── database.py     # SQLAlchemy setup
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # JWT + Bcrypt
│   │   ├── encryption.py   # AES-256 + SHA-256
│   │   └── routers/        # API endpoints
│   ├── tests/              # Unit tests
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/                # Next.js frontend
│   ├── app/                # Pages (App Router)
│   ├── components/         # UI components
│   └── lib/                # API client, auth
├── docs/                    # Documentation
└── INTERVIEW_QUESTIONS_AND_ANSWERS.md
```

---

## 🔒 Security Architecture

```
Layer 1: Authentication  →  Bcrypt + JWT
Layer 2: Authorization   →  Ownership verification
Layer 3: Encryption      →  AES-256-CBC per file
Layer 4: Integrity       →  SHA-256 verification
Layer 5: Access Control  →  Expiry, one-time, password
Layer 6: Audit Trail     →  Download logging
```

---

## 📝 License

This project was built for educational purposes (CNS Final Year Project).

---

*Built with ❤️ using FastAPI, Next.js, and AES-256 encryption*

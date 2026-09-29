# SecureShare V1 — Setup & Deployment Guide

## Prerequisites

### Required Software

| Software      | Version  | Purpose                    | Install Command                    |
|---------------|----------|----------------------------|------------------------------------|
| Python        | 3.10+    | Backend runtime            | `brew install python`              |
| Node.js       | 18+      | Frontend runtime           | `brew install node`                |
| npm           | 9+       | Package manager            | (comes with Node.js)               |
| Git           | 2.0+     | Version control            | `brew install git`                 |
| Docker        | 24+      | Containerization (optional)| [docker.com](https://docker.com)   |

### Verify Installation

```bash
python3 --version    # Should show 3.10+
node --version       # Should show 18+
npm --version        # Should show 9+
git --version        # Should show 2.0+
docker --version     # Should show 24+ (optional)
```

---

## Section A: Local Development Setup

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd secureshare
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# Run the backend server
uvicorn app.main:app --reload --port 8000
```

Backend running at: **http://localhost:8000**
API Docs at: **http://localhost:8000/docs**

### Step 3: Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Run the frontend
npm run dev
```

Frontend running at: **http://localhost:3000**

### Step 4: Verify Everything Works

1. Open **http://localhost:3000** → You should see the landing page
2. Open **http://localhost:8000/docs** → You should see Swagger UI
3. Try registering a user via the UI
4. Upload a test file
5. Download the file and verify it's identical

---

## Section B: Docker Setup (Recommended for Production)

### Step 1: Build and Start

```bash
cd backend
docker-compose up --build
```

This starts:
- **FastAPI** on http://localhost:8000
- **PostgreSQL** on localhost:5432
- Both networked together

### Step 2: Verify Docker Services

```bash
# Check running containers
docker ps

# Expected output:
# secureshare-api    Up    0.0.0.0:8000->8000/tcp
# secureshare-db     Up    0.0.0.0:5432->5432/tcp
```

### Step 3: Stop Services

```bash
# Stop all containers
docker-compose down

# Stop and remove all data (clean restart)
docker-compose down -v
```

### Docker Architecture

```
┌─────────────────────────────────────────────┐
│              Docker Network                  │
│                                             │
│   ┌──────────────┐    ┌──────────────────┐  │
│   │  api          │    │  db              │  │
│   │  (FastAPI)    │───▶│  (PostgreSQL)    │  │
│   │  Port: 8000   │    │  Port: 5432      │  │
│   │               │    │                  │  │
│   │  /app/uploads │    │  secureshare_db  │  │
│   │  (volume)     │    │  (volume)        │  │
│   └──────────────┘    └──────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Section C: Testing

### Backend Unit Tests

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Run all tests with verbose output
pytest tests/ -v

# Run tests with coverage report
pytest tests/ -v --cov=app

# Run specific test file
pytest tests/test_auth.py -v
pytest tests/test_encryption.py -v
pytest tests/test_files.py -v
```

### Expected Test Output

```
tests/test_auth.py::test_register_user PASSED
tests/test_auth.py::test_register_duplicate_username PASSED
tests/test_auth.py::test_login_success PASSED
tests/test_auth.py::test_login_wrong_password PASSED
tests/test_auth.py::test_get_profile PASSED
tests/test_encryption.py::test_generate_key PASSED
tests/test_encryption.py::test_encrypt_decrypt PASSED
tests/test_encryption.py::test_wrong_key_fails PASSED
tests/test_encryption.py::test_file_hash PASSED
tests/test_encryption.py::test_verify_integrity_pass PASSED
tests/test_files.py::test_upload_file PASSED
tests/test_files.py::test_download_file PASSED
tests/test_files.py::test_one_time_download PASSED
tests/test_files.py::test_delete_file PASSED
...
```

### Manual API Testing (Swagger UI)

1. Open **http://localhost:8000/docs**
2. Test scenarios in order:

#### Scenario 1: Register User
```
POST /api/auth/register
Body: {"username": "testuser", "email": "test@example.com", "password": "SecurePass123"}
Expected: 201 Created
```

#### Scenario 2: Login User
```
POST /api/auth/login
Body: {"username": "testuser", "password": "SecurePass123"}
Expected: 200 OK with access_token
```

#### Scenario 3: Upload File
```
POST /api/files/upload
Header: Authorization: Bearer <token>
Body: (multipart form with file)
Expected: 201 Created with file_id
```

#### Scenario 4: Download File
```
GET /api/files/{file_id}/download
Expected: 200 OK with file content
```

#### Scenario 5: List Files
```
GET /api/files/
Header: Authorization: Bearer <token>
Expected: 200 OK with file list
```

#### Scenario 6: Delete File
```
DELETE /api/files/{file_id}
Header: Authorization: Bearer <token>
Expected: 200 OK
```

---

## Environment Variables Reference

| Variable               | Default                          | Description                    |
|------------------------|----------------------------------|--------------------------------|
| `APP_NAME`             | SecureShare                      | Application display name       |
| `DEBUG`                | false                            | Enable debug logging           |
| `DATABASE_URL`         | sqlite+aiosqlite:///./secure...  | Database connection string     |
| `JWT_SECRET_KEY`       | (must change)                    | Secret for signing JWT tokens  |
| `JWT_ALGORITHM`        | HS256                            | JWT signing algorithm          |
| `JWT_EXPIRATION_MINUTES`| 60                              | Token expiry in minutes        |
| `UPLOAD_DIR`           | ./uploads                        | Encrypted file storage path    |
| `MAX_FILE_SIZE_MB`     | 100                              | Maximum upload size            |
| `CORS_ORIGINS`         | http://localhost:3000             | Allowed frontend origins       |

---

## Troubleshooting

### Common Issues

| Issue                        | Solution                                          |
|------------------------------|---------------------------------------------------|
| "Module not found" error     | Run `pip install -r requirements.txt`             |
| Port 8000 already in use     | `kill -9 $(lsof -ti:8000)`                       |
| Port 3000 already in use     | `kill -9 $(lsof -ti:3000)`                       |
| Database connection error    | Check DATABASE_URL in .env                        |
| CORS error in browser        | Ensure CORS_ORIGINS includes frontend URL         |
| Docker build fails           | Run `docker-compose down -v` then try again       |
| JWT token expired            | Login again to get a new token                    |
| File upload fails            | Check MAX_FILE_SIZE_MB and UPLOAD_DIR permissions |

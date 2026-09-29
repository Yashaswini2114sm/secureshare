# ═══════════════════════════════════════════════════════════════════
# SecureShare Backend Dockerfile
# ═══════════════════════════════════════════════════════════════════
# Multi-stage build for production-ready Python image
# ═══════════════════════════════════════════════════════════════════

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for cryptography libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (Docker layer caching optimization)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8000

# Run the application with uvicorn
# --host 0.0.0.0: Listen on all interfaces (required for Docker)
# --port 8000: Application port
# --workers 2: Number of worker processes
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

# SecureShare V1 — Interview Guide & Presentation Points

This document provides exact talking points mapped to your Cryptography and Network Security (CNS) project rubrics to help you achieve an "Excellent (8-10)" score.

## Criteria 1: Problem Identification and Requirement Analysis
**The Problem:** Traditional cloud storage (like Google Drive) encrypts data in transit but stores it in plaintext or uses server-held keys. If the server is breached, the data is compromised.
**The Solution:** SecureShare provides a **Zero-Knowledge End-to-End Encrypted (E2EE)** architecture. 
**Requirement Justifications:**
- **AES-256-GCM:** We needed Authenticated Encryption. GCM not only encrypts the file but ensures it hasn't been tampered with (using an auth tag).
- **PBKDF2:** We needed a way to derive a strong cryptographic key from a weak human-readable password. We used PBKDF2 with 100,000 iterations to stop brute-force attacks.
- **WebCrypto API:** We needed to ensure the server never saw the file. We moved all cryptographic logic into the user's browser.
- **DoD 5220.22-M Deletion:** Traditional file deletion just removes the file index. We implemented a 7-pass overwrite to ensure forensic tools cannot recover deleted ciphertext.

## Criteria 2: Design and Planning
**Architecture:** 
- **Frontend (Next.js):** Handles the PBKDF2 derivation, AES-GCM encryption, Key Wrapping, and UI.
- **Backend (FastAPI):** A true "zero-knowledge" data layer. It receives encrypted blobs and wrapped keys, authenticates via JWT, and enforces rate limits (slowapi).
- **Monitoring (Prometheus/Grafana):** Containerized observability stack to monitor API traffic and detect volumetric DoS attacks.

## Common Interview Questions & Answers

**Q1: How does your End-to-End Encryption actually work?**
**A1:** When a user uploads a file, the browser generates a random AES-256 key. It encrypts the file. Then, it asks the user for a master password, derives a key using PBKDF2, and "wraps" (encrypts) the AES file key. The server only receives the encrypted file and the wrapped key.

**Q2: What happens if a hacker steals your PostgreSQL database?**
**A2:** They get nothing useful. Passwords are Bcrypt hashed. File keys are wrapped using PBKDF2. The file names are Base64/Encrypted, and the actual file blobs are AES-256-GCM encrypted. Without the user's master password, the data is cryptographically secure.

**Q3: How do you handle Brute Force attacks?**
**A3:** We implemented an active intrusion detection layer. If a user fails to login 5 times, their account is locked for 15 minutes. We also implemented `slowapi` rate limiting across the entire application (100 downloads/hour).

**Q4: What is Key Wrapping?**
**A4:** Key wrapping is encrypting an encryption key. AES-GCM is fast for large files, but we don't want to use a password directly as the file key. Instead, the random AES key encrypts the file, and the PBKDF2 password key wraps the AES key. This allows the user to change their password later without re-encrypting a 5GB file.

**Q5: How do you ensure Data Integrity?**
**A5:** We use two mechanisms: AES-GCM has a built-in authentication tag that throws an error if a single byte is flipped. We also calculate a SHA-256 hash of the encrypted blob in the browser, send it to the server, and verify it upon download.

# SecureShare — Enterprise-Grade Security Architecture Overview

## What is SecureShare?
SecureShare is a highly secure, cryptographic file-sharing platform designed for zero-trust environments. It allows users to securely upload, store, and share files utilizing advanced cryptographic protocols and defense-in-depth security mechanisms.

## Core Security Algorithms & Mechanisms

### 1. Elliptic-Curve Diffie-Hellman (ECDH) Key Exchange
*   **Where it is used:** File Upload process.
*   **How it works:** When a user uploads a file, the Browser (Client) generates an ephemeral `P-256` Elliptic Curve keypair, and the Python Backend (Server) generates its own `P-256` keypair. They exchange **public keys** over the network. Both sides use complex mathematics to derive the exact same **Shared Secret**, even though they never transmitted the secret itself.
*   **Why it's helpful:** It prevents Man-in-the-Middle (MitM) attacks. Even if a hacker intercepts the network traffic and steals the public keys, they cannot deduce the shared secret.

### 2. HKDF-SHA256 (Key Derivation)
*   **Where it is used:** Post-ECDH exchange.
*   **How it works:** The raw mathematical shared secret from ECDH isn't suitable to be used directly as an encryption key. We pass it through a Hash-based Key Derivation Function (HKDF) to expand it into a cryptographically strong, perfectly random 256-bit key.
*   **Why it's helpful:** It guarantees that the resulting AES key meets military-grade randomness and entropy requirements.

### 3. AES-256-CBC (Advanced Encryption Standard)
*   **Where it is used:** File Storage.
*   **How it works:** The actual file contents are encrypted using the derived 256-bit AES key in Cipher Block Chaining (CBC) mode with a randomized Initialization Vector (IV).
*   **Why it's helpful:** AES-256 is the gold standard for symmetric encryption, used by governments and banks worldwide. By encrypting the file at rest, even if the database or hard drive is stolen, the data remains completely unreadable.

### 4. SHA-256 (Data Integrity Hashing)
*   **Where it is used:** File Upload and Download.
*   **How it works:** We generate a unique cryptographic "fingerprint" (hash) of the plaintext file before encryption. 
*   **Why it's helpful:** When the file is decrypted later, we hash it again and compare it to the original. If a single byte was altered by a hacker or corrupted on the hard drive, the hashes will mismatch, and the system will reject the file. This guarantees **Data Integrity**.

### 5. TOTP (Time-Based One-Time Password) / 2FA
*   **Where it is used:** User Login.
*   **How it works:** During registration, a `base32` secret is generated and synced with an Authenticator app via QR code. The app uses the HMAC-SHA1 algorithm combined with the current Unix time to generate a unique 6-digit code every 30 seconds.
*   **Why it's helpful:** It prevents Account Takeover (ATO) attacks. Even if a user's password is stolen in a data breach, the hacker cannot log in because they do not physically possess the user's phone generating the offline codes.

### 6. Bcrypt (Password Hashing)
*   **Where it is used:** User Registration.
*   **How it works:** Passwords are never stored in plaintext. They are mathematically "salted" (random data added) and hashed using Bcrypt. 
*   **Why it's helpful:** Bcrypt is intentionally slow. If a hacker steals the database, they cannot easily guess the passwords using "Rainbow Tables" or brute-force hardware, keeping user accounts safe.

### 7. Secure File Shredding (Anti-Forensics)
*   **Where it is used:** File Deletion / One-Time Downloads.
*   **How it works:** Standard OS file deletion just removes the pointer to the file, leaving the data on the hard drive to be recovered by forensic software. SecureShare physically overwrites the file's bytes on the hard disk with random cryptographic noise before deleting the pointer.
*   **Why it's helpful:** Guarantees that deleted files are permanently destroyed and cannot be recovered by data-recovery tools or law enforcement.

### 8. Brute-Force Protection & Audit Logging
*   **Where it is used:** Application wide.
*   **How it works:** The API is protected by a Rate Limiter (`SlowAPI`) that blocks IP addresses making too many requests (e.g., >5 failed logins per minute). Furthermore, every security event (Logins, Failures, Uploads) is written to a SIEM-ready `AuditLog` database table.
*   **Why it's helpful:** Stops automated bot attacks and provides a forensic trail (observability) to detect compromised accounts and track insider threats.

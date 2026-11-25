# SecureShare — Comprehensive Interview Guide & Review Defense Points

This document provides exact talking points mapped directly to the **Evaluation Rubric for Team Activity (ESA)** to help you and your team achieve an **"Excellent" (Max Marks)** rating in both **Design and Implementation (10 Marks)** and **Demonstration and Presentation (5 Marks)**.

---

## Rubric Breakdown & Your Defense Strategy

### Criteria 1: Problem Identification and Requirement Analysis (Rubric: Excellent 8–10)
*   **The Problem:** Standard cloud file storage solutions (Google Drive, Dropbox) encrypt data in transit but store files with server-managed keys or plaintext at rest. If the backend storage is breached or unauthorized insider administrators access the disks, confidential files are exposed. Furthermore, silent bit-rot or malicious tampering goes undetected.
*   **The Solution:** SecureShare provides a localized, defense-in-depth secure file sharing platform enforcing zero-trust confidentiality, bit-for-bit integrity, and cryptographic access control.
*   **Requirement Justifications (CNS Focus):**
    *   **AES-256-CBC:** Chosen for file encryption at rest because 256-bit AES is mathematically unbreakable by brute force ($2^{256}$ keyspace). CBC mode ensures each block depends on the preceding ciphertext block, preventing frequency and pattern analysis.
    *   **ECDH (Elliptic-Curve Diffie-Hellman P-256):** Used during the upload handshake. The browser (client) and FastAPI (server) exchange public keys over the WebCrypto API, deriving a shared secret without ever transmitting the secret itself over the network.
    *   **HKDF-SHA256:** Expands the raw ECDH shared secret into an uniformly random 256-bit AES key conforming to cryptographic standards.
    *   **SHA-256 Hashing:** Chosen for data integrity verification because SHA-256 is collision-resistant and produces a unique 256-bit fingerprint. The avalanche effect guarantees that flipping even a single bit in a file changes the entire hash.
    *   **Bcrypt:** Chosen for user password storage over MD5/SHA because Bcrypt incorporates an adaptive work factor (cost) and automatic per-password salting, neutralizing rainbow tables and GPU brute-forcing.
    *   **TOTP 2FA (RFC 6238):** Time-based One-Time Passwords generated via HMAC-SHA1 on a shared Base32 secret every 30 seconds prevent account takeovers even if passwords are leaked.

---

### Criteria 2: Design and Planning (Rubric: Excellent 8–10)
*   **System Architecture:** Decoupled modern 3-tier architecture:
    *   *Frontend (Client):* Next.js (React 19, Tailwind CSS) utilizing browser `window.crypto.subtle` for client-side ECDH key generation and QR code rendering for 2FA.
    *   *Backend (Security Core):* FastAPI (Python 3.12) implementing the cryptographic engine (`pycryptodome`, `cryptography`), rate limiting (`slowapi`), and JWT authentication.
    *   *Data & Storage Layer:* Database (PostgreSQL / SQLite via SQLAlchemy async) holding user hashes, file metadata, and audit logs. The filesystem stores only unreadable encrypted ciphertext blobs.
*   **Cryptographic Workflow:**
    *   *Upload Pipeline:* Browser generates ECDH P-256 Keypair $\rightarrow$ Transmits client public key $\rightarrow$ Server generates server ECDH keypair $\rightarrow$ Derives shared secret via HKDF-SHA256 $\rightarrow$ Computes SHA-256 fingerprint $\rightarrow$ Encrypts file with AES-256-CBC + random IV $\rightarrow$ Stores ciphertext on disk and metadata in DB.
    *   *Download Pipeline:* Access authorization checked (token/password/expiry/one-time) $\rightarrow$ Ciphertext read from disk $\rightarrow$ Decrypted in-memory with AES-256-CBC $\rightarrow$ SHA-256 computed on decrypted bytes and verified against DB fingerprint $\rightarrow$ Audit log recorded $\rightarrow$ File served to user.
*   **Team Task Allocation:**
    *   **Yashaswini M & Sneha MC:** Frontend Architecture, Next.js dashboard, WebCrypto ECDH client integration, responsive UI/UX, and QR-code 2FA flow.
    *   **Chinmayi H:** Backend Security Core, AES-256-CBC cipher engine, SHA-256 integrity verifier, ECDH HKDF key derivation, and Bcrypt password hashing.
    *   **Harshita B:** Database Architecture (SQLAlchemy async models, migrations), Audit Logging, SlowAPI rate limiting, Docker containerization, and test suite execution.

---

### Criteria 3: Implementation and Technical Competency (Rubric: Excellent 8–10)
*   **Defense-in-Depth Mechanisms:**
    1.  *Ephemeral ECDH (P-256) Key Exchange:* Resists Man-in-the-Middle (MitM) attacks.
    2.  *AES-256-CBC Symmetric Encryption:* Guaranteed confidentiality at rest.
    3.  *SHA-256 Integrity Verification:* Detects tampering or corruption before delivering file.
    4.  *TOTP 2FA (Google Authenticator):* Neutralizes credential stuffing and password theft.
    5.  *One-Time Self-Destructing Files:* Deactivates links immediately after the first download.
    6.  *Anti-Forensic Secure File Shredding:* Overwrites file bytes on physical disk with `os.urandom(file_size)` and executes `os.fsync()` before unlinking.
    7.  *Brute-Force Rate Limiting:* Enforces a maximum of 5 login attempts per minute via `slowapi`.
    8.  *Security Audit Logging:* Tracks `LOGIN_SUCCESS`, `LOGIN_FAILED`, `2FA_FAILED`, and download telemetry with IP addresses and user agents.

---

### Criteria 4: Testing, Validation and Security Analysis (Rubric: Excellent 8–10)
*   **Test Suite Coverage:** Comprehensive 38-test automated suite executed via Pytest:
    *   *Authentication Suite (13 tests):* Registration, duplicate username rejection, duplicate email rejection, email format validation, password length checks, login with 2FA TOTP, rejection of missing 2FA code, rejection of invalid 2FA code, wrong password handling, profile retrieval, token validity checks.
    *   *Encryption Suite (11 tests):* Key length validation (256-bit key, 128-bit IV), key uniqueness, encryption/decryption roundtrip, large file tests (10KB+), binary data integrity, wrong-key decryption failure, SHA-256 deterministic behavior, avalanche effect verification, integrity pass/fail scenarios, and ECDH P-256 key exchange verification.
    *   *File Operations & Access Control Suite (14 tests):* Authenticated upload, unauthorized upload rejection, empty file rejection, file listing, download and decryption, password-protected download, one-time download enforcement, secure file deletion with shredding, non-existent file error handling, unauthorized download rejection (401), non-approved user download blocking (403), full Access Request and Owner Approval workflow, Request Rejection workflow, and Owner Access Revocation enforcement.
*   **Running the Tests:** Run `pytest` inside `backend/` to demonstrate 100% test pass rate live:
    ```bash
    cd backend
    venv/bin/pytest -v
    ```

---

## Top 10 Professor Questions & Model Answers

### Q1: What makes your file sharing secure compared to Google Drive or standard FTP?
**Answer:** In standard cloud storage or FTP, the server either holds the plaintext or manages static encryption keys. If the server is compromised or an insider admin inspects the storage disk, files are exposed. SecureShare applies defense-in-depth: files are encrypted on-the-fly using AES-256-CBC with unique random keys derived via ECDH key exchange; they have SHA-256 integrity verification; user logins are protected with hardware-synced TOTP 2FA; and when files are deleted, they are physically overwritten with random noise (anti-forensics).

### Q2: Why did you choose AES-256 in CBC mode instead of ECB mode?
**Answer:** ECB (Electronic Codebook) encrypts each block independently, which preserves plaintext patterns (the famous "ECB Penguin" phenomenon). In contrast, CBC (Cipher Block Chaining) XORs each plaintext block with the preceding ciphertext block before encryption, utilizing a randomized Initialization Vector (IV) for the first block. This produces pseudorandom ciphertext where identical blocks of plaintext encrypt to completely different ciphertext.

### Q3: Why is SHA-256 necessary if you are already encrypting with AES-256?
**Answer:** Encryption provides **Confidentiality** (making data unreadable), while SHA-256 provides **Integrity** (proving data has not been altered or corrupted). In CBC mode without an HMAC or hash check, bit-flipping attacks on the ciphertext can alter decrypted plaintext blocks without detection. By calculating a SHA-256 fingerprint on upload and verifying it on download, we guarantee bit-for-bit authenticity.

### Q4: How does the ECDH (Elliptic-Curve Diffie-Hellman) exchange work in your project?
**Answer:** In the browser, Next.js calls `window.crypto.subtle.generateKey` on the `P-256` curve to generate an ephemeral keypair and transmits the public key to the backend. The FastAPI server generates its own ephemeral `P-256` keypair and computes the shared point on the elliptic curve. Both sides pass this shared point through HKDF-SHA256 to derive the exact same 256-bit AES key. Even if an attacker intercepts the network traffic, the discrete logarithm problem on elliptic curves makes it computationally infeasible to deduce the private keys or the shared secret.

### Q5: Why did you choose Bcrypt for passwords instead of SHA-256?
**Answer:** SHA-256 is designed to be fast (handling gigabytes per second), which makes it vulnerable to GPU-accelerated brute-force and dictionary attacks (billions of hashes per second). Bcrypt is intentionally slow and CPU-intensive, incorporates an adaptive work factor (rounds), and generates a unique random 128-bit salt for every password. This renders rainbow tables and mass brute-force attacks completely impractical.

### Q6: How does your Time-Based One-Time Password (TOTP) 2FA function?
**Answer:** During registration, SecureShare generates a cryptographically random 160-bit Base32 secret and encodes it into an `otpauth://` QR code. The user scans it with Google Authenticator. Both the server and the app use the RFC 6238 algorithm: they take the current Unix timestamp divided by 30 (the time step) and compute HMAC-SHA1 of this counter using the shared secret, truncating the result into a 6-digit code. Because the code changes every 30 seconds and is calculated offline, account takeovers are prevented even if a user's password is leaked.

### Q7: What is "Secure File Shredding" and why is normal OS deletion not enough?
**Answer:** When an operating system deletes a file (e.g. `rm` or `os.remove`), it only removes the filesystem index pointer, leaving the actual file bytes intact on the physical disk sectors until overwritten. Anyone with basic forensic tools (like Autopsy or Photorec) can recover the data. SecureShare implements cryptographic shredding: before unlinking the file, it opens the raw file in binary write mode, overwrites all bytes with cryptographic randomness from `os.urandom()`, flushes it with `os.fsync()`, and only then removes the file.

### Q8: How does the system prevent Brute-Force and Denial of Service (DoS) attacks?
**Answer:** We implemented rate limiting using `slowapi` backed by token-bucket algorithms. For example, the `/api/auth/login` endpoint is rate-limited to 5 requests per minute per IP address. If an automated bot exceeds this limit, HTTP 429 Too Many Requests is returned, and all failed attempts are recorded in the `audit_logs` table for security auditing.

### Q9: What happens during a One-Time Download?
**Answer:** When the uploader flags a file as "One-Time", the `is_one_time` boolean is set in the database. When the recipient downloads the file, the server marks `is_downloaded = True`. Any subsequent attempt to access the link is rejected with HTTP 403 Forbidden ("One-time download already used"), ensuring confidential files cannot be repeatedly accessed or leaked.

### Q10: How do you demonstrate and validate that your cryptographic engine actually works?
**Answer:** We have two validations:
1.  **Automated Unit Tests:** 38 comprehensive Pytest test cases covering authentication, encryption, integrity, and access-control lifecycle with 100% pass rate.
2.  **Live Visual Crypto Console:** When a file is uploaded in the frontend, the UI renders a live "Cryptographic Engine Console" displaying the Client ECDH Public Key, Server ECDH Public Key, Derived HKDF AES Key, AES-IV, SHA-256 Hash, and Ciphertext bytes sample in real time.

### Q11: How does the Access Request and Owner Approval system work?
**Answer:** In standard file sharing, anyone with a link can download the file. In SecureShare, shared links are restricted by default:
1. When a recipient opens the link, the backend checks authorization. If not approved, it displays an "Access Restricted" screen with a **Request Access** button.
2. The recipient clicks "Request Access", which sends an access request to the file owner and updates the status to `PENDING`.
3. The owner's dashboard has an **Access Requests** tab showing pending requests with the requester's username, email, and file name.
4. The owner can click **Approve** or **Reject**.
5. Only if the owner approves does the backend grant download permissions (`APPROVED`).
6. Even if an unauthorized user copies or forwards the download URL or calls the `/download` API directly, the backend strictly rejects the request with HTTP 403 Forbidden.

### Q12: Can the owner revoke access after granting it?
**Answer:** Yes. The owner can click **Revoke Access** on any previously approved request at any time. The database status immediately changes to `REVOKED`, an audit log event `ACCESS_REVOKED` is generated, and any future download attempts by that recipient are instantly blocked with HTTP 403 Forbidden.

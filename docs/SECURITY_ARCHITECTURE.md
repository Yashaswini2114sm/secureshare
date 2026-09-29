# SecureShare V1 — Security Architecture

## 1. Threat Models & Mitigations

| Threat | Mitigation |
|--------|------------|
| Server Breach (Database stolen) | Files are AES-256-GCM encrypted. Server only stores the wrapped key, which requires the user's master password to unlock. |
| Server Breach (Hard Drives stolen) | Disk contents are completely encrypted. |
| Man-in-the-Middle (MitM) | TLS 1.3 ensures transport security. Payload is encrypted before leaving the browser. |
| Data Tampering / Corruption | SHA-256 hashes of the ciphertext are verified upon download. AES-GCM provides authenticated encryption to prevent plaintext tampering. |
| Brute Force Login | Account locks for 15 minutes after 5 failed login attempts. |
| Forensic Data Recovery | Files are deleted using the DoD 5220.22-M 7-pass overwrite standard before OS removal. |
| Denial of Service (DoS) | Strict API rate limiting (e.g., 100 requests/minute) using `slowapi`. |

## 2. Security Layers
1. **Transport:** HTTPS/TLS 1.3 (Enforced via Nginx/Reverse Proxy in Prod).
2. **Authentication:** Bcrypt (Passwords) + JWT (Session tokens).
3. **Authorization:** User ID ownership verification in PostgreSQL.
4. **Encryption in Transit:** TLS 1.3.
5. **Encryption at Rest (Zero-Knowledge):** WebCrypto AES-256-GCM in the browser.
6. **Data Integrity:** SHA-256 + GCM Authentication Tag.
7. **Key Derivation:** PBKDF2 (100,000 iterations).
8. **Key Wrapping:** AES-KW algorithm in the browser.
9. **Secure Deletion:** DoD 5220.22-M 7-pass overwrite.
10. **Intrusion Detection:** Prom/Grafana monitoring, Brute-Force lockout, and Rate Limiting.

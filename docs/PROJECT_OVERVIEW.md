# SecureShare V1 — Project Overview

## What is SecureShare?
SecureShare V1 is a production-grade, zero-knowledge file-sharing platform designed with End-to-End Encryption (E2EE). It allows users to securely upload, store, and share files without trusting the server.

## Why it Matters (The Problem)
Most cloud storage providers encrypt data in transit but store the encryption keys on their servers. If their servers are compromised, user data is exposed. SecureShare solves this using a **Zero-Knowledge Architecture**.

## Key Features
1. **Zero-Knowledge E2EE:** Files are encrypted in the browser using the WebCrypto API. The server never sees the plaintext file or the encryption key.
2. **Key Wrapping:** The random AES-256-GCM file key is wrapped (encrypted) with a PBKDF2 key derived from the user's master password before being sent to the server.
3. **DoD 5220.22-M Secure Deletion:** When a file is deleted, it is overwritten 7 times with zeros, ones, and random data before the OS inode is removed, preventing forensic recovery.
4. **Intrusion Detection:** Strict rate limiting (100 downloads/hour) and brute-force protection (lockout after 5 failed login attempts).
5. **Observability:** Full Prometheus metrics and Grafana dashboards tracking system health and API traffic.
6. **Access Controls:** Support for one-time downloads, password protection, and time-based expiration.

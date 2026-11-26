# 🏛️ SecureShare — Complete Architecture Diagrams & Specifications

This document provides visual architectural diagrams using **Mermaid.js** standard notation. These diagrams can be previewed directly in GitHub, IDE Markdown previewers, or exported into presentation slides via [Mermaid Live Editor](https://mermaid.live).

---

## 1. High-Level 3-Tier System Architecture

This diagram illustrates the decoupling between the Client Presentation Tier, the FastAPI Application & Security Core Tier, and the Persistent Data & Storage Tier.

```mermaid
graph TB
    subgraph Presentation_Tier ["🌐 Presentation Tier (Client / Next.js 16)"]
        UI["Web UI (React 19 / Tailwind CSS)"]
        WebCrypto["WebCrypto API (ECDH P-256 Keygen)"]
        AuthContext["Auth Context (JWT / Session State)"]
        QRCodeGen["QR Code Renderer (2FA Onboarding)"]
    end

    subgraph Security_App_Tier ["🛡️ Application & Security Core (FastAPI / Python 3.12)"]
        CORS["CORS & Rate Limiter (SlowAPI)"]
        JWTAuth["JWT Bearer Authenticator (python-jose)"]
        TOTPEngine["TOTP 2FA Engine (RFC 6238 / pyotp)"]
        AccessGuard["Owner Authorization & Access Request Gate"]
        
        subgraph CryptoEngine ["🔒 Applied Cryptography Core"]
            ECDH["ECDH P-256 Key Agreement"]
            HKDF["HKDF-SHA256 Key Derivation"]
            AES["AES-256-CBC Cipher Engine"]
            Hasher["SHA-256 Integrity Verifier"]
            Shredder["Anti-Forensic Disk Shredder (os.urandom)"]
        end
    end

    subgraph Data_Storage_Tier ["💾 Data & Storage Tier"]
        DB[(SQLAlchemy Async DB<br/>SQLite / PostgreSQL)]
        Disk["Encrypted Blob Storage (./uploads/)"]
    end

    %% Interactions
    UI -->|"1. HTTPS / JSON"| CORS
    WebCrypto -->|"2. Ephemeral Client Public Key (Hex)"| ECDH
    CORS --> JWTAuth
    JWTAuth --> TOTPEngine
    TOTPEngine --> AccessGuard
    
    AccessGuard -->|"3. Authorized Pipeline"| CryptoEngine
    AccessGuard -->|"4. Check Status / Log Events"| DB
    
    CryptoEngine -->|"5. Store / Read Ciphertext"| Disk
    CryptoEngine -->|"6. Store / Verify SHA-256 & Keys"| DB
```

---

## 2. Access Request & Owner Approval Flow (Sequence Diagram)

This sequence diagram depicts how shared files remain restricted until the file owner reviews and grants permission to a specific recipient.

```mermaid
sequenceDiagram
    autonumber
    actor Sender as 👑 File Owner (Sender)
    actor Recipient as 👤 Recipient (User B)
    participant UI as 💻 Next.js Frontend
    participant API as 🛡️ FastAPI Gateway
    participant DB as 🗄️ Database (SQLAlchemy)
    participant FS as 📁 Encrypted File Storage

    %% Upload
    Sender->>UI: Selects file & clicks Upload
    UI->>UI: WebCrypto generates ECDH P-256 Keypair
    UI->>API: POST /api/files/upload (File + Client PubKey)
    API->>API: Derives AES-256 key via HKDF, computes SHA-256, encrypts with AES-256-CBC
    API->>FS: Writes ciphertext blob to disk
    API->>DB: Stores metadata & returns sharing link
    API-->>Sender: File ID (e.g. 400bdcff) & Sharing URL

    %% Recipient visits link
    Note over Recipient, API: Recipient opens shared link
    Recipient->>UI: Opens /download/{file_id}
    UI->>API: GET /api/files/{file_id}/access-status
    API->>DB: Queries access_requests table
    DB-->>API: Status = NONE
    API-->>UI: access_status: "NONE", is_owner: false
    UI-->>Recipient: Displays "Access Restricted" + [Request Access] button

    %% Request Access
    Recipient->>UI: Clicks [Request Access]
    UI->>API: POST /api/files/{file_id}/request-access
    API->>DB: Inserts AccessRequest (status = "PENDING")
    API->>DB: Logs AuditLog (ACCESS_REQUESTED)
    API-->>UI: "Access request submitted"
    UI-->>Recipient: Displays "⏳ Pending Owner Approval"

    %% Owner Approves
    Note over Sender, API: Owner reviews requests on Dashboard
    Sender->>UI: Opens Dashboard -> "Access Requests" Tab
    UI->>API: GET /api/files/access-requests/owner
    API->>DB: Selects requests for files owned by Sender
    DB-->>API: Returns User B request (PENDING)
    API-->>UI: Displays User B details with [Approve] / [Reject]
    Sender->>UI: Clicks [Approve]
    UI->>API: POST /api/files/access-requests/{id}/approve
    API->>DB: Updates AccessRequest status = "APPROVED"
    API->>DB: Logs AuditLog (ACCESS_APPROVED)
    API-->>UI: Success

    %% Recipient Downloads
    Note over Recipient, FS: Recipient downloads the approved file
    Recipient->>UI: Clicks [Refresh Approval Status]
    UI->>API: GET /api/files/{file_id}/access-status
    API-->>UI: access_status: "APPROVED" (Unlocks Download Button)
    Recipient->>UI: Clicks [Download File]
    UI->>API: GET /api/files/{file_id}/download (with JWT Token)
    API->>DB: Verifies status == "APPROVED"
    API->>FS: Reads raw ciphertext bytes
    API->>API: Decrypts AES-256-CBC in memory
    API->>API: Verifies SHA-256 hash matches database digest
    API->>DB: Logs DownloadLog & AuditLog (FILE_DOWNLOADED)
    API-->>UI: Returns decrypted file stream with Content-Disposition
    UI-->>Recipient: File successfully saved to disk!
```

---

## 3. Cryptographic Data Flow Architecture

A detailed look at the applied cryptographic algorithms guarding confidentiality, authenticity, and integrity across the transport and storage layers.

```mermaid
flowchart TD
    subgraph ClientUpload ["Browser Upload (WebCrypto)"]
        RawFile["📄 Plaintext File"]
        ClientEC["Generate Ephemeral ECDH Keypair<br/>(P-256 Curve)"]
        ClientPub["Client Public Key (Hex)"]
        ClientEC --> ClientPub
    end

    subgraph ServerUpload ["Server Ingestion & Encryption"]
        ServerEC["Generate Ephemeral ECDH Keypair<br/>(P-256 Curve)"]
        SharedPoint["Calculate Elliptic Curve Shared Secret<br/>(Discrete Logarithm Hardness)"]
        ClientPub --> SharedPoint
        ServerEC --> SharedPoint
        
        HKDF["HKDF-SHA256 Derivation Engine"]
        SharedPoint --> HKDF
        AESKey["256-bit AES Session Key"]
        HKDF --> AESKey

        GenIV["Generate Cryptographic Random IV<br/>(128-bit / os.urandom)"]
        ComputeHash["Compute Bit-level SHA-256 Fingerprint<br/>(Digest = 64 Hex Chars)"]
        RawFile --> ComputeHash
        RawFile --> EncryptBlock

        EncryptBlock["AES-256-CBC Encryption<br/>(PKCS#7 Padding)"]
        AESKey --> EncryptBlock
        GenIV --> EncryptBlock

        Ciphertext["🔒 Encrypted Binary Payload (.enc)"]
        EncryptBlock --> Ciphertext
    end

    subgraph StorageLayer ["Zero-Trust Storage"]
        Ciphertext --> DiskStorage[("Disk: ./uploads/<br/>(Unreadable Ciphertext Blob)")]
        ComputeHash --> DBStorage[("Database: files table<br/>(Key, IV, Hash, Metadata)")]
        GenIV --> DBStorage
        AESKey --> DBStorage
    end

    subgraph DownloadVerify ["Secure Decryption & Verification"]
        DiskStorage --> ReadDisk["Read Ciphertext Blob"]
        DBStorage --> ReadParams["Fetch IV, Key & SHA-256 Hash"]
        ReadDisk --> DecryptEngine["AES-256-CBC Decryption Engine"]
        ReadParams --> DecryptEngine
        
        DecryptedBytes["Plaintext In-Memory Bytes"]
        DecryptEngine --> DecryptedBytes
        
        IntegrityCheck{"SHA-256 Verification<br/>Hash(Decrypted) == Stored Hash?"}
        DecryptedBytes --> IntegrityCheck
        
        IntegrityCheck -- "MATCH (Bit-for-Bit Authentic)" --> Deliver["✅ Stream File to User"]
        IntegrityCheck -- "MISMATCH (Tampered / Corrupt)" --> Abort["❌ HTTP 500 Tamper Alert (Halt)"]
    end
```

---

## 4. Entity-Relationship Diagram (Database Architecture)

This ER diagram illustrates the database models, relations, primary/foreign keys, and data types enforced in `backend/app/models.py`.

```mermaid
erDiagram
    USERS ||--o{ FILES : "owns"
    USERS ||--o{ ACCESS_REQUESTS : "submits"
    USERS ||--o{ AUDIT_LOGS : "generates"
    FILES ||--o{ ACCESS_REQUESTS : "governs"
    FILES ||--o{ DOWNLOAD_LOGS : "logs"

    USERS {
        int id PK "Auto-increment primary key"
        string username UK "Unique username (max 50)"
        string email UK "Unique email (max 100)"
        string hashed_password "Bcrypt salted hash (cost 12)"
        string totp_secret "Base32 secret (160-bit)"
        boolean is_2fa_enabled "Enforce RFC 6238 TOTP"
        datetime created_at "Account creation timestamp (UTC)"
    }

    FILES {
        int id PK "Internal primary key"
        string file_id UK "8-character public identifier"
        string original_filename "Human-readable filename"
        string stored_path "Path to encrypted file on disk"
        int file_size "File size in bytes"
        string mime_type "MIME format (e.g. application/pdf)"
        string encryption_key "AES-256 key (64 hex characters)"
        string encryption_iv "Initialization Vector (32 hex)"
        string file_hash "SHA-256 integrity hash (64 hex)"
        int owner_id FK "References USERS.id"
        string password_hash "Optional Bcrypt file password"
        datetime expires_at "Optional link expiration timer"
        boolean is_one_time "Self-destruct after 1 download"
        boolean is_downloaded "Track if one-time file was consumed"
        int download_count "Telemetry counter"
        int max_downloads "Download limit (0 = unlimited)"
        boolean is_public "Flag for public vs private access"
        datetime created_at "Upload timestamp (UTC)"
    }

    ACCESS_REQUESTS {
        int id PK "Auto-increment primary key"
        int file_id FK "References FILES.id"
        int user_id FK "References USERS.id (Requester)"
        string status "PENDING | APPROVED | REJECTED | REVOKED"
        datetime created_at "Request timestamp (UTC)"
        datetime updated_at "Decision timestamp (UTC)"
    }

    DOWNLOAD_LOGS {
        int id PK "Auto-increment primary key"
        int file_id FK "References FILES.id"
        string downloaded_by "Username of downloader"
        string ip_address "Client IP address (IPv4 / IPv6)"
        string user_agent "Client browser / device metadata"
        datetime downloaded_at "Download timestamp (UTC)"
    }

    AUDIT_LOGS {
        int id PK "Auto-increment primary key"
        int user_id FK "Optional user ID"
        string action "Event: LOGIN, 2FA_FAILED, ACCESS_APPROVED, etc."
        string ip_address "Client IP address"
        string user_agent "Client user-agent string"
        datetime timestamp "Security event timestamp (UTC)"
    }
```

---

## 5. Security Defense-in-Depth Model

```mermaid
graph LR
    subgraph Layer1 ["1. Network & Transport"]
        MitM["MitM Prevention (ECDH P-256)"]
        TLS["HTTPS / TLS Transport Security"]
        RateLimit["Rate Limiting (SlowAPI - 5/min)"]
    end

    subgraph Layer2 ["2. Identity & Access"]
        Bcrypt["Bcrypt Password Hashing + Salts"]
        TOTP["Google Authenticator TOTP 2FA"]
        JWT["HMAC-SHA256 Bearer Token"]
        Approval["Owner-Mediated Access Approval"]
    end

    subgraph Layer3 ["3. Payload Confidentiality & Integrity"]
        AES["AES-256-CBC Payload Encryption"]
        HKDF["HKDF-SHA256 Uniform Key Derivation"]
        SHA["Bit-for-Bit SHA-256 Integrity Fingerprint"]
        OneTime["One-Time Download Invalidation"]
    end

    subgraph Layer4 ["4. Data-at-Rest & Anti-Forensics"]
        Disk["Zero-Plaintext Ciphertext Blobs"]
        Shred["DoD 5220.22-M Sector Overwrite (os.urandom)"]
        Audit["Immutable SIEM-Ready Audit Telemetry"]
    end

    Layer1 --> Layer2 --> Layer3 --> Layer4
```

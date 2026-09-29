# SecureShare V1 — Algorithms Explained

This document explains every algorithm used in SecureShare in simple language,
with real-world analogies and step-by-step breakdowns.

---

## 1. AES-256-CBC (File Encryption)

### What Is It?
AES (Advanced Encryption Standard) is a method to **scramble data** so nobody
can read it without the secret key.

### Real-World Analogy
Think of a **combination lock on a safe**:
- The safe = your file
- The combination = the encryption key
- Locking the safe = encryption
- Opening the safe = decryption
- Without the combination, the safe stays locked forever

### How AES-256-CBC Works Step-by-Step

```
Original File: "Hello World! This is my secret document."

Step 1: GENERATE KEY
├── Create random 256-bit key (32 bytes)
│   Key: a1b2c3d4e5f6...  (64 hex characters)
│
├── Create random 128-bit IV (Initialization Vector)
│   IV: f1e2d3c4...  (32 hex characters)
│
│   Why IV? → Same file + same key WITHOUT IV = same encrypted output
│             Same file + same key WITH IV = different encrypted output each time
│             This prevents attackers from detecting patterns

Step 2: PADDING (PKCS7)
├── AES works in 16-byte blocks
├── File must be exact multiple of 16 bytes
├── If file is 42 bytes → pad to 48 bytes (next multiple of 16)
│   Padding = 6 bytes, each with value 0x06
│   "Hello World! This is my secret document." + 0x06 0x06 0x06 0x06 0x06 0x06

Step 3: SPLIT INTO BLOCKS
├── Block 1: "Hello World! Th"  (16 bytes)
├── Block 2: "is is my secret"  (16 bytes)
├── Block 3: " document." + pad (16 bytes)

Step 4: ENCRYPT EACH BLOCK (CBC Mode)
├── Block 1: XOR with IV, then AES encrypt with Key → Ciphertext 1
├── Block 2: XOR with Ciphertext 1, then AES encrypt → Ciphertext 2
├── Block 3: XOR with Ciphertext 2, then AES encrypt → Ciphertext 3
│
│   CBC = Cipher Block Chaining
│   Each block depends on the previous → one change affects ALL subsequent blocks

Step 5: OUTPUT
└── Encrypted file = Ciphertext 1 + Ciphertext 2 + Ciphertext 3
    Looks like: 7f8a2b... (random garbage, unreadable)
```

### Why AES-256?

| Feature          | Details                                           |
|------------------|---------------------------------------------------|
| Key Size         | 256 bits = 2^256 possible keys                    |
| Combinations     | More than atoms in the observable universe         |
| Brute Force Time | Billions of years (even with supercomputers)       |
| Used By          | US Government, banks, military, Bitcoin wallets    |
| Known Weakness   | None (as of 2024)                                 |
| Speed            | Very fast (hardware acceleration available)        |

### Code Implementation

```python
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

def encrypt_file(file_data, key_hex, iv_hex):
    key = bytes.fromhex(key_hex)      # Convert hex string to bytes
    iv = bytes.fromhex(iv_hex)
    cipher = AES.new(key, AES.MODE_CBC, iv)  # Create cipher
    padded = pad(file_data, 16)       # Pad to multiple of 16
    return cipher.encrypt(padded)     # Encrypt!

def decrypt_file(encrypted_data, key_hex, iv_hex):
    key = bytes.fromhex(key_hex)
    iv = bytes.fromhex(iv_hex)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = cipher.decrypt(encrypted_data)
    return unpad(decrypted, 16)       # Remove padding
```

---

## 2. SHA-256 (File Integrity)

### What Is It?
SHA-256 (Secure Hash Algorithm) creates a **unique fingerprint** for any data.
Like a human fingerprint identifies a person, SHA-256 identifies a file.

### Real-World Analogy
Think of a **fingerprint scanner at a secure building**:
- When you register, your fingerprint is recorded
- Every time you enter, your fingerprint is scanned
- If fingerprints match → you're verified ✓
- If they don't match → access denied ✗
- You can't fake someone else's fingerprint

### How SHA-256 Works

```
Input:  "Hello World"
Output: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"

Key Properties:
├── FIXED LENGTH: Always 64 hex characters (256 bits), regardless of input size
│   "Hi"           → 64 chars
│   "War and Peace" → 64 chars
│   1GB video file → 64 chars
│
├── DETERMINISTIC: Same input ALWAYS produces same output
│   SHA-256("Hello") = "185f8db..." (always)
│   SHA-256("Hello") = "185f8db..." (always)
│
├── AVALANCHE EFFECT: Tiny input change → completely different output
│   SHA-256("Hello")  = "185f8db..."
│   SHA-256("Hello!") = "334d016..." (completely different!)
│
├── ONE-WAY: Cannot reverse the hash back to original data
│   "185f8db..." → ??? (impossible to get "Hello" back)
│
└── COLLISION RESISTANT: Practically impossible to find two different
    inputs that produce the same hash
```

### How SecureShare Uses SHA-256

```
UPLOAD TIME:
┌──────────────────┐     ┌──────────────┐     ┌──────────────┐
│ Original File    │────▶│  SHA-256     │────▶│  Store Hash  │
│ "Hello World"    │     │  Algorithm   │     │  in Database │
│                  │     │              │     │  "a591a6..."  │
└──────────────────┘     └──────────────┘     └──────────────┘

DOWNLOAD TIME:
┌──────────────────┐     ┌──────────────┐     ┌──────────────┐
│ Decrypted File   │────▶│  SHA-256     │────▶│  Compare     │
│ "Hello World"    │     │  Algorithm   │     │  with stored │
│                  │     │  "a591a6..." │     │  "a591a6..." │
└──────────────────┘     └──────────────┘     └──────────────┘
                                                     │
                                              ┌──────┴──────┐
                                              │             │
                                           MATCH        MISMATCH
                                           File OK ✓    Tampered! ✗
```

### Code Implementation

```python
import hashlib

def calculate_file_hash(file_data):
    """Calculate SHA-256 fingerprint of file."""
    return hashlib.sha256(file_data).hexdigest()

def verify_file_integrity(file_data, expected_hash):
    """Compare current hash with stored hash."""
    actual_hash = calculate_file_hash(file_data)
    return actual_hash == expected_hash  # True = file is intact
```

---

## 3. Bcrypt (Password Hashing)

### What Is It?
Bcrypt is a one-way function that turns passwords into unreadable hashes.
Unlike encryption, hashing is **irreversible** — you cannot get the password back.

### Real-World Analogy
Think of **putting a document through a paper shredder**:
- Original document (password) → Shredder (Bcrypt) → Shredded pieces (hash)
- You can verify: "Does this document match those pieces?" (by shredding it again)
- But you can NEVER reassemble the pieces back into the original document

### Why Not Store Passwords Directly?

```
BAD APPROACH (Plain text):
┌─────────────────────────────┐
│ Database                    │
│ user: john, pass: Secret123 │ ← If hacked, attacker gets ALL passwords
│ user: jane, pass: MyPass456 │
└─────────────────────────────┘

GOOD APPROACH (Bcrypt hash):
┌───────────────────────────────────────────┐
│ Database                                   │
│ user: john, hash: $2b$12$LJ3m4YZ...      │ ← If hacked, attacker gets
│ user: jane, hash: $2b$12$Xk9pWq...       │   useless hashes (can't reverse)
└───────────────────────────────────────────┘
```

### How Bcrypt Works

```
Password: "SecurePass123"

Step 1: GENERATE SALT
├── Salt = random bytes (unique per password)
│   Salt: "$2b$12$LJ3m4YZ"
│
│   Why salt? → Without salt, same password always produces same hash
│               Attackers could use "rainbow tables" (pre-computed hashes)
│               With salt, every hash is unique even for identical passwords

Step 2: HASH
├── Combine password + salt
├── Run through Bcrypt algorithm 2^12 times (4096 iterations)
│   This is INTENTIONALLY SLOW (takes ~250ms)
│   Why slow? → Attacker trying billions of passwords = billions × 250ms = years
│
├── Output: "$2b$12$LJ3m4YZ...K8pNq2" (60 characters)
│
│   Format breakdown:
│   $2b$   = Bcrypt version
│   12$    = Cost factor (2^12 = 4096 iterations)
│   LJ3m4Y = Salt (22 chars)
│   Z...   = Hash (31 chars)

Step 3: STORE
└── Save entire string "$2b$12$LJ3m4YZ...K8pNq2" in database
```

### Login Verification

```
User types: "SecurePass123"
                │
                ▼
┌──────────────────────────┐
│ Extract salt from stored │
│ hash: "$2b$12$LJ3m4YZ"  │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Hash input with same     │
│ salt and cost factor     │
│ Bcrypt("SecurePass123",  │
│        "$2b$12$LJ3m4YZ") │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Compare result with      │
│ stored hash              │
│                          │
│ Match? → Login OK ✓      │
│ No match? → Rejected ✗   │
└──────────────────────────┘
```

### Code Implementation

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"])

def hash_password(password):
    """Hash a password (one-way, irreversible)."""
    return pwd_context.hash(password)
    # Returns: "$2b$12$LJ3m4YZ..."

def verify_password(plain_password, hashed_password):
    """Check if a password matches its hash."""
    return pwd_context.verify(plain_password, hashed_password)
    # Returns: True or False
```

---

## 4. JWT (JSON Web Token) Authentication

### What Is It?
JWT is a **digital pass** that proves who you are without sending your password
every time. Like a concert wristband — show it once, you're in.

### Real-World Analogy
Think of a **hotel keycard**:
- Check-in (login): Show ID → Receive keycard
- Use keycard: Swipe to enter room, gym, pool (no ID needed each time)
- Keycard expires: After checkout, it stops working
- Keycard is verifiable: Hotel can check if it's genuine

### JWT Structure

```
A JWT looks like this (three parts separated by dots):

eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2huIiwiZXhwIjoxNzA5MTIzNDU2fQ.sK8f9pQ2...

Part 1: HEADER (Algorithm info)
{
  "alg": "HS256",      ← Signing algorithm
  "typ": "JWT"         ← Token type
}
Encoded: eyJhbGciOiJIUzI1NiJ9

Part 2: PAYLOAD (User data)
{
  "sub": "john",       ← Subject (username)
  "exp": 1709123456    ← Expiration (Unix timestamp)
}
Encoded: eyJzdWIiOiJqb2huIiwiZXhwIjoxNzA5MTIzNDU2fQ

Part 3: SIGNATURE (Authenticity proof)
HMAC-SHA256(
  header + "." + payload,
  SECRET_KEY             ← Only the server knows this
)
Encoded: sK8f9pQ2...
```

### JWT Authentication Flow

```
┌────────┐                          ┌────────┐
│ Client │                          │ Server │
└───┬────┘                          └───┬────┘
    │                                   │
    │── POST /login ───────────────────▶│
    │   {"user":"john","pass":"123"}    │
    │                                   │── Verify password (Bcrypt)
    │                                   │── Create JWT
    │                                   │   {sub:"john", exp:+1hr}
    │                                   │── Sign with SECRET_KEY
    │◀── {"access_token":"eyJ..."} ────│
    │                                   │
    │── GET /files ────────────────────▶│
    │   Authorization: Bearer eyJ...   │
    │                                   │── Extract JWT from header
    │                                   │── Verify signature
    │                                   │── Check not expired
    │                                   │── Extract username from "sub"
    │◀── {"files": [...]} ────────────│
    │                                   │
    │── GET /files (after 1 hour) ────▶│
    │   Authorization: Bearer eyJ...   │
    │                                   │── JWT expired!
    │◀── 401 Unauthorized ────────────│
```

### Code Implementation

```python
from jose import jwt
from datetime import datetime, timedelta, timezone

SECRET_KEY = "your-secret-key"

def create_access_token(data):
    """Create a JWT token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

def verify_token(token):
    """Verify a JWT token and extract username."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return payload.get("sub")  # Returns username or None
```

---

## Algorithm Comparison Table

| Feature      | AES-256          | SHA-256          | Bcrypt           | JWT              |
|-------------|------------------|------------------|------------------|------------------|
| Type        | Encryption       | Hashing          | Password Hash    | Token            |
| Reversible  | ✅ Yes (with key)| ❌ No            | ❌ No            | ✅ Yes (decode)  |
| Purpose     | Hide data        | Verify data      | Protect passwords| Prove identity   |
| Key needed  | ✅ Yes           | ❌ No            | ❌ No            | ✅ Yes (secret)  |
| Output size | Same as input    | Fixed 256 bits   | Fixed 60 chars   | Variable         |
| Speed       | Very fast        | Very fast        | Intentionally slow| Very fast       |
| Used for    | File encryption  | File integrity   | Password storage | Authentication   |

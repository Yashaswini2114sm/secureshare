"""
SecureShare Encryption Module
===============================
Provides AES-256-CBC file encryption, SHA-256 integrity hashing,
and secure random key generation.

Algorithms Used:
    - AES-256-CBC: Encrypts files (reversible with key)
    - SHA-256:     Creates file fingerprints (irreversible, for integrity)

How AES-256-CBC Works (Simplified):
    1. Generate a random 256-bit (32-byte) key
    2. Generate a random 128-bit (16-byte) IV (Initialization Vector)
    3. Split file into 16-byte blocks
    4. Each block is XOR'd with previous encrypted block (chaining)
    5. First block is XOR'd with IV (no previous block exists)
    6. Result: file looks like random garbage (encrypted)
    7. To decrypt: reverse the process with same key + IV

Why AES-256?
    - Military-grade encryption standard
    - 2^256 possible keys (impossibly many to brute-force)
    - Used by banks, governments, and the US military
    - No known mathematical weakness
"""

import hashlib
import os
from typing import Tuple

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.serialization import PublicFormat, Encoding


# AES block size is always 16 bytes (128 bits)
AES_BLOCK_SIZE = 16


def generate_encryption_key() -> Tuple[str, str]:
    """
    Generate a random AES-256 encryption key and initialization vector.
    
    Key:  32 bytes (256 bits) — the secret used to encrypt/decrypt
    IV:   16 bytes (128 bits) — ensures same file encrypted twice looks different
    
    Both are returned as hex strings for safe database storage.
    
    Returns:
        Tuple of (key_hex, iv_hex)
        
    Example:
        >>> key, iv = generate_encryption_key()
        >>> len(key)  # 64 hex characters = 32 bytes
        64
        >>> len(iv)   # 32 hex characters = 16 bytes
        32
    """
    key = os.urandom(32)   # 256-bit random key
    iv = os.urandom(16)    # 128-bit random IV
    return key.hex(), iv.hex()


def perform_ecdh_key_exchange(client_public_key_hex: str) -> Tuple[str, str]:
    """
    Perform Elliptic Curve Diffie-Hellman Key Exchange (ECDH).
    
    1. Reads the client's public key (hex encoded SECP256R1 point)
    2. Generates server's ephemeral private key
    3. Derives the shared secret
    4. Extracts a 32-byte AES key using HKDF-SHA256
    
    Returns:
        Tuple of (derived_aes_key_hex, server_public_key_hex)
    """
    try:
        client_pub_bytes = bytes.fromhex(client_public_key_hex)
        if len(client_pub_bytes) == 65 and client_pub_bytes[0] == 0x04:
            client_pub = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), client_pub_bytes)
        else:
            raise ValueError("Invalid client public key format")
            
        server_priv = ec.generate_private_key(ec.SECP256R1())
        server_pub = server_priv.public_key()
        
        shared_secret = server_priv.exchange(ec.ECDH(), client_pub)
        
        derived_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'secureshare-ecdh-exchange',
        ).derive(shared_secret)
        
        server_pub_bytes = server_pub.public_bytes(
            encoding=Encoding.X962,
            format=PublicFormat.UncompressedPoint
        )
        
        return derived_key.hex(), server_pub_bytes.hex()
    except Exception as e:
        print(f"ECDH Error: {e}")
        # Fallback to random if client provided invalid key
        key = os.urandom(32).hex()
        return key, "error_fallback_key"


def encrypt_file(file_data: bytes, key_hex: str, iv_hex: str) -> bytes:
    """
    Encrypt file data using AES-256-CBC.
    
    Process:
        1. Convert hex key and IV back to bytes
        2. Pad the data to be a multiple of 16 bytes (AES requirement)
        3. Create AES cipher in CBC mode
        4. Encrypt the padded data
        5. Return encrypted bytes (looks like random garbage)
    
    Args:
        file_data: The original file bytes to encrypt
        key_hex:   Hex-encoded AES-256 key (64 hex chars)
        iv_hex:    Hex-encoded initialization vector (32 hex chars)
        
    Returns:
        Encrypted file bytes
        
    Security Note:
        The same file encrypted with different keys produces completely
        different output. Even one bit change in the key makes the
        output completely different (avalanche effect).
    """
    key = bytes.fromhex(key_hex)
    iv = bytes.fromhex(iv_hex)
    
    # Create AES cipher in CBC (Cipher Block Chaining) mode
    cipher = AES.new(key, AES.MODE_CBC, iv)
    
    # Pad data to be multiple of block size (PKCS7 padding)
    # Example: if data is 25 bytes, pad to 32 bytes (next multiple of 16)
    padded_data = pad(file_data, AES_BLOCK_SIZE)
    
    # Encrypt the padded data
    encrypted_data = cipher.encrypt(padded_data)
    
    return encrypted_data


def decrypt_file(encrypted_data: bytes, key_hex: str, iv_hex: str) -> bytes:
    """
    Decrypt file data using AES-256-CBC.
    
    Process:
        1. Convert hex key and IV back to bytes
        2. Create AES cipher in CBC mode (same settings as encryption)
        3. Decrypt the data
        4. Remove padding (reverse of encryption padding)
        5. Return original file bytes
    
    Args:
        encrypted_data: The encrypted file bytes
        key_hex:        Hex-encoded AES-256 key (must match encryption key)
        iv_hex:         Hex-encoded initialization vector (must match)
        
    Returns:
        Original decrypted file bytes
        
    Raises:
        ValueError: If the key/IV is wrong or data is corrupted
    """
    key = bytes.fromhex(key_hex)
    iv = bytes.fromhex(iv_hex)
    
    # Create AES cipher with same key and IV used for encryption
    cipher = AES.new(key, AES.MODE_CBC, iv)
    
    # Decrypt the data
    decrypted_padded = cipher.decrypt(encrypted_data)
    
    # Remove PKCS7 padding to get original data
    decrypted_data = unpad(decrypted_padded, AES_BLOCK_SIZE)
    
    return decrypted_data


def calculate_file_hash(file_data: bytes) -> str:
    """
    Calculate SHA-256 hash (fingerprint) of file data.
    
    Purpose:
        Create a unique fingerprint that identifies this exact file.
        Used to verify file integrity — detect if file was tampered with.
    
    How SHA-256 works (simplified):
        1. Take any amount of data (1 byte or 1 terabyte)
        2. Run through SHA-256 algorithm
        3. Always produces exactly 64 hex characters (256 bits)
        4. Even 1 bit change in input → completely different output
        5. Impossible to reverse (can't get file from hash)
    
    Args:
        file_data: The file bytes to fingerprint
        
    Returns:
        64-character hex string (SHA-256 hash)
        
    Example:
        >>> calculate_file_hash(b"Hello World")
        "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"
    """
    return hashlib.sha256(file_data).hexdigest()


def verify_file_integrity(file_data: bytes, expected_hash: str) -> bool:
    """
    Verify file integrity by comparing SHA-256 hashes.
    
    Process:
        1. Calculate hash of the current file data
        2. Compare with the hash stored during upload
        3. If they match → file is intact ✓
        4. If different → file was corrupted or tampered with ✗
    
    Args:
        file_data:     The file bytes to verify
        expected_hash: The SHA-256 hash stored during upload
        
    Returns:
        True if file is intact, False if corrupted/tampered
    """
    actual_hash = calculate_file_hash(file_data)
    return actual_hash == expected_hash

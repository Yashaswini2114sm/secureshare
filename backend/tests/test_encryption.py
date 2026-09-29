"""
SecureShare Encryption Tests
===============================
Tests for AES-256 encryption/decryption and SHA-256 hashing.
"""

# pyrefly: ignore [missing-import]
import pytest
from app.encryption import (
    calculate_file_hash,
    decrypt_file,
    encrypt_file,
    generate_encryption_key,
    verify_file_integrity,
)


def test_generate_key():
    """Test that key generation produces correct lengths."""
    key, iv = generate_encryption_key()
    assert len(key) == 64   # 32 bytes = 64 hex chars
    assert len(iv) == 32    # 16 bytes = 32 hex chars


def test_generate_key_unique():
    """Test that each key generation produces unique keys."""
    key1, iv1 = generate_encryption_key()
    key2, iv2 = generate_encryption_key()
    assert key1 != key2
    assert iv1 != iv2


def test_encrypt_decrypt():
    """Test that encrypting then decrypting returns original data."""
    original = b"Hello, this is a secret message for SecureShare!"
    key, iv = generate_encryption_key()

    encrypted = encrypt_file(original, key, iv)
    decrypted = decrypt_file(encrypted, key, iv)

    assert decrypted == original
    assert encrypted != original  # Encrypted should differ from original


def test_encrypt_large_data():
    """Test encryption with larger data (simulating a file)."""
    original = b"A" * 10000  # 10KB of data
    key, iv = generate_encryption_key()

    encrypted = encrypt_file(original, key, iv)
    decrypted = decrypt_file(encrypted, key, iv)

    assert decrypted == original


def test_encrypt_binary_data():
    """Test encryption with binary data (like an image)."""
    original = bytes(range(256)) * 100  # All byte values
    key, iv = generate_encryption_key()

    encrypted = encrypt_file(original, key, iv)
    decrypted = decrypt_file(encrypted, key, iv)

    assert decrypted == original


def test_wrong_key_fails():
    """Test that decryption with wrong key fails."""
    original = b"Secret data"
    key1, iv1 = generate_encryption_key()
    key2, iv2 = generate_encryption_key()

    encrypted = encrypt_file(original, key1, iv1)

    with pytest.raises(Exception):
        decrypt_file(encrypted, key2, iv2)


def test_file_hash():
    """Test SHA-256 hash calculation."""
    data = b"Hello World"
    hash1 = calculate_file_hash(data)
    hash2 = calculate_file_hash(data)

    assert hash1 == hash2               # Same data = same hash
    assert len(hash1) == 64             # SHA-256 = 64 hex chars


def test_different_data_different_hash():
    """Test that different data produces different hashes."""
    hash1 = calculate_file_hash(b"Hello")
    hash2 = calculate_file_hash(b"World")

    assert hash1 != hash2


def test_verify_integrity_pass():
    """Test that integrity check passes for unmodified data."""
    data = b"Original file content"
    file_hash = calculate_file_hash(data)

    assert verify_file_integrity(data, file_hash) is True


def test_verify_integrity_fail():
    """Test that integrity check fails for modified data."""
    original = b"Original file content"
    modified = b"Modified file content"
    file_hash = calculate_file_hash(original)

    assert verify_file_integrity(modified, file_hash) is False

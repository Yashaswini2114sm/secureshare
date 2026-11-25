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
    perform_ecdh_key_exchange,
)
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import PublicFormat, Encoding


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


def test_perform_ecdh_key_exchange():
    """Test ECDH key exchange with simulated client public key."""
    # Simulate client P-256 key pair
    client_priv = ec.generate_private_key(ec.SECP256R1())
    client_pub_bytes = client_priv.public_key().public_bytes(
        encoding=Encoding.X962,
        format=PublicFormat.UncompressedPoint
    )
    client_pub_hex = client_pub_bytes.hex()

    derived_key_hex, server_pub_hex = perform_ecdh_key_exchange(client_pub_hex)

    # 32 bytes AES-256 key = 64 hex characters
    assert len(derived_key_hex) == 64
    # Uncompressed P-256 public key is 65 bytes = 130 hex characters
    assert len(server_pub_hex) == 130
    assert server_pub_hex != "error_fallback_key"

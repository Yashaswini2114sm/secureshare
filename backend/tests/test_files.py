"""
SecureShare File Operation Tests
===================================
Tests for file upload, download, listing, and deletion.
"""

import io
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_file(client: AsyncClient, auth_headers: dict):
    """Test successful file upload with encryption."""
    file_content = b"This is a test file for SecureShare encryption."
    response = await client.post(
        "/api/files/upload",
        headers=auth_headers,
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")},
        data={"is_one_time": "false", "max_downloads": "0", "is_public": "true"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "file_id" in data
    assert data["original_filename"] == "test.txt"
    assert data["message"] == "File uploaded and encrypted successfully"


@pytest.mark.asyncio
async def test_upload_file_no_auth(client: AsyncClient):
    """Test that upload without authentication is rejected."""
    response = await client.post(
        "/api/files/upload",
        files={"file": ("test.txt", io.BytesIO(b"data"), "text/plain")},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_upload_empty_file(client: AsyncClient, auth_headers: dict):
    """Test that empty file upload is rejected."""
    response = await client.post(
        "/api/files/upload",
        headers=auth_headers,
        files={"file": ("empty.txt", io.BytesIO(b""), "text/plain")},
        data={"is_one_time": "false", "max_downloads": "0", "is_public": "true"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_files(client: AsyncClient, auth_headers: dict):
    """Test listing user's uploaded files."""
    # Upload a file first
    await client.post(
        "/api/files/upload",
        headers=auth_headers,
        files={"file": ("list_test.txt", io.BytesIO(b"test data"), "text/plain")},
        data={"is_one_time": "false", "max_downloads": "0", "is_public": "true"},
    )
    # List files
    response = await client.get("/api/files/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["files"]) >= 1


@pytest.mark.asyncio
async def test_download_file(client: AsyncClient, auth_headers: dict):
    """Test downloading and decrypting a file."""
    original_content = b"Download test: this content should be recovered exactly."

    # Upload
    upload_response = await client.post(
        "/api/files/upload",
        headers=auth_headers,
        files={"file": ("download_test.txt", io.BytesIO(original_content), "text/plain")},
        data={"is_one_time": "false", "max_downloads": "0", "is_public": "true"},
    )
    file_id = upload_response.json()["file_id"]

    # Download
    download_response = await client.get(f"/api/files/{file_id}/download")
    assert download_response.status_code == 200
    assert download_response.content == original_content


@pytest.mark.asyncio
async def test_download_with_password(client: AsyncClient, auth_headers: dict):
    """Test password-protected file download."""
    content = b"Password protected content"

    # Upload with password
    upload_response = await client.post(
        "/api/files/upload",
        headers=auth_headers,
        files={"file": ("pw_test.txt", io.BytesIO(content), "text/plain")},
        data={
            "password": "mySecret",
            "is_one_time": "false",
            "max_downloads": "0",
            "is_public": "true",
        },
    )
    file_id = upload_response.json()["file_id"]

    # Download without password — should fail
    response = await client.get(f"/api/files/{file_id}/download")
    assert response.status_code == 401

    # Download with wrong password — should fail
    response = await client.get(f"/api/files/{file_id}/download?password=wrong")
    assert response.status_code == 401

    # Download with correct password — should succeed
    response = await client.get(f"/api/files/{file_id}/download?password=mySecret")
    assert response.status_code == 200
    assert response.content == content


@pytest.mark.asyncio
async def test_one_time_download(client: AsyncClient, auth_headers: dict):
    """Test that one-time download file is blocked after first download."""
    content = b"One-time content"

    # Upload as one-time
    upload_response = await client.post(
        "/api/files/upload",
        headers=auth_headers,
        files={"file": ("onetime.txt", io.BytesIO(content), "text/plain")},
        data={"is_one_time": "true", "max_downloads": "0", "is_public": "true"},
    )
    file_id = upload_response.json()["file_id"]

    # First download — should succeed
    response = await client.get(f"/api/files/{file_id}/download")
    assert response.status_code == 200

    # Second download — should be blocked
    response = await client.get(f"/api/files/{file_id}/download")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_file(client: AsyncClient, auth_headers: dict):
    """Test file deletion by owner."""
    # Upload
    upload_response = await client.post(
        "/api/files/upload",
        headers=auth_headers,
        files={"file": ("delete_test.txt", io.BytesIO(b"delete me"), "text/plain")},
        data={"is_one_time": "false", "max_downloads": "0", "is_public": "true"},
    )
    file_id = upload_response.json()["file_id"]

    # Delete
    response = await client.delete(f"/api/files/{file_id}", headers=auth_headers)
    assert response.status_code == 200

    # Verify file is gone
    response = await client.get(f"/api/files/{file_id}/download")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_nonexistent_file(client: AsyncClient, auth_headers: dict):
    """Test deleting a file that doesn't exist."""
    response = await client.delete("/api/files/nonexist", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_download_nonexistent_file(client: AsyncClient):
    """Test downloading a file that doesn't exist."""
    response = await client.get("/api/files/nonexist/download")
    assert response.status_code == 404

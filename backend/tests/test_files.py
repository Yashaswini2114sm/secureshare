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
    """Test downloading and decrypting a file by the owner."""
    original_content = b"Download test: this content should be recovered exactly."

    # Upload
    upload_response = await client.post(
        "/api/files/upload",
        headers=auth_headers,
        files={"file": ("download_test.txt", io.BytesIO(original_content), "text/plain")},
        data={"is_one_time": "false", "max_downloads": "0", "is_public": "true"},
    )
    file_id = upload_response.json()["file_id"]

    # Download with owner auth headers
    download_response = await client.get(
        f"/api/files/{file_id}/download",
        headers=auth_headers,
    )
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
    response = await client.get(
        f"/api/files/{file_id}/download",
        headers=auth_headers,
    )
    assert response.status_code == 401

    # Download with wrong password — should fail
    response = await client.get(
        f"/api/files/{file_id}/download?password=wrong",
        headers=auth_headers,
    )
    assert response.status_code == 401

    # Download with correct password — should succeed
    response = await client.get(
        f"/api/files/{file_id}/download?password=mySecret",
        headers=auth_headers,
    )
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
    response = await client.get(
        f"/api/files/{file_id}/download",
        headers=auth_headers,
    )
    assert response.status_code == 200

    # Second download — should be blocked
    response = await client.get(
        f"/api/files/{file_id}/download",
        headers=auth_headers,
    )
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
    response = await client.get(
        f"/api/files/{file_id}/download",
        headers=auth_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_nonexistent_file(client: AsyncClient, auth_headers: dict):
    """Test deleting a file that doesn't exist."""
    response = await client.delete("/api/files/nonexist", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_download_nonexistent_file(client: AsyncClient, auth_headers: dict):
    """Test downloading a file that doesn't exist."""
    response = await client.get("/api/files/nonexist/download", headers=auth_headers)
    assert response.status_code == 404


# ═══════════════════════════════════════════════════════════════════
# ACCESS REQUEST & AUTHORIZATION TESTS
# ═══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_download_unauthorized_no_token(client: AsyncClient, auth_headers: dict):
    """Test that download without any authentication token is rejected with 401."""
    upload_response = await client.post(
        "/api/files/upload",
        headers=auth_headers,
        files={"file": ("unauth.txt", io.BytesIO(b"secret data"), "text/plain")},
        data={"is_one_time": "false", "max_downloads": "0", "is_public": "true"},
    )
    file_id = upload_response.json()["file_id"]

    # Direct download attempt with no auth
    response = await client.get(f"/api/files/{file_id}/download")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_download_unauthorized_different_user(
    client: AsyncClient, auth_headers: dict, user2_headers: dict
):
    """Test that another authenticated user cannot download without owner approval (403)."""
    upload_response = await client.post(
        "/api/files/upload",
        headers=auth_headers,
        files={"file": ("restricted.txt", io.BytesIO(b"restricted data"), "text/plain")},
        data={"is_one_time": "false", "max_downloads": "0", "is_public": "true"},
    )
    file_id = upload_response.json()["file_id"]

    # User 2 attempts to download without approval
    response = await client.get(f"/api/files/{file_id}/download", headers=user2_headers)
    assert response.status_code == 403
    assert "approval" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_access_request_and_approval_workflow(
    client: AsyncClient, auth_headers: dict, user2_headers: dict
):
    """
    Test complete Access Request & Approval lifecycle:
    1. Owner uploads file
    2. Recipient checks status (NONE)
    3. Recipient submits access request -> status PENDING
    4. Owner sees pending request on dashboard
    5. Owner approves request -> status APPROVED
    6. Recipient downloads file successfully
    7. Owner revokes access -> recipient blocked (403)
    """
    secret_bytes = b"Top secret approved file content"

    # Step 1: Owner uploads file
    upload_res = await client.post(
        "/api/files/upload",
        headers=auth_headers,
        files={"file": ("classified.txt", io.BytesIO(secret_bytes), "text/plain")},
        data={"is_one_time": "false", "max_downloads": "0", "is_public": "true"},
    )
    assert upload_res.status_code == 201
    file_id = upload_res.json()["file_id"]

    # Step 2: Recipient checks access status
    status_res = await client.get(f"/api/files/{file_id}/access-status", headers=user2_headers)
    assert status_res.status_code == 200
    assert status_res.json()["access_status"] == "NONE"
    assert status_res.json()["is_owner"] is False

    # Step 3: Recipient requests access
    req_res = await client.post(f"/api/files/{file_id}/request-access", headers=user2_headers)
    assert req_res.status_code == 200

    # Verify status is now PENDING
    status_res2 = await client.get(f"/api/files/{file_id}/access-status", headers=user2_headers)
    assert status_res2.json()["access_status"] == "PENDING"

    # Step 4: Owner checks access requests
    owner_reqs = await client.get("/api/files/access-requests/owner", headers=auth_headers)
    assert owner_reqs.status_code == 200
    data = owner_reqs.json()
    assert data["total_pending"] == 1
    req_item = data["requests"][0]
    assert req_item["file_id"] == file_id
    assert req_item["requester_username"] == "user2"
    assert req_item["status"] == "PENDING"
    request_id = req_item["id"]

    # Step 5: Owner approves request
    approve_res = await client.post(
        f"/api/files/access-requests/{request_id}/approve",
        headers=auth_headers,
    )
    assert approve_res.status_code == 200

    # Verify status is now APPROVED for user2
    status_res3 = await client.get(f"/api/files/{file_id}/access-status", headers=user2_headers)
    assert status_res3.json()["access_status"] == "APPROVED"

    # Step 6: Recipient downloads file successfully
    download_res = await client.get(f"/api/files/{file_id}/download", headers=user2_headers)
    assert download_res.status_code == 200
    assert download_res.content == secret_bytes

    # Step 7: Owner revokes access
    revoke_res = await client.post(
        f"/api/files/access-requests/{request_id}/revoke",
        headers=auth_headers,
    )
    assert revoke_res.status_code == 200

    # Verify download is now blocked for user2
    download_blocked = await client.get(f"/api/files/{file_id}/download", headers=user2_headers)
    assert download_blocked.status_code == 403


@pytest.mark.asyncio
async def test_access_request_rejection(
    client: AsyncClient, auth_headers: dict, user2_headers: dict
):
    """Test owner rejecting an access request."""
    # Owner uploads file
    upload_res = await client.post(
        "/api/files/upload",
        headers=auth_headers,
        files={"file": ("reject_test.txt", io.BytesIO(b"protected"), "text/plain")},
        data={"is_one_time": "false", "max_downloads": "0", "is_public": "true"},
    )
    file_id = upload_res.json()["file_id"]

    # User 2 requests access
    await client.post(f"/api/files/{file_id}/request-access", headers=user2_headers)

    # Owner gets request ID
    owner_reqs = await client.get("/api/files/access-requests/owner", headers=auth_headers)
    request_id = owner_reqs.json()["requests"][0]["id"]

    # Owner rejects request
    reject_res = await client.post(
        f"/api/files/access-requests/{request_id}/reject",
        headers=auth_headers,
    )
    assert reject_res.status_code == 200

    # User 2 status should be REJECTED
    status_res = await client.get(f"/api/files/{file_id}/access-status", headers=user2_headers)
    assert status_res.json()["access_status"] == "REJECTED"

    # User 2 download blocked
    dl_res = await client.get(f"/api/files/{file_id}/download", headers=user2_headers)
    assert dl_res.status_code == 403

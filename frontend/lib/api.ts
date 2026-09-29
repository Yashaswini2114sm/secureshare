/**
 * SecureShare API Client
 * =======================
 * Centralized API communication layer for the FastAPI backend.
 * Handles JWT token attachment, error handling, and response parsing.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Get the stored JWT token from localStorage.
 */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("secureshare_token");
}

/**
 * Store JWT token in localStorage.
 */
export function setToken(token: string): void {
  localStorage.setItem("secureshare_token", token);
}

/**
 * Remove JWT token from localStorage.
 */
export function removeToken(): void {
  localStorage.removeItem("secureshare_token");
}

/**
 * Generic API request function with JWT authentication.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Add JWT token if available (don't set Content-Type for FormData)
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // Check if response is JSON or binary (file download)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return response as unknown as T;
}

// ═══════════════════════════════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════════════════════════════

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

/**
 * Register a new user account.
 */
export async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

/**
 * Login and receive JWT token.
 */
export async function loginUser(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  // Store token automatically
  setToken(response.access_token);
  return response;
}

/**
 * Get current user profile.
 */
export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/api/auth/me");
}

// ═══════════════════════════════════════════════════════════════════
// FILE API
// ═══════════════════════════════════════════════════════════════════

export interface FileUploadResponse {
  file_id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  download_url: string;
  expires_at: string | null;
  is_one_time: boolean;
  is_public: boolean;
  created_at: string;
  message: string;
}

export interface FileDetail {
  file_id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  download_url: string;
  expires_at: string | null;
  is_one_time: boolean;
  is_downloaded: boolean;
  download_count: number;
  max_downloads: number;
  is_public: boolean;
  created_at: string;
  owner: string;
}

export interface FileListResponse {
  files: FileDetail[];
  total: number;
}

export async function uploadFile(
  file: File,
  options: {
    password?: string;
    expiresInHours?: number;
    isOneTime?: boolean;
    maxDownloads?: number;
    isPublic?: boolean;
    onProgress?: (percent: number) => void;
  }
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (options.password) formData.append("password", options.password);
  if (options.expiresInHours !== undefined)
    formData.append("expires_in_hours", options.expiresInHours.toString());
  formData.append("is_one_time", (options.isOneTime ?? false).toString());
  formData.append("max_downloads", (options.maxDownloads ?? 0).toString());
  formData.append("is_public", (options.isPublic ?? true).toString());

  // Use XMLHttpRequest for upload progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = getToken();

    xhr.open("POST", `${API_BASE_URL}/api/files/upload`);

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        options.onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        const error = JSON.parse(xhr.responseText);
        reject(new Error(error.detail || "Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

/**
 * List current user's files.
 */
export async function listFiles(): Promise<FileListResponse> {
  return apiRequest<FileListResponse>("/api/files/");
}

/**
 * Get file metadata.
 */
export async function getFileInfo(fileId: string): Promise<FileDetail> {
  return apiRequest<FileDetail>(`/api/files/${fileId}`);
}

/**
 * Download a file (triggers browser download).
 */
export async function downloadFile(
  fileId: string,
  password?: string
): Promise<void> {
  const params = password ? `?password=${encodeURIComponent(password)}` : "";
  const url = `${API_BASE_URL}/api/files/${fileId}/download${params}`;

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Download failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // Extract filename from Content-Disposition header
  const disposition = response.headers.get("content-disposition");
  let filename = "downloaded_file";
  if (disposition && disposition.indexOf("attachment") !== -1) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, "");
    }
  }

  // Create a blob and trigger browser download
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Delete a file.
 */
export async function deleteFile(
  fileId: string
): Promise<{ message: string; file_id: string }> {
  return apiRequest(`/api/files/${fileId}`, { method: "DELETE" });
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format date for display.
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

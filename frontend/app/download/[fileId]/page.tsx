"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { downloadFile, getFileInfo, FileDetail, formatFileSize, formatDate } from "@/lib/api";

export default function DownloadPage() {
  const params = useParams();
  const fileId = params.fileId as string;


  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileDetail | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Try to get file info (may fail for password-protected files)
  const loadFileInfo = async () => {
    setLoadingInfo(true);
    try {
      const info = await getFileInfo(fileId);
      setFileInfo(info);
    } catch {
      // File info might not be accessible without auth — that's OK
    } finally {
      setLoadingInfo(false);
    }
  };

  // Attempt to load file info on first render
  useState(() => {
    loadFileInfo();
  });

  const handleDownload = async () => {
    setError("");
    setLoading(true);

    try {
      await downloadFile(fileId, password || undefined);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      if (message.toLowerCase().includes("password-protected") || message.toLowerCase().includes("incorrect password") || message.toLowerCase().includes("password required")) {
        setNeedsPassword(true);
        setError("This file is password-protected. Please enter the File Password.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {success ? (
          /* ── Success State ──────────────────────────────── */
          <div className="glass-card p-8 text-center glow-accent">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent-500/20 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Download Complete!
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Your file has been decrypted and downloaded successfully.
            </p>
            <div className="space-y-1 text-xs text-slate-500">
              <p>✓ AES-256 decrypted</p>
              <p>✓ SHA-256 integrity verified</p>
              <p>✓ File is authentic and unmodified</p>
            </div>
          </div>
        ) : (
          /* ── Download Form ─────────────────────────────── */
          <div className="glass-card p-8 glow-brand">
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 animate-pulse-glow">
                <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Secure Download</h2>
              <p className="text-sm text-slate-400 mt-1">
                File ID: <span className="font-mono text-brand-400">{fileId}</span>
              </p>
            </div>

            {/* File Info (if available) */}
            {fileInfo && (
              <div className="bg-surface rounded-xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Filename</span>
                  <span className="text-white truncate ml-4">{fileInfo.original_filename}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Size</span>
                  <span className="text-white">{formatFileSize(fileInfo.file_size)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Uploaded</span>
                  <span className="text-white">{formatDate(fileInfo.created_at)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Downloads</span>
                  <span className="text-white">{fileInfo.download_count}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Encryption</span>
                  <span className="text-accent-400">AES-256-CBC (Backend)</span>
                </div>
              </div>
            )}

            {/* Passwords */}
            <div className="mb-6 space-y-4">
              {needsPassword && (
                <div>
                  <label htmlFor="download-password" className="block text-sm font-medium text-slate-300 mb-1.5">
                    File Access Password (Required)
                  </label>
                  <input
                    id="download-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter the file access password"
                  />
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
                {error}
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full btn-primary py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Decrypting & Downloading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download File
                </>
              )}
            </button>

            {/* Security Note */}
            <div className="mt-6 p-3 rounded-lg bg-accent-500/5 border border-accent-500/10">
              <p className="text-xs text-slate-400 leading-relaxed">
                🔐 This file is encrypted with <span className="text-accent-400">AES-256-CBC</span> on the backend.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

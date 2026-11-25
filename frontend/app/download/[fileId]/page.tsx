"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  downloadFile,
  getFileAccessStatus,
  requestFileAccess,
  FileAccessStatus,
  formatFileSize,
  formatDate,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function DownloadPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.fileId as string;
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [statusData, setStatusData] = useState<FileAccessStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch access status from backend
  const loadStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      setError("");
      const data = await getFileAccessStatus(fileId);
      setStatusData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file details");
    } finally {
      setLoadingStatus(false);
    }
  }, [fileId]);

  useEffect(() => {
    if (!authLoading) {
      loadStatus();
    }
  }, [authLoading, loadStatus]);

  // Request Access Handler
  const handleRequestAccess = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/download/${fileId}`);
      return;
    }
    setRequesting(true);
    setError("");
    setInfoMessage("");
    try {
      const res = await requestFileAccess(fileId);
      setInfoMessage(res.message || "Access request submitted to file owner.");
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request access");
    } finally {
      setRequesting(false);
    }
  };

  // Download Handler
  const handleDownload = async () => {
    setError("");
    setDownloading(true);
    try {
      await downloadFile(fileId, password || undefined);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      if (
        message.toLowerCase().includes("password-protected") ||
        message.toLowerCase().includes("incorrect password") ||
        message.toLowerCase().includes("password required")
      ) {
        setError("This file is password-protected. Please enter the correct password.");
      } else {
        setError(message);
      }
    } finally {
      setDownloading(false);
    }
  };

  const isOwner = statusData?.is_owner;
  const isApproved = statusData?.access_status === "APPROVED";
  const isPending = statusData?.access_status === "PENDING";
  const isRejected = statusData?.access_status === "REJECTED";
  const isRevoked = statusData?.access_status === "REVOKED";
  const canDownload = isOwner || isApproved;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {success ? (
          /* ── Download Success State ──────────────────────── */
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
              Your file has been verified, decrypted, and downloaded.
            </p>
            <div className="space-y-1 text-xs text-slate-500 mb-6">
              <p>✓ AES-256 decrypted on-the-fly</p>
              <p>✓ SHA-256 integrity verified</p>
              <p>✓ File is authentic and unmodified</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-block px-5 py-2.5 rounded-xl btn-primary text-white text-xs font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          /* ── Main Access & Download Card ─────────────────── */
          <div className="glass-card p-8 glow-brand">
            {/* Header Icon */}
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-4 ${
                  canDownload
                    ? "bg-accent-500/10 text-accent-400"
                    : isPending
                    ? "bg-amber-500/10 text-amber-400"
                    : isRejected || isRevoked
                    ? "bg-red-500/10 text-red-400"
                    : "bg-brand-500/10 text-brand-400 animate-pulse-glow"
                }`}
              >
                {canDownload ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                ) : isPending ? (
                  <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">
                {canDownload ? "Secure Download" : "Access Restricted"}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                File ID: <span className="font-mono text-brand-400">{fileId}</span>
              </p>
            </div>

            {/* Loading Indicator */}
            {loadingStatus ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
                <p className="text-xs text-slate-400 mt-2">Checking access authorization...</p>
              </div>
            ) : statusData ? (
              <>
                {/* File Metadata Overview */}
                <div className="bg-surface rounded-xl p-4 mb-6 space-y-2 border border-surface-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Filename</span>
                    <span className="text-white font-medium truncate ml-4">
                      {statusData.original_filename}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Size</span>
                    <span className="text-white">{formatFileSize(statusData.file_size)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Owner</span>
                    <span className="text-brand-400 font-mono">@{statusData.owner}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Security</span>
                    <span className="text-accent-400">AES-256-CBC Encrypted</span>
                  </div>
                </div>

                {/* Status Badges & Alerts */}
                {isOwner && (
                  <div className="p-3 mb-6 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 flex items-center gap-2">
                    <span>👑</span>
                    <span>You are the owner of this file. You have full download access.</span>
                  </div>
                )}

                {isApproved && !isOwner && (
                  <div className="p-3 mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                    <span>✅</span>
                    <span>Access approved by owner (@{statusData.owner}). You may download.</span>
                  </div>
                )}

                {isPending && (
                  <div className="p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <span>⏳</span>
                      <span>Access Request Pending</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Your request has been forwarded to the file owner. Once approved, download access will be unlocked.
                    </p>
                  </div>
                )}

                {isRejected && (
                  <div className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <span>⛔</span>
                      <span>Access Denied</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      The file owner has rejected your request to access this file.
                    </p>
                  </div>
                )}

                {isRevoked && (
                  <div className="p-4 mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <span>🚫</span>
                      <span>Access Revoked</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Your previously granted permission to access this file has been revoked by the owner.
                    </p>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="p-4 mb-6 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-slate-300 space-y-2">
                    <div className="font-semibold text-brand-400 flex items-center gap-2">
                      <span>🔒</span>
                      <span>Authentication Required</span>
                    </div>
                    <p className="leading-relaxed">
                      To request access and securely download this file, please log in or create an account.
                    </p>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {error}
                  </div>
                )}

                {/* Info Message Banner */}
                {infoMessage && (
                  <div className="p-3 mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                    {infoMessage}
                  </div>
                )}

                {/* Action Section */}
                {canDownload ? (
                  /* ── Authorized: Download Flow ── */
                  <div className="space-y-4">
                    {statusData.has_password && (
                      <div>
                        <label
                          htmlFor="download-password"
                          className="block text-xs font-medium text-slate-300 mb-1.5"
                        >
                          File Access Password (Required)
                        </label>
                        <input
                          id="download-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input-field text-sm"
                          placeholder="Enter file password"
                        />
                      </div>
                    )}

                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full btn-primary py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {downloading ? (
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
                  </div>
                ) : !isAuthenticated ? (
                  /* ── Not Logged In Flow ── */
                  <div className="space-y-3">
                    <Link
                      href={`/login?redirect=/download/${fileId}`}
                      className="w-full btn-primary py-3.5 rounded-xl text-white font-semibold text-sm text-center block"
                    >
                      Log In to Request Access
                    </Link>
                    <Link
                      href="/register"
                      className="w-full py-2.5 rounded-xl glass-card-light text-slate-300 text-xs text-center block hover:text-white"
                    >
                      Create an Account
                    </Link>
                  </div>
                ) : isPending ? (
                  /* ── Pending State: Check Approval Button ── */
                  <button
                    onClick={loadStatus}
                    className="w-full py-3.5 rounded-xl glass-card text-brand-400 border border-brand-500/30 hover:bg-brand-500/10 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Approval Status
                  </button>
                ) : (
                  /* ── NONE / REJECTED / REVOKED: Request Access Button ── */
                  <button
                    onClick={handleRequestAccess}
                    disabled={requesting}
                    className="w-full btn-primary py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {requesting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending Request...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        {isRejected || isRevoked ? "Request Access Again" : "Request Access"}
                      </>
                    )}
                  </button>
                )}

                {/* Security Note */}
                <div className="mt-6 p-3 rounded-lg bg-surface border border-surface-border">
                  <p className="text-[11px] text-slate-400 leading-relaxed text-center">
                    🛡️ End-to-End Access Control: Download links require file owner approval. Files are encrypted with <span className="text-accent-400">AES-256</span> and verified with <span className="text-accent-400">SHA-256</span>.
                  </p>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
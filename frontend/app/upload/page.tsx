"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { uploadFile, FileUploadResponse } from "@/lib/api";
import UploadZone from "@/components/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import Link from "next/link";


export default function UploadPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [expiresInHours, setExpiresInHours] = useState<number>(24);
  const [isOneTime, setIsOneTime] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState(0);
  const [isPublic, setIsPublic] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<FileUploadResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadFile(selectedFile, {
        password: password || undefined,
        expiresInHours: expiresInHours > 0 ? expiresInHours : undefined,
        isOneTime,
        maxDownloads,
        isPublic,
        onProgress: setProgress,
      });
      setUploadResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const shareUrl =
    uploadResult && typeof window !== "undefined"
      ? `${window.location.origin}/download/${uploadResult.file_id}`
      : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Success state
  if (uploadResult) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="glass-card p-8 text-center glow-accent">
          <div className="w-16 h-16 mx-auto rounded-full bg-accent-500/20 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            File Uploaded & Encrypted!
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Your file has been encrypted with AES-256 and stored securely.
          </p>

          {/* Share Link */}
          <div className="bg-surface p-4 rounded-xl mb-6">
            <p className="text-xs text-slate-400 mb-2">Share this link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="input-field text-xs font-mono flex-1"
              />
              <button
                onClick={copyLink}
                className="btn-primary px-4 py-2.5 rounded-lg text-xs text-white font-medium flex-shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* File Details */}
          <div className="text-left space-y-2 mb-6">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">File</span>
              <span className="text-white">Encrypted File</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">File ID</span>
              <span className="text-brand-400 font-mono">{uploadResult.file_id}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Encryption</span>
              <span className="text-accent-400">AES-256-CBC ✓</span>
            </div>
            {uploadResult.expires_at && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Expires</span>
                <span className="text-amber-400">
                  {new Date(uploadResult.expires_at).toLocaleString()}
                </span>
              </div>
            )}
            {uploadResult.is_one_time && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">One-Time</span>
                <span className="text-amber-400">Yes — deletes after first download</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setUploadResult(null);
                setSelectedFile(null);
                setProgress(0);
                setPassword("");
              }}
              className="flex-1 btn-secondary px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300"
            >
              Upload Another
            </button>
            <Link
              href="/dashboard"
              className="flex-1 btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold text-white text-center"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Upload File</h1>
        <p className="text-sm text-slate-400 mt-1">
          Your file will be encrypted with AES-256 before storage
        </p>
      </div>

      <div className="space-y-6">
        {/* Upload Zone */}
        <UploadZone onFileSelected={setSelectedFile} disabled={uploading} />

        {/* Options */}
        {selectedFile && (
          <div className="glass-card p-6 space-y-5 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Sharing Options
            </h3>


            {/* Password */}
            <div>
              <label htmlFor="upload-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                Password Protection (optional)
              </label>
              <input
                id="upload-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field text-sm"
                placeholder="Leave empty for no password"
              />
            </div>

            {/* Expiration */}
            <div>
              <label htmlFor="upload-expiry" className="block text-xs font-medium text-slate-300 mb-1.5">
                Expires After (hours)
              </label>
              <select
                id="upload-expiry"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(parseInt(e.target.value))}
                className="input-field text-sm"
              >
                <option value={0}>Never</option>
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>3 days</option>
                <option value={168}>1 week</option>
              </select>
            </div>

            {/* Max Downloads */}
            <div>
              <label htmlFor="upload-max-downloads" className="block text-xs font-medium text-slate-300 mb-1.5">
                Max Downloads (0 = unlimited)
              </label>
              <input
                id="upload-max-downloads"
                type="number"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(parseInt(e.target.value) || 0)}
                className="input-field text-sm"
                min={0}
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOneTime}
                  onChange={(e) => setIsOneTime(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-surface text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm text-white">One-Time Download</span>
                  <p className="text-xs text-slate-500">File deactivates after first download</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-surface text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm text-white">Public Access</span>
                  <p className="text-xs text-slate-500">Anyone with the link can download</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Progress */}
        {uploading && <ProgressBar percent={progress} />}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && !uploading && (
          <button
            onClick={handleUpload}
            className="w-full btn-primary py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Upload
          </button>
        )}
      </div>
    </div>
  );
}

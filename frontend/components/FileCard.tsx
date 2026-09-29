"use client";

import { FileDetail, formatFileSize, formatDate, deleteFile } from "@/lib/api";
import { useState } from "react";

interface FileCardProps {
  file: FileDetail;
  onDelete?: () => void;
}

export default function FileCard({ file, onDelete }: FileCardProps) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/download/${file.file_id}`
      : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    setDeleting(true);
    try {
      await deleteFile(file.file_id);
      onDelete?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const isExpired =
    file.expires_at && new Date(file.expires_at) < new Date();

  // File type icon
  const getFileIcon = () => {
    if (file.mime_type.startsWith("image/")) return "🖼️";
    if (file.mime_type.startsWith("video/")) return "🎬";
    if (file.mime_type.startsWith("audio/")) return "🎵";
    if (file.mime_type.includes("pdf")) return "📄";
    if (file.mime_type.includes("zip") || file.mime_type.includes("rar")) return "📦";
    if (file.mime_type.includes("text")) return "📝";
    return "📎";
  };

  return (
    <div
      className={`glass-card-light p-5 transition-all hover:border-brand-500/30 ${
        isExpired ? "opacity-50" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{getFileIcon()}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white truncate">
              {file.original_filename}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-1.5 flex-shrink-0">
          {file.is_one_time && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400 font-medium">
              ONE-TIME
            </span>
          )}
          {isExpired && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-400 font-medium">
              EXPIRED
            </span>
          )}
          {!file.is_public && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/20 text-purple-400 font-medium">
              PRIVATE
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {file.download_count} downloads
        </span>
        {file.max_downloads > 0 && (
          <span className="text-slate-500">
            (max: {file.max_downloads})
          </span>
        )}
        {file.expires_at && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isExpired ? "Expired" : `Expires ${formatDate(file.expires_at)}`}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          disabled={!!isExpired}
          className="flex-1 px-3 py-2 text-xs font-medium rounded-lg btn-primary text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Link
            </>
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-2 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}

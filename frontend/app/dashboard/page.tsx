"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { listFiles, FileDetail } from "@/lib/api";
import FileCard from "@/components/FileCard";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [files, setFiles] = useState<FileDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch files
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await listFiles();
      setFiles(response.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Files</h1>
          <p className="text-sm text-slate-400 mt-1">
            {files.length} encrypted file{files.length !== 1 ? "s" : ""} stored securely
          </p>
        </div>
        <Link
          href="/upload"
          className="btn-primary px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload File
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Files",
            value: files.length,
            icon: "📁",
          },
          {
            label: "Total Downloads",
            value: files.reduce((sum, f) => sum + f.download_count, 0),
            icon: "📥",
          },
          {
            label: "Public Files",
            value: files.filter((f) => f.is_public).length,
            icon: "🌐",
          },
          {
            label: "One-Time Files",
            value: files.filter((f) => f.is_one_time).length,
            icon: "⚡",
          },
        ].map((stat) => (
          <div key={stat.label} className="glass-card-light p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-xs text-slate-400">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Files Grid */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card-light p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-surface-lighter" />
                <div className="flex-1">
                  <div className="h-3 bg-surface-lighter rounded w-3/4 mb-2" />
                  <div className="h-2 bg-surface-lighter rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-surface-lighter rounded w-full mb-4" />
              <div className="h-8 bg-surface-lighter rounded" />
            </div>
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-xl bg-surface-light flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No files yet</h3>
          <p className="text-sm text-slate-400 mb-6">
            Upload your first file to get started with encrypted sharing
          </p>
          <Link
            href="/upload"
            className="btn-primary px-6 py-2.5 rounded-xl text-white text-sm font-semibold inline-block"
          >
            Upload Your First File
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <FileCard
              key={file.file_id}
              file={file}
              onDelete={fetchFiles}
            />
          ))}
        </div>
      )}
    </div>
  );
}

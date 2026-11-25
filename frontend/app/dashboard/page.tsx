"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  listFiles,
  getOwnerAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  revokeAccessRequest,
  FileDetail,
  AccessRequestItem,
  formatDate,
} from "@/lib/api";
import FileCard from "@/components/FileCard";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [files, setFiles] = useState<FileDetail[]>([]);
  const [requests, setRequests] = useState<AccessRequestItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"files" | "requests">("files");
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    try {
      setLoadingFiles(true);
      const response = await listFiles();
      setFiles(response.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  // Fetch access requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const response = await getOwnerAccessRequests();
      setRequests(response.requests);
      setPendingCount(response.total_pending);
    } catch (err) {
      console.error("Failed to load access requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
      fetchRequests();
    }
  }, [isAuthenticated, fetchFiles, fetchRequests]);

  // Approve Access Request
  const handleApprove = async (requestId: number) => {
    setProcessingId(requestId);
    setError("");
    setActionSuccess("");
    try {
      const res = await approveAccessRequest(requestId);
      setActionSuccess(res.message || "Request approved successfully.");
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject Access Request
  const handleReject = async (requestId: number) => {
    setProcessingId(requestId);
    setError("");
    setActionSuccess("");
    try {
      const res = await rejectAccessRequest(requestId);
      setActionSuccess(res.message || "Request rejected.");
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  // Revoke Access Request
  const handleRevoke = async (requestId: number) => {
    setProcessingId(requestId);
    setError("");
    setActionSuccess("");
    try {
      const res = await revokeAccessRequest(requestId);
      setActionSuccess(res.message || "Access revoked successfully.");
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke access");
    } finally {
      setProcessingId(null);
    }
  };

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
          <h1 className="text-2xl font-bold text-white">Owner Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your end-to-end encrypted files and recipient access requests
          </p>
        </div>
        <Link
          href="/upload"
          className="btn-primary px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload New File
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
            label: "Pending Requests",
            value: pendingCount,
            icon: "⏳",
            highlight: pendingCount > 0,
          },
          {
            label: "Active Approvals",
            value: requests.filter((r) => r.status === "APPROVED").length,
            icon: "🛡️",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`glass-card-light p-4 transition-all ${
              stat.highlight ? "border-amber-500/40 bg-amber-500/5" : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-xs text-slate-400">{stat.label}</span>
            </div>
            <p
              className={`text-xl font-bold ${
                stat.highlight ? "text-amber-400" : "text-white"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm mb-6 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess("")}
            className="text-xs text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-surface-border mb-6">
        <button
          onClick={() => setActiveTab("files")}
          className={`pb-3 px-4 text-sm font-medium transition-all relative ${
            activeTab === "files"
              ? "text-brand-400 border-b-2 border-brand-500 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          My Files ({files.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 px-4 text-sm font-medium transition-all relative flex items-center gap-2 ${
            activeTab === "requests"
              ? "text-brand-400 border-b-2 border-brand-500 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Access Requests ({requests.length})</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-300 font-bold animate-pulse">
              {pendingCount} pending
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Files Grid */}
      {activeTab === "files" && (
        <div>
          {loadingFiles ? (
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
              <h3 className="text-lg font-medium text-white mb-2">No files uploaded yet</h3>
              <p className="text-sm text-slate-400 mb-6">
                Upload your first encrypted file to share securely with recipients.
              </p>
              <Link
                href="/upload"
                className="btn-primary px-6 py-2.5 rounded-xl text-white text-sm font-semibold inline-block"
              >
                Upload File
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <FileCard key={file.file_id} file={file} onDelete={fetchFiles} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Access Requests Management */}
      {activeTab === "requests" && (
        <div>
          {loadingRequests ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
              <p className="text-xs text-slate-400 mt-2">Loading access requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-xl bg-surface-light flex items-center justify-center mb-4 text-2xl">
                🛡️
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No access requests</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                When you share a file link with someone, they will request permission to download it. Their requests will appear here for you to approve or reject.
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface text-slate-400 text-xs uppercase border-b border-surface-border">
                    <tr>
                      <th className="px-6 py-3.5">Requester</th>
                      <th className="px-6 py-3.5">File</th>
                      <th className="px-6 py-3.5">Requested Date</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-surface/50 transition-colors">
                        {/* Requester Info */}
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">
                            @{req.requester_username}
                          </div>
                          <div className="text-xs text-slate-400">
                            {req.requester_email}
                          </div>
                        </td>

                        {/* File Info */}
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-200 truncate max-w-xs">
                            {req.original_filename}
                          </div>
                          <div className="text-xs font-mono text-brand-400">
                            ID: {req.file_id}
                          </div>
                        </td>

                        {/* Requested Date */}
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {formatDate(req.created_at)}
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {req.status === "PENDING" && (
                            <span className="px-2.5 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium inline-flex items-center gap-1">
                              <span>⏳</span> Pending
                            </span>
                          )}
                          {req.status === "APPROVED" && (
                            <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium inline-flex items-center gap-1">
                              <span>✅</span> Approved
                            </span>
                          )}
                          {req.status === "REJECTED" && (
                            <span className="px-2.5 py-1 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-medium inline-flex items-center gap-1">
                              <span>⛔</span> Rejected
                            </span>
                          )}
                          {req.status === "REVOKED" && (
                            <span className="px-2.5 py-1 text-xs rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium inline-flex items-center gap-1">
                              <span>🚫</span> Revoked
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {req.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleApprove(req.id)}
                                  disabled={processingId === req.id}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50"
                                >
                                  {processingId === req.id ? "..." : "Approve"}
                                </button>
                                <button
                                  onClick={() => handleReject(req.id)}
                                  disabled={processingId === req.id}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/30 transition-all disabled:opacity-50"
                                >
                                  {processingId === req.id ? "..." : "Reject"}
                                </button>
                              </>
                            )}

                            {req.status === "APPROVED" && (
                              <button
                                onClick={() => handleRevoke(req.id)}
                                disabled={processingId === req.id}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 transition-all disabled:opacity-50"
                              >
                                {processingId === req.id ? "..." : "Revoke Access"}
                              </button>
                            )}

                            {(req.status === "REJECTED" || req.status === "REVOKED") && (
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={processingId === req.id}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-300 border border-emerald-500/30 transition-all disabled:opacity-50"
                              >
                                {processingId === req.id ? "..." : "Re-Approve"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [desktopDeviceId, setDesktopDeviceId] = useState<Id<"devices"> | null>(
    null
  );

  useEffect(() => {
    const storedUserId = localStorage.getItem("sentinel_userId");
    const storedDesktopId = localStorage.getItem("sentinel_desktopDeviceId");
    if (storedUserId) {
      setUserId(storedUserId as Id<"users">);
    }
    if (storedDesktopId) {
      setDesktopDeviceId(storedDesktopId as Id<"devices">);
    }
  }, []);

  // Query desktop device status
  const desktopStatus = useQuery(
    api.devices.getStatus,
    desktopDeviceId ? { deviceId: desktopDeviceId } : "skip"
  );

  // Get health metrics if paired
  const healthMetrics = useQuery(
    api.sessions.getHealthMetrics,
    userId ? { userId } : "skip"
  );

  const isPaired = desktopDeviceId !== null;
  const isLocked = desktopStatus?.status === "locked";

  return (
    <div className="min-h-screen flex flex-col p-6 bg-zinc-950">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <span className="text-xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Sentinel</h1>
              <p className="text-sm text-zinc-500">Mobile Key</p>
            </div>
          </div>
          <Link 
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {!isPaired ? (
          /* Not paired state */
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-24 h-24 mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">
              Not Paired
            </h2>
            <p className="text-zinc-500 text-center mb-8 max-w-xs">
              Pair this phone with your desktop to use it as your unlock key.
            </p>
            <Link
              href="/pair"
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25"
            >
              Pair with Desktop
            </Link>
          </div>
        ) : (
          /* Paired state */
          <div className="flex-1 flex flex-col">
            {/* Status Card */}
            <div
              className={`rounded-2xl p-6 mb-6 ${
                isLocked
                  ? "bg-gradient-to-br from-red-900/30 to-red-950/30 border border-red-800/50"
                  : "bg-gradient-to-br from-emerald-900/30 to-emerald-950/30 border border-emerald-800/50"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-zinc-400">Desktop Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isLocked
                      ? "bg-red-500/20 text-red-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {isLocked ? "LOCKED" : "UNLOCKED"}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    isLocked ? "bg-red-500/20" : "bg-emerald-500/20"
                  }`}
                >
                  {isLocked ? (
                    <svg
                      className="w-8 h-8 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100">
                    {isLocked ? "Desktop Locked" : "Desktop Unlocked"}
                  </h2>
                  <p className="text-zinc-400">
                    {isLocked
                      ? "Walk to your checkpoint and scan to unlock"
                      : "Your workstation is ready"}
                  </p>
                </div>
              </div>
            </div>

            {/* Unlock Button (only when locked) */}
            {isLocked && (
              <Link
                href="/scan"
                className="w-full py-4 mb-6 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold text-center shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                Scan QR to Unlock
              </Link>
            )}

            {/* Health Stats (when unlocked) */}
            {!isLocked && healthMetrics && (
              <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800 mb-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4">
                  Today&apos;s Health
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-zinc-100">
                      {healthMetrics.currentSittingMins}m
                    </p>
                    <p className="text-xs text-zinc-500">Current Sitting</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">
                      {healthMetrics.breaksToday}
                    </p>
                    <p className="text-xs text-zinc-500">Breaks Today</p>
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-2xl font-bold ${
                        healthMetrics.riskScore <= 30
                          ? "text-emerald-400"
                          : healthMetrics.riskScore <= 60
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {healthMetrics.riskScore}%
                    </p>
                    <p className="text-xs text-zinc-500">DVT Risk</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-auto space-y-3">
              <Link
                href="/scan"
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium text-center transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                Open Scanner
              </Link>
              <Link
                href="/pair"
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl font-medium text-center transition-colors border border-zinc-800"
              >
                Re-pair Device
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

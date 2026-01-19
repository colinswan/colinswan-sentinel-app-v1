"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [desktopDeviceId, setDesktopDeviceId] = useState<Id<"devices"> | null>(
    null
  );
  const [isPaired, setIsPaired] = useState(false);

  // Load pairing info from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("sentinel_userId");
    const storedDesktopId = localStorage.getItem("sentinel_desktopDeviceId");

    if (storedUserId && storedDesktopId) {
      setUserId(storedUserId as Id<"users">);
      setDesktopDeviceId(storedDesktopId as Id<"devices">);
      setIsPaired(true);
    }
  }, []);

  // Get desktop device status
  const desktopStatus = useQuery(
    api.devices.getStatus,
    desktopDeviceId ? { deviceId: desktopDeviceId } : "skip"
  );

  // Get user info
  const user = useQuery(api.users.get, userId ? { userId } : "skip");

  const isLocked = desktopStatus === "locked";

  if (!isPaired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-zinc-700">
          <svg
            className="w-10 h-10 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Sentinel Key</h1>
        <p className="text-zinc-400 text-center mb-8 max-w-xs">
          Pair this device with your desktop to unlock your workstation.
        </p>

        <Link
          href="/pair"
          className="w-full max-w-xs py-4 px-6 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-center transition-colors"
        >
          Enter Pairing Code
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Sentinel Key</h1>
          <p className="text-sm text-zinc-500">
            {user?.name || "Loading..."}
          </p>
        </div>
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            isLocked
              ? "bg-red-500/20 text-red-400"
              : "bg-green-500/20 text-green-400"
          }`}
        >
          {isLocked ? "LOCKED" : "UNLOCKED"}
        </div>
      </div>

      {/* Status Card */}
      <div
        className={`flex-1 flex flex-col items-center justify-center rounded-3xl p-8 mb-6 ${
          isLocked
            ? "bg-gradient-to-br from-red-950/50 to-zinc-900 border border-red-900/50 pulse-glow"
            : "bg-gradient-to-br from-zinc-800/50 to-zinc-900 border border-zinc-700/50"
        }`}
      >
        {isLocked ? (
          <>
            <div className="w-24 h-24 mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-red-500"
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
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">
              Desktop Locked
            </h2>
            <p className="text-zinc-400 text-center mb-8">
              Walk to your checkpoint and scan the QR code to unlock.
            </p>
            <Link
              href="/scan"
              className="w-full max-w-xs py-4 px-6 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-2"
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
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              Scan to Unlock
            </Link>
          </>
        ) : (
          <>
            <div className="w-24 h-24 mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-green-500"
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
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">
              Desktop Unlocked
            </h2>
            <p className="text-zinc-400 text-center">
              Your workstation is ready. Focus time!
            </p>
          </>
        )}
      </div>

      {/* Settings/Info */}
      <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Work Duration</p>
            <p className="text-lg font-semibold text-zinc-100">
              {user?.workDurationMins || 50} min
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500">Break Duration</p>
            <p className="text-lg font-semibold text-zinc-100">
              {user?.breakDurationMins || 10} min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

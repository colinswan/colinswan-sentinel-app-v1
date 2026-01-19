"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function PairPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const claimPairingCode = useMutation(api.pairing.claimPairingCode);

  // Check if code is valid as user types
  const fullCode = code.join("");
  const isValidCode = useQuery(
    api.pairing.validatePairingCode,
    fullCode.length === 6 ? { code: fullCode } : "skip"
  );

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError(null);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);

      // Focus the next empty input or the last one
      const nextEmptyIndex = newCode.findIndex((c) => !c);
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await claimPairingCode({
        code: fullCode,
        mobileDeviceName: "Mobile Phone",
      });

      // Store pairing info
      localStorage.setItem("sentinel_userId", result.userId);
      localStorage.setItem("sentinel_desktopDeviceId", result.desktopDeviceId);
      localStorage.setItem("sentinel_mobileDeviceId", result.mobileDeviceId);

      // Navigate to dashboard
      router.push("/");
    } catch (err) {
      console.error("Pairing failed:", err);
      setError("Invalid or expired code. Please try again.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = fullCode.length === 6 && !isSubmitting;

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="p-2 -ml-2 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-zinc-100">Pair Device</h1>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-zinc-100 mb-2">Enter Code</h2>
        <p className="text-zinc-400 text-center mb-8 max-w-xs">
          Enter the 6-digit code shown on your desktop Sentinel app.
        </p>

        {/* Code Input */}
        <div className="flex gap-2 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-12 h-14 text-center text-2xl font-mono font-bold rounded-xl border-2 bg-zinc-900 text-zinc-100 outline-none transition-colors ${
                error
                  ? "border-red-500"
                  : digit
                    ? "border-green-500"
                    : "border-zinc-700 focus:border-zinc-500"
              }`}
            />
          ))}
        </div>

        {/* Validation indicator */}
        {fullCode.length === 6 && isValidCode !== undefined && (
          <div
            className={`mb-4 text-sm ${
              isValidCode?.isValid ? "text-green-400" : "text-amber-400"
            }`}
          >
            {isValidCode?.isValid ? "✓ Code is valid" : "Code not found or expired"}
          </div>
        )}

        {/* Error message */}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full max-w-xs py-4 px-6 rounded-xl font-semibold text-center transition-colors ${
            canSubmit
              ? "bg-green-600 hover:bg-green-500 text-white"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Pairing...
            </span>
          ) : (
            "Pair Device"
          )}
        </button>
      </div>

      {/* Help text */}
      <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-400 mb-2">
          How to get the code
        </h3>
        <ol className="text-zinc-500 text-sm space-y-1">
          <li>1. Open Sentinel on your desktop</li>
          <li>2. Click &quot;Pair Mobile Device&quot;</li>
          <li>3. Enter the code shown here</li>
        </ol>
      </div>
    </div>
  );
}

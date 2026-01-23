"use client";

import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { QRScanner } from "@/components/QRScanner";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const CHECKPOINT_PREFIX = "sentinel-checkpoint-";
const MIN_NOTE_LENGTH = 10;
const SUCCESS_DISPLAY_TIME = 5000; // 5 seconds to read while walking back
const DEFAULT_CALF_RAISES = 15;

type ScanState = "scanning" | "accountability" | "analyzing" | "feedback" | "success" | "error";
type TaskStatus = "done" | "in_progress" | "blocked";

interface AIFeedback {
  feedback: string;
  sentiment: "positive" | "neutral" | "needs_improvement";
}

export default function ScanPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [desktopDeviceId, setDesktopDeviceId] = useState<Id<"devices"> | null>(
    null
  );
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [accountabilityNote, setAccountabilityNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);

  // Unlock gating state
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [physicalChallengeComplete, setPhysicalChallengeComplete] = useState(false);

  const unlock = useMutation(api.devices.unlock);
  const analyzeNote = useAction(api.ai.analyzeNote);

  // Fetch a random past win for the success screen
  const pastWin = useQuery(
    api.sessions.getRandomWin,
    userId ? { userId } : "skip"
  );

  useEffect(() => {
    const storedUserId = localStorage.getItem("sentinel_userId");
    const storedDesktopId = localStorage.getItem("sentinel_desktopDeviceId");
    if (!storedDesktopId) {
      router.push("/pair");
      return;
    }
    setDesktopDeviceId(storedDesktopId as Id<"devices">);
    if (storedUserId) {
      setUserId(storedUserId as Id<"users">);
    }
  }, [router]);

  const handleScan = useCallback(
    async (result: string) => {
      if (scanState !== "scanning" || !desktopDeviceId) return;

      if (result.startsWith(CHECKPOINT_PREFIX)) {
        // Trigger haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        // Go to accountability prompt instead of immediate unlock
        setScanState("accountability");
      } else {
        setScanState("error");
        setErrorMessage("Invalid QR code. Please scan a Sentinel checkpoint.");

        // Reset after a moment
        setTimeout(() => {
          setScanState("scanning");
          setErrorMessage("");
        }, 3000);
      }
    },
    [scanState, desktopDeviceId]
  );

  const handleSubmitAccountability = async () => {
    if (!desktopDeviceId || !userId || accountabilityNote.length < MIN_NOTE_LENGTH) return;

    setIsSubmitting(true);
    setScanState("analyzing");

    try {
      // Get AI feedback
      const feedback = await analyzeNote({
        note: accountabilityNote.trim(),
        userId,
      });

      setAiFeedback(feedback);
      setScanState("feedback");
      setIsSubmitting(false);

      // Trigger haptic for feedback received
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch (err) {
      console.error("AI analysis failed:", err);
      // Fallback - skip AI and go straight to unlock
      await performUnlock(accountabilityNote.trim(), undefined);
    }
  };

  const performUnlock = async (note: string, feedback?: string) => {
    if (!desktopDeviceId) return;

    try {
      await unlock({
        deviceId: desktopDeviceId,
        accountabilityNote: note,
        aiFeedback: feedback,
      });

      // Trigger success haptic
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }

      setScanState("success");

      // Navigate home after showing success + past win
      setTimeout(() => {
        router.push("/");
      }, SUCCESS_DISPLAY_TIME);
    } catch (err) {
      console.error("Unlock failed:", err);
      setScanState("error");
      setErrorMessage("Failed to unlock. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleContinueAfterFeedback = async () => {
    setIsSubmitting(true);
    await performUnlock(accountabilityNote.trim(), aiFeedback?.feedback);
  };

  const handleSkipAccountability = async () => {
    if (!desktopDeviceId) return;

    setIsSubmitting(true);

    try {
      await unlock({
        deviceId: desktopDeviceId,
        accountabilityNote: "(skipped)",
      });

      setScanState("success");

      setTimeout(() => {
        router.push("/");
      }, SUCCESS_DISPLAY_TIME);
    } catch (err) {
      console.error("Unlock failed:", err);
      setIsSubmitting(false);
    }
  };

  const handleError = useCallback((error: string) => {
    console.error("Scanner error:", error);
  }, []);

  if (!desktopDeviceId) {
    return null;
  }

  // Get sentiment styles
  const getSentimentStyles = (sentiment: AIFeedback["sentiment"]) => {
    switch (sentiment) {
      case "positive":
        return {
          bgColor: "bg-green-900/30",
          borderColor: "border-green-700/50",
          iconBg: "bg-green-500/20",
          iconColor: "text-green-400",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case "needs_improvement":
        return {
          bgColor: "bg-amber-900/30",
          borderColor: "border-amber-700/50",
          iconBg: "bg-amber-500/20",
          iconColor: "text-amber-400",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
        };
      default:
        return {
          bgColor: "bg-zinc-900/50",
          borderColor: "border-zinc-700/50",
          iconBg: "bg-zinc-500/20",
          iconColor: "text-zinc-400",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

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
        <h1 className="text-lg font-semibold text-zinc-100">
          {scanState === "accountability"
            ? "Before You Unlock"
            : scanState === "analyzing"
              ? "Analyzing..."
              : scanState === "feedback"
                ? "Mentor Feedback"
                : scanState === "success"
                  ? "Walk Back"
                  : "Scan Checkpoint"}
        </h1>
        <div className="w-10" />
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {scanState === "scanning" && (
          <>
            <QRScanner onScan={handleScan} onError={handleError} />
            <p className="mt-6 text-zinc-400 text-center max-w-xs">
              Point your camera at the QR code on your fridge to unlock your
              workstation.
            </p>
          </>
        )}

        {/* GATEKEEPER: Accountability Prompt */}
        {scanState === "accountability" && (
          <div className="w-full max-w-sm">
            {/* Success indicator */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-zinc-100 text-center mb-1">
              Checkpoint Verified ✓
            </h2>
            <p className="text-zinc-400 text-center text-sm mb-5">
              Complete these steps to unlock
            </p>

            {/* Step 1: Task Status */}
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mb-3">
              <label className="block text-sm font-medium text-amber-400 mb-3">
                1️⃣ How did your session go?
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTaskStatus("done")}
                  className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                    taskStatus === "done"
                      ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                      : "bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  ✓ Done
                </button>
                <button
                  onClick={() => setTaskStatus("in_progress")}
                  className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                    taskStatus === "in_progress"
                      ? "bg-amber-500/20 border-2 border-amber-500 text-amber-400"
                      : "bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  ⏳ Progress
                </button>
                <button
                  onClick={() => setTaskStatus("blocked")}
                  className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                    taskStatus === "blocked"
                      ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                      : "bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  🚧 Blocked
                </button>
              </div>
            </div>

            {/* Step 2: What you accomplished */}
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mb-3">
              <label className="block text-sm font-medium text-amber-400 mb-2">
                2️⃣ {taskStatus === "blocked" ? "What blocked you?" : "What did you accomplish?"}
              </label>
              <textarea
                value={accountabilityNote}
                onChange={(e) => setAccountabilityNote(e.target.value)}
                placeholder={
                  taskStatus === "blocked"
                    ? "e.g., Stuck on API integration, need help with..."
                    : "e.g., Finished login flow, Fixed 3 bugs..."
                }
                rows={2}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none text-sm"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-zinc-500">
                  {accountabilityNote.length < MIN_NOTE_LENGTH
                    ? `${MIN_NOTE_LENGTH - accountabilityNote.length} more chars`
                    : "✓"}
                </span>
              </div>
            </div>

            {/* Step 3: Physical Challenge */}
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mb-4">
              <label className="block text-sm font-medium text-amber-400 mb-3">
                3️⃣ Movement Challenge
              </label>
              <button
                onClick={() => setPhysicalChallengeComplete(!physicalChallengeComplete)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  physicalChallengeComplete
                    ? "bg-green-500/20 border-2 border-green-500"
                    : "bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  physicalChallengeComplete
                    ? "bg-green-500"
                    : "bg-zinc-700 border border-zinc-600"
                }`}>
                  {physicalChallengeComplete && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="text-left flex-1">
                  <p className={`text-sm font-medium ${physicalChallengeComplete ? "text-green-400" : "text-zinc-300"}`}>
                    I completed {DEFAULT_CALF_RAISES} calf raises
                  </p>
                  <p className="text-xs text-zinc-500">
                    Helps blood flow & prevents DVT
                  </p>
                </div>
                {physicalChallengeComplete && (
                  <span className="text-green-400 text-lg">💪</span>
                )}
              </button>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitAccountability}
              disabled={
                !taskStatus ||
                accountabilityNote.length < MIN_NOTE_LENGTH ||
                !physicalChallengeComplete ||
                isSubmitting
              }
              className={`w-full py-4 px-6 rounded-xl font-semibold text-center transition-colors mb-3 ${
                taskStatus && accountabilityNote.length >= MIN_NOTE_LENGTH && physicalChallengeComplete && !isSubmitting
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
                  Analyzing...
                </span>
              ) : (
                <>
                  {!taskStatus && "Select session status"}
                  {taskStatus && accountabilityNote.length < MIN_NOTE_LENGTH && "Add more details"}
                  {taskStatus && accountabilityNote.length >= MIN_NOTE_LENGTH && !physicalChallengeComplete && "Complete calf raises"}
                  {taskStatus && accountabilityNote.length >= MIN_NOTE_LENGTH && physicalChallengeComplete && "Submit & Unlock"}
                </>
              )}
            </button>

            {/* Skip option (less prominent) */}
            <button
              onClick={handleSkipAccountability}
              disabled={isSubmitting}
              className="w-full py-2 text-zinc-600 text-sm hover:text-zinc-400 transition-colors"
            >
              Emergency skip (logged)
            </button>
          </div>
        )}

        {/* ANALYZING: Loading state */}
        {scanState === "analyzing" && (
          <div className="w-full max-w-sm text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-amber-400 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mb-2">
              Consulting Your Mentor...
            </h2>
            <p className="text-zinc-400">
              Analyzing your session accomplishments
            </p>
          </div>
        )}

        {/* AI FEEDBACK: Show feedback before unlock */}
        {scanState === "feedback" && aiFeedback && (
          <div className="w-full max-w-sm">
            {/* Icon based on sentiment */}
            <div className="flex justify-center mb-6">
              <div className={`w-16 h-16 rounded-full ${getSentimentStyles(aiFeedback.sentiment).iconBg} flex items-center justify-center`}>
                <span className={getSentimentStyles(aiFeedback.sentiment).iconColor}>
                  {getSentimentStyles(aiFeedback.sentiment).icon}
                </span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-zinc-100 text-center mb-2">
              {aiFeedback.sentiment === "positive"
                ? "Good Work"
                : aiFeedback.sentiment === "needs_improvement"
                  ? "A Word From Your Mentor"
                  : "Feedback"}
            </h2>

            {/* Feedback Card */}
            <div className={`rounded-2xl p-5 border mb-6 ${getSentimentStyles(aiFeedback.sentiment).bgColor} ${getSentimentStyles(aiFeedback.sentiment).borderColor}`}>
              <p className="text-zinc-100 text-center leading-relaxed">
                &ldquo;{aiFeedback.feedback}&rdquo;
              </p>
            </div>

            {/* What you logged */}
            <div className="bg-zinc-900/50 rounded-xl p-3 mb-6 border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">You logged:</p>
              <p className="text-sm text-zinc-300">{accountabilityNote}</p>
            </div>

            {/* Continue to unlock */}
            <button
              onClick={handleContinueAfterFeedback}
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl font-semibold text-center bg-green-600 hover:bg-green-500 text-white transition-colors"
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
                  Unlocking...
                </span>
              ) : (
                "Got It — Unlock Desktop"
              )}
            </button>
          </div>
        )}

        {/* SUCCESS: Walk Back Screen with Past Win */}
        {scanState === "success" && (
          <div className="w-full max-w-sm">
            {/* Success animation */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center success-flash">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-zinc-100 text-center mb-2">
              Unlock Successful!
            </h2>
            <p className="text-green-400 text-center mb-6">
              Great job moving! Desktop is now unlocked.
            </p>

            {/* Show AI feedback summary if we had one */}
            {aiFeedback && (
              <div className={`rounded-xl p-4 border mb-4 ${getSentimentStyles(aiFeedback.sentiment).bgColor} ${getSentimentStyles(aiFeedback.sentiment).borderColor}`}>
                <p className="text-xs text-zinc-500 font-medium mb-1">
                  🤖 Mentor said:
                </p>
                <p className="text-sm text-zinc-200">&ldquo;{aiFeedback.feedback}&rdquo;</p>
              </div>
            )}

            {/* Current accomplishment (if no AI feedback shown) */}
            {!aiFeedback && accountabilityNote && accountabilityNote !== "(skipped)" && (
              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 mb-4">
                <p className="text-xs text-green-500 font-medium mb-1">
                  ✓ Just accomplished:
                </p>
                <p className="text-sm text-zinc-200">{accountabilityNote}</p>
              </div>
            )}

            {/* Past Win - Imposter Syndrome Defense */}
            {pastWin && (
              <div className="bg-gradient-to-br from-amber-900/30 to-zinc-900 rounded-xl p-4 border border-amber-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏆</span>
                  <p className="text-xs text-amber-400 font-medium">
                    Remember this win?
                  </p>
                </div>
                <p className="text-sm text-zinc-200 mb-2">
                  &ldquo;{pastWin.notes}&rdquo;
                </p>
                <p className="text-xs text-zinc-500">
                  {pastWin.daysAgo === 0
                    ? "Earlier today"
                    : pastWin.daysAgo === 1
                      ? "Yesterday"
                      : `${pastWin.daysAgo} days ago`}
                </p>
              </div>
            )}

            {/* No past wins yet - encouragement */}
            {!pastWin && accountabilityNote !== "(skipped)" && (
              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                <p className="text-xs text-zinc-500 text-center">
                  🌱 Keep logging your wins! They&apos;ll appear here to remind
                  you of your progress.
                </p>
              </div>
            )}

            {/* Walk back reminder */}
            <div className="mt-6 text-center">
              <p className="text-zinc-500 text-sm">
                🚶 Walk back to your desk...
              </p>
              <div className="mt-2 w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-[5000ms] ease-linear"
                  style={{ width: "100%", animation: "shrink 5s linear forwards" }}
                />
              </div>
            </div>
          </div>
        )}

        {scanState === "error" && (
          <div className="flex flex-col items-center p-8">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">
              {errorMessage.includes("Invalid") ? "Invalid Code" : "Error"}
            </h2>
            <p className="text-red-400 text-center">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Instructions (only show when scanning) */}
      {scanState === "scanning" && (
        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 mb-2">
            Looking for
          </h3>
          <p className="text-zinc-100 font-mono text-sm">
            sentinel-checkpoint-*
          </p>
          <p className="text-zinc-500 text-xs mt-1">
            Any Sentinel checkpoint QR code
          </p>
        </div>
      )}

      {/* CSS for progress bar animation */}
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

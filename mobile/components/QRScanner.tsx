"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

type ScannerStatus = "initializing" | "requesting" | "scanning" | "error" | "stopped";

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [status, setStatus] = useState<ScannerStatus>("initializing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  const startScanner = useCallback(async () => {
    setStatus("requesting");
    setErrorMessage("");
    setDebugInfo("Requesting camera access...");

    try {
      // First, explicitly request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      setDebugInfo("Camera permission granted. Starting scanner...");

      // Clean up any existing scanner
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === Html5QrcodeScannerState.SCANNING) {
            await scannerRef.current.stop();
          }
        } catch (e) {
          console.log("Cleanup error (ignoring):", e);
        }
        scannerRef.current = null;
      }

      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const scanner = new Html5Qrcode("qr-reader", {
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Prevent multiple scans
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;

          // Trigger haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          
          console.log("QR Code scanned:", decodedText);
          onScan(decodedText);
        },
        () => {
          // QR code not found - this is called frequently, ignore
        }
      );

      setStatus("scanning");
      setDebugInfo("Scanner active - point at QR code");
      
    } catch (err) {
      console.error("Scanner error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setErrorMessage(message);
      setDebugInfo(`Error: ${message}`);
      setStatus("error");
      onError?.(message);
    }
  }, [onScan, onError]);

  // Stop scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === Html5QrcodeScannerState.SCANNING) {
            scannerRef.current.stop().catch(console.error);
          }
        } catch (e) {
          console.log("Cleanup error:", e);
        }
      }
    };
  }, []);

  // Auto-start on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 500); // Small delay to ensure component is mounted

    return () => clearTimeout(timer);
  }, [startScanner]);

  const handleRetry = () => {
    hasScannedRef.current = false;
    startScanner();
  };

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">
          Camera Error
        </h3>
        <p className="text-zinc-400 text-sm mb-4">
          {errorMessage || "Failed to access camera"}
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors"
        >
          Try Again
        </button>
        <p className="text-zinc-600 text-xs mt-4">
          Make sure you&apos;re using HTTPS and have granted camera permission
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Scanner container */}
      <div
        id="qr-reader"
        className="w-full aspect-square max-w-[300px] mx-auto rounded-2xl overflow-hidden bg-zinc-900"
        style={{ minHeight: "300px" }}
      />
      
      {/* Overlay with corner brackets */}
      {status === "scanning" && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[250px] h-[250px] relative">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-500" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-500" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-500" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-500" />
            {/* Scanning line */}
            <div className="absolute left-0 right-0 h-0.5 bg-green-500 opacity-75 scan-line" />
          </div>
        </div>
      )}

      {/* Loading/status indicator */}
      {(status === "initializing" || status === "requesting") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 rounded-2xl">
          <svg
            className="w-8 h-8 text-green-500 animate-spin mb-3"
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
          <p className="text-zinc-400 text-sm">{debugInfo || "Starting camera..."}</p>
        </div>
      )}

      {/* Debug info (can remove in production) */}
      <div className="mt-2 text-center">
        <p className="text-zinc-600 text-xs">
          Status: {status}
        </p>
      </div>
    </div>
  );
}

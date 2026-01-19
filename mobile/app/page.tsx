"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [platform, setPlatform] = useState<"mac" | "windows" | "linux" | "unknown">("unknown");

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("mac")) setPlatform("mac");
    else if (userAgent.includes("win")) setPlatform("windows");
    else if (userAgent.includes("linux")) setPlatform("linux");
  }, []);

  const downloadLinks = {
    mac: "https://github.com/colinswan/colinswan-sentinel-app-v1/releases/latest/download/Sentinel-mac.dmg",
    windows: "https://github.com/colinswan/colinswan-sentinel-app-v1/releases/latest/download/Sentinel-win.exe",
    linux: "https://github.com/colinswan/colinswan-sentinel-app-v1/releases/latest/download/Sentinel-linux.AppImage",
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <span className="text-lg">🛡️</span>
            </div>
            <span className="font-bold text-lg">Sentinel</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">How it Works</a>
            <Link 
              href="/dashboard" 
              className="text-sm px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Open App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 blur-[120px] rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-sm text-zinc-400 mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Built for developers who forget to move
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your Screen Locks.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              You Move.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Sentinel is the only productivity system that <strong className="text-zinc-200">physically forces</strong> you 
            to take breaks. Your computer locks, and the only key is a QR code across the room.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {platform !== "unknown" && (
              <a
                href={downloadLinks[platform]}
                className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download for {platform === "mac" ? "macOS" : platform === "windows" ? "Windows" : "Linux"}
              </a>
            )}
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-semibold text-lg transition-all flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Open Mobile App
            </Link>
          </div>

          {/* All platforms */}
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
            <a href={downloadLinks.mac} className="hover:text-zinc-300 transition-colors flex items-center gap-2">
              <span>🍎</span> macOS
            </a>
            <a href={downloadLinks.windows} className="hover:text-zinc-300 transition-colors flex items-center gap-2">
              <span>🪟</span> Windows
            </a>
            <a href={downloadLinks.linux} className="hover:text-zinc-300 transition-colors flex items-center gap-2">
              <span>🐧</span> Linux
            </a>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Willpower doesn&apos;t work.
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                You know you should take breaks. You&apos;ve tried Pomodoro apps, break reminders, 
                standing desk alerts. But when that notification pops up, you click &quot;skip&quot; 
                and keep working.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                <strong className="text-zinc-200">Sound familiar?</strong> You&apos;re not lazy—you&apos;re 
                in flow. And that&apos;s exactly why you need something you can&apos;t ignore.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">😤</span>
                  <div>
                    <p className="font-medium text-zinc-200">&quot;I&apos;ll take a break in 5 minutes...&quot;</p>
                    <p className="text-sm text-zinc-500">2 hours later, your back is killing you</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🙈</span>
                  <div>
                    <p className="font-medium text-zinc-200">&quot;Let me just finish this one thing...&quot;</p>
                    <p className="text-sm text-zinc-500">The thing turns into 10 things</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💀</span>
                  <div>
                    <p className="font-medium text-zinc-200">&quot;I forgot to stand up all day&quot;</p>
                    <p className="text-sm text-zinc-500">Hello, health problems</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            The only break system you can&apos;t ignore
          </h2>
          <p className="text-zinc-400 text-lg">
            Three simple steps. Zero excuses.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-xl font-bold">
              1
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 pt-10 h-full">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-semibold mb-2">Set Your Timer</h3>
              <p className="text-zinc-400">
                Choose how long you want to work—25, 50, 90 minutes. When time&apos;s up, 
                your screen locks. No dismiss button.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-xl font-bold">
              2
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 pt-10 h-full">
              <div className="text-4xl mb-4">🚶</div>
              <h3 className="text-xl font-semibold mb-2">Walk to Your QR Code</h3>
              <p className="text-zinc-400">
                Print a QR code and place it somewhere away from your desk—the kitchen, 
                bathroom, balcony. Physical movement required.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl font-bold">
              3
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 pt-10 h-full">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Scan to Unlock</h3>
              <p className="text-zinc-400">
                Use your phone to scan the QR code. Briefly reflect on what you accomplished. 
                Desktop unlocks. Blood clots avoided. 
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            More than just a lock screen
          </h2>
          <p className="text-zinc-400 text-lg">
            Sentinel is your AI-powered productivity partner
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Feature 1 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-2xl mb-4">
              🤖
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Productivity Coach</h3>
            <p className="text-zinc-400">
              Get personalized feedback on your work. AI learns your challenges—procrastination, 
              imposter syndrome, perfectionism—and adapts its coaching style.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center text-2xl mb-4">
              📊
            </div>
            <h3 className="text-xl font-semibold mb-2">Project & Task Tracking</h3>
            <p className="text-zinc-400">
              Kanban boards per project. Track time spent on tasks. AI celebrates your 
              wins and reminds you of progress when you doubt yourself.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-purple-500/50 transition-colors">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl mb-4">
              ❤️
            </div>
            <h3 className="text-xl font-semibold mb-2">Health Dashboard</h3>
            <p className="text-zinc-400">
              Track sitting streaks, movement breaks, and see your DVT risk score. 
              Built by someone who knows the real stakes of sitting too long.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-pink-500/50 transition-colors">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center text-2xl mb-4">
              🆘
            </div>
            <h3 className="text-xl font-semibold mb-2">Emergency Override</h3>
            <p className="text-zinc-400">
              Real emergencies happen. A friction-heavy escape hatch lets you unlock 
              without walking—but makes you really think about it first.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-3xl">
                👨‍💻
              </div>
              <div>
                <h3 className="text-xl font-semibold">Why I built this</h3>
                <p className="text-zinc-500">A personal note</p>
              </div>
            </div>
            <div className="space-y-4 text-zinc-300 leading-relaxed">
              <p>
                I&apos;m a developer with <strong>Hereditary Multiple Exostoses (HME)</strong> and 
                a history of <strong>Deep Vein Thrombosis (DVT)</strong>. For me, sitting too long 
                isn&apos;t just uncomfortable—it&apos;s dangerous.
              </p>
              <p>
                I tried every break reminder app. They all had the same fatal flaw: a dismiss 
                button. When I&apos;m deep in code, I&apos;d click it without thinking.
              </p>
              <p>
                Sentinel is the solution I built for myself. <strong>No dismiss button. No snooze. 
                No exceptions.</strong> If my screen is locked, I&apos;m walking to that QR code.
              </p>
              <p className="text-zinc-500 italic">
                If you struggle with taking breaks too, I hope this helps you as much as it 
                helps me.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-zinc-900/0 via-emerald-950/20 to-zinc-900/0">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to actually take breaks?
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            Free and open source. Your health data stays on your machine.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {platform !== "unknown" && (
              <a
                href={downloadLinks[platform]}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
              >
                Download Desktop App
              </a>
            )}
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-semibold text-lg transition-all"
            >
              Use Mobile App
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <span className="text-sm">🛡️</span>
            </div>
            <span className="font-semibold">Sentinel</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500 text-sm">Force yourself to move</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a 
              href="https://github.com/colinswan/colinswan-sentinel-app-v1" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
            <span className="text-zinc-700">•</span>
            <span>Made with ❤️ for your health</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import {
  ArrowRight,
  Bot,
  Brain,
  FileSearch,
  Rocket,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";


import { useEffect, useRef, useState } from "react";

// Scroll animation for feature tiles
function AnimatedTile({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        setVisible(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transition: "opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(40px)",
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

export function LandingPage({ onGuestLogin }: { onGuestLogin?: () => void }) {
  const { signOut, user } = useClerk();

  const handleGuest = async () => {
    // Sign out first if user has an active session
    try {
      await signOut();
    } catch (e) {
      // Ignore errors - user might not be signed in
    }
    if (onGuestLogin) {
      onGuestLogin();
    }
  };

  const featureCards = [
    {
      icon: Brain,
      title: "Context-aware answers",
      body: "Grounded in your FRC rules, strategy notes, and match data.",
    },
    {
      icon: UploadCloud,
      title: "Drop-in documents",
      body: "Upload manuals, scouting sheets, or PDFs to inform every reply.",
    },
    {
      icon: ShieldCheck,
      title: "Fast + reliable",
      body: "Rate-limited, stable pipeline built for drive teams on the clock.",
    },
  ];

  // Typewriter effect for hero text
  const heroText = "Rethink how your team searches, plans, and makes calls.";
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);
  useEffect(() => {
    setTyped("");
    setDone(false);
    idx.current = 0;
    const interval = setInterval(() => {
      setTyped((prev) => {
        if (idx.current < heroText.length) {
          idx.current += 1;
          return heroText.slice(0, idx.current);
        } else {
          clearInterval(interval);
          setDone(true);
          return prev;
        }
      });
    }, 60); // slower typing
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(circle_at_20%_20%,rgba(82,132,255,0.18),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(255,94,148,0.18),transparent_22%),radial-gradient(circle_at_50%_70%,rgba(99,102,241,0.16),transparent_28%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1700px] flex-col px-12 pb-16 pt-10 lg:px-32">
        <nav className="mb-10 flex items-center justify-between rounded-full border border-white/5 bg-white/5 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-rose-500 shadow-lg shadow-blue-500/20">
              <Bot className="h-6 w-6" />
            </div>
            <div className="leading-tight">
              <p className="text-sm text-white/70">FRC RAG</p>
              <p className="text-lg font-semibold tracking-tight">Technical Copilot</p>
            </div>
          </div>
          <Button variant="secondary" className="border border-white/10 bg-white/5 text-white hover:bg-white/10" asChild>
            <Link href="https://github.com/AadiJo/frc-rag-backend" target="_blank" rel="noopener noreferrer">View Source</Link>
          </Button>
        </nav>


        <div className="grid flex-1 grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
              <Sparkles className="h-4 w-4" />
              Build smarter, iterate faster
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                <span className="whitespace-pre-wrap block min-h-[10rem] sm:min-h-[11rem] lg:min-h-[13.5rem]">
                  {typed || "\u00A0"}
                  {!done && <span className="animate-pulse">|</span>}
                </span>
              </h1>
              <p className="max-w-2xl text-lg text-white/70">
                An AI assistant tuned for FRC workflows: pull rules, scout faster, explain mechanisms, and keep match prep moving. Bring your docs, images, and context—RAG handles the rest.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
              <span className="rounded-full bg-white/5 px-3 py-2">Image Q&A</span>
              <span className="rounded-full bg-white/5 px-3 py-2">Drive team briefs</span>
              <span className="rounded-full bg-white/5 px-3 py-2">Rulebook citations</span>
              <span className="rounded-full bg-white/5 px-3 py-2">Match prep checklists</span>
            </div>
            {(!user) && (
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Button size="lg" className="h-12 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500 text-base shadow-lg shadow-blue-500/30" asChild>
                  <Link href="/sign-in" className="flex items-center gap-2">
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-xl border-white/20 bg-white/5 text-base text-white hover:bg-white/10" onClick={handleGuest}>
                  Continue as guest
                </Button>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 translate-x-6 translate-y-6 rounded-3xl bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-rose-500/20 blur-3xl" />
            <div className="relative rounded-3xl border border-white/10 bg-[#0f1115] p-6 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Live workspace</p>
                    <p className="text-base font-semibold">Drive Team HQ</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">Online</span>
              </div>

              <div className="mt-6 space-y-4 rounded-2xl border border-white/5 bg-[#0b0c10] p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <div className="space-y-1">
                    <p className="text-sm text-white/60">Query</p>
                    <p className="text-base font-medium">"What is the pin spacing on the 2025 game piece sensor?"</p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-white/80 leading-relaxed">
                  <p>According to rule R704, the 2025 Game Piece Sensor is required to use</p>
                  <p>a 3-pin JST-PH style connector with a 2.00 mm pin spacing. This rule...</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
                  <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-white/50">Uploads</p>
                    <p className="font-semibold">Manual.pdf • Scouting.csv</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-white/50">TOOLS:</p>
                    <p className="font-semibold">Reasoning</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, body }, idx) => (
            <AnimatedTile key={title} index={idx}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-black/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/80 to-indigo-500/80 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <p className="mt-3 text-sm text-white/70">{body}</p>
              </div>
            </AnimatedTile>
          ))}
        </div>

        {/* RAG Explanation Section with Diagram */}
        <div className="mt-20 rounded-3xl border border-white/10 bg-white/5 px-4 py-10 shadow-lg shadow-black/30 lg:px-12 flex flex-col gap-12 items-center">
          <div className="w-full flex flex-col lg:flex-row gap-12 items-center justify-between">
            <div className="flex-1 min-w-[320px] max-w-xl space-y-5 lg:pr-8">
              <h2 className="text-3xl font-bold mb-2">How does FRC RAG work?</h2>
              <p className="text-white/80 text-lg">RAG stands for <span className="font-semibold text-blue-400">Retrieval-Augmented Generation</span>. Instead of relying only on a language model's memory, RAG pulls in your team's real documents, images, and data to answer questions with up-to-date, context-rich information.</p>
              <ul className="list-disc pl-6 text-white/70 space-y-2">
                <li><span className="font-semibold text-blue-400">Upload</span> your rulebooks, scouting sheets, and images.</li>
                <li><span className="font-semibold text-blue-400">Ask</span> questions about rules, strategy, or even images.</li>
                <li><span className="font-semibold text-blue-400">RAG</span> finds the most relevant info, then the AI crafts a tailored answer by citing sources and linking docs.</li>
              </ul>
              <p className="text-white/70 mt-4">This means you get answers that are <span className="font-semibold text-blue-400">grounded in your own data</span>—not just generic AI guesses.</p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-8 min-w-[340px] max-w-xl">
              {/* Animated RAG Diagram */}
              <div className="w-full flex justify-center">
                <svg width="520" height="210" viewBox="0 0 520 210" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                  {/* User */}
                  <g>
                    <rect x="20" y="80" width="70" height="50" rx="12" fill="#23263a" stroke="#3b82f6" strokeWidth="2" />
                    <text x="55" y="110" textAnchor="middle" fill="#8ecaff" fontSize="15" fontWeight="bold">User</text>
                  </g>
                  {/* Docs */}
                  <g>
                    <rect x="110" y="40" width="80" height="40" rx="10" fill="#181a22" stroke="#6366f1" strokeWidth="2" />
                    <text x="150" y="65" textAnchor="middle" fill="#a5b4fc" fontSize="13">Docs</text>
                  </g>
                  {/* Images */}
                  <g>
                    <rect x="110" y="130" width="80" height="40" rx="10" fill="#181a22" stroke="#6366f1" strokeWidth="2" />
                    <text x="150" y="155" textAnchor="middle" fill="#a5b4fc" fontSize="13">Images</text>
                  </g>
                  {/* Retrieval Node */}
                  <g>
                    <rect x="230" y="80" width="80" height="50" rx="12" fill="#23263a" stroke="#3b82f6" strokeWidth="2" />
                    <text x="270" y="110" textAnchor="middle" fill="#8ecaff" fontSize="14" fontWeight="bold">Retrieval</text>
                  </g>
                  {/* Model Node */}
                  <g>
                    <rect x="370" y="80" width="70" height="50" rx="12" fill="#23263a" stroke="#f472b6" strokeWidth="2" />
                    <text x="405" y="110" textAnchor="middle" fill="#f472b6" fontSize="15" fontWeight="bold">AI</text>
                  </g>
                  {/* Output answer */}
                  <g>
                    <rect x="370" y="10" width="70" height="40" rx="10" fill="#181a22" stroke="#f472b6" strokeWidth="2" />
                    <text x="405" y="35" textAnchor="middle" fill="#f472b6" fontSize="13" fontWeight="bold">Answer</text>
                  </g>
                  {/* Merged Arrow: User, Docs, Images to Retrieval (lines only) */}
                  <g>
                    <line x1="90" y1="105" x2="230" y2="105" stroke="#3b82f6" strokeWidth="4" />
                    <line x1="190" y1="60" x2="230" y2="105" stroke="#6366f1" strokeWidth="3" />
                    <line x1="190" y1="150" x2="230" y2="105" stroke="#6366f1" strokeWidth="3" />
                    <line x1="310" y1="105" x2="370" y2="105" stroke="#f472b6" strokeWidth="4" />
                  </g>
                  {/* AI to Answer (vertical, spaced, line only) */}
                  <g>
                    <line x1="405" y1="80" x2="405" y2="50" stroke="#f472b6" strokeWidth="3" />
                  </g>
                </svg>
              </div>
              <div className="flex flex-col gap-4 w-full lg:flex-row lg:gap-6 mt-4">
                <div className="flex-1 rounded-2xl border border-blue-500/30 bg-[#10131a] p-6 shadow-lg min-w-[200px]">
                  <p className="text-blue-400 font-semibold mb-2">RAG Pipeline</p>
                  <ol className="list-decimal pl-5 text-white/80 text-sm space-y-1">
                    <li>Receive your question</li>
                    <li>Search your uploaded docs/images</li>
                    <li>Extract the most relevant info</li>
                    <li>Generate a custom answer with citations</li>
                  </ol>
                </div>
                <div className="flex-1 rounded-2xl border border-indigo-500/30 bg-[#181a22] p-6 shadow-lg min-w-[200px]">
                  <p className="text-indigo-400 font-semibold mb-2">Why it matters</p>
                  <ul className="list-disc pl-5 text-white/80 text-sm space-y-1">
                    <li>No more searching PDFs manually</li>
                    <li>Always up-to-date with your latest docs</li>
                    <li>Source-cited answers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* FAQ Section at bottom */}
        <div className="mt-20 max-w-3xl mx-auto w-full">
          <h2 className="text-2xl font-bold mb-6">FAQ</h2>
          <div className="space-y-4">
            <details className="rounded-xl border border-white/10 bg-white/5 p-4 group">
              <summary className="cursor-pointer text-lg font-semibold text-blue-400 group-open:text-blue-300">What model does it use?</summary>
              <div className="mt-2 text-white/80 text-base">FRC RAG uses GPT OSS 20B running on the backend, with retrieval-augmented context from your uploaded docs and images.</div>
            </details>
            <details className="rounded-xl border border-white/10 bg-white/5 p-4 group">
              <summary className="cursor-pointer text-lg font-semibold text-blue-400 group-open:text-blue-300">Can I provide my own model?</summary>
              <div className="mt-2 text-white/80 text-base">Currently, you provide your own model directly through the chutes API, with more providers coming soon.</div>
            </details>
            <details className="rounded-xl border border-white/10 bg-white/5 p-4 group">
              <summary className="cursor-pointer text-lg font-semibold text-blue-400 group-open:text-blue-300">What data is stored?</summary>
              <div className="mt-2 text-white/80 text-base">No data is stored in the cloud, with everything staying in your local session. In the future, data like chat history will be tied to your account.</div>
            </details>
          </div>
        </div>
        {/* Credit line at very bottom */}
        <footer className="w-full mt-12 pb-6 flex justify-center">
          <span className="text-sm text-white/40">by <a href="https://github.com/AadiJo" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">Advait Johari</a></span>
        </footer>
      </div>
    </div>
  );
}
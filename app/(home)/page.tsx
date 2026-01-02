"use client";

import {
  ArrowRight,
  Bot,
  Brain,
  ChevronRight,
  CloudUpload,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { UserMenu } from "@/app/components/layout/user-menu";
import { useUser } from "@/app/providers/user-provider";
import { GITHUB_REPO_URL } from "@/lib/config";

// Scroll animation for feature tiles - optimized for high FPS
function AnimatedTile({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          requestAnimationFrame(() => {
            if (entry.isIntersecting) {
              setVisible(true);
            }
          });
        }
      },
      {
        rootMargin: "0px 0px -80px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className="h-full"
      ref={ref}
      style={{
        transition:
          "opacity 0.7s cubic-bezier(.4,0,.2,1) 0s, transform 0.7s cubic-bezier(.4,0,.2,1) 0s",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(40px)",
        willChange: visible ? "auto" : "opacity, transform",
        backfaceVisibility: "hidden",
        perspective: "1000px",
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { user } = useUser();
  const isSignedIn = user && !user.isAnonymous;

  const featureCards = [
    {
      icon: Brain,
      title: "Context-aware answers",
      body: "Grounded in your FRC rules, strategy notes, and match data.",
    },
    {
      icon: CloudUpload,
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
  const charIdx = useRef(0);

  useEffect(() => {
    setTyped("");
    setDone(false);
    charIdx.current = 0;
    const interval = setInterval(() => {
      setTyped((prev) => {
        if (charIdx.current < heroText.length) {
          charIdx.current += 1;
          return heroText.slice(0, charIdx.current);
        }
        clearInterval(interval);
        setDone(true);
        return prev;
      });
    }, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808] text-sm text-white sm:text-base">
      {/* Gradient background */}
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(circle_at_20%_20%,rgba(82,132,255,0.18),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.18),transparent_22%),radial-gradient(circle_at_50%_70%,rgba(99,102,241,0.16),transparent_28%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1700px] flex-col px-4 pt-10 pb-16 sm:px-8 lg:px-32">
        {/* Navigation */}
        <nav className="mb-10 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-purple-500/20 shadow-blue-500/20 shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-white/70 text-xs sm:text-sm">FRC RAG</p>
              <p className="font-semibold text-base tracking-tight sm:text-lg">
                Technical Copilot
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 font-medium text-sm text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              href={GITHUB_REPO_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              View Source
            </Link>
            {isSignedIn && user ? <UserMenu user={user} /> : null}
          </div>
        </nav>

        {/* Hero Section */}
        <div className="grid flex-1 grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="flex w-full justify-center sm:justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70 uppercase tracking-[0.2em] sm:text-xs">
                <Sparkles className="h-4 w-4 text-white/70" />
                Build smarter, iterate faster
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="font-semibold text-4xl leading-tight tracking-tight sm:text-5xl lg:text-7xl">
                <div className="relative inline-block">
                  <span className="invisible block whitespace-pre-wrap">
                    {heroText}
                  </span>
                  <span className="absolute inset-0 block whitespace-pre-wrap">
                    {typed || "\u00A0"}
                    {!done && <span className="animate-pulse">|</span>}
                  </span>
                </div>
              </h1>
              <p className="max-w-2xl text-sm text-white/70 sm:text-lg">
                An AI assistant tuned for FRC workflows: pull rules, scout
                faster, explain mechanisms, and keep match prep moving. Bring
                your docs, images, and context—RAG handles the rest.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-white/80 text-xs sm:justify-start sm:text-sm">
              <span className="rounded-full bg-white/5 px-3 py-2">
                Image Q&A
              </span>
              <span className="rounded-full bg-white/5 px-3 py-2">
                Drive team briefs
              </span>
              <span className="rounded-full bg-white/5 px-3 py-2">
                Rulebook citations
              </span>
              <span className="rounded-full bg-white/5 px-3 py-2">
                Match prep checklists
              </span>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              {isSignedIn ? (
                <Link
                  className="shiny-button relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-transparent bg-gradient-to-r from-blue-500/40 via-indigo-500/30 to-purple-500/40 px-4 font-medium text-sm text-white shadow-blue-500/10 shadow-lg transition-all hover:from-blue-500/50 hover:via-indigo-500/40 hover:to-purple-500/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:h-12 sm:px-6 sm:text-base"
                  href="/chat"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                    backgroundSize: "200% 100%",
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Enter Chat
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ) : (
                <>
                  <Link
                    className="shiny-button relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-transparent bg-gradient-to-r from-blue-500/40 via-indigo-500/30 to-purple-500/40 px-4 font-medium text-sm text-white shadow-blue-500/10 shadow-lg transition-all hover:from-blue-500/50 hover:via-indigo-500/40 hover:to-purple-500/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:h-12 sm:px-6 sm:text-base"
                    href="/auth"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                      backgroundSize: "200% 100%",
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Get started
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                  <Link
                    className="relative inline-flex h-10 items-center justify-center rounded-xl border-2 border-purple-400/40 border-dashed bg-purple-500/5 px-4 font-medium text-purple-100 text-sm backdrop-blur-sm transition-all hover:border-purple-400/60 hover:bg-purple-500/10 hover:text-purple-50 hover:shadow-lg hover:shadow-purple-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:h-12 sm:px-6 sm:text-base"
                    href="/chat"
                  >
                    Continue as guest
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Demo Card */}
          <div className="relative">
            <div className="absolute inset-0 translate-x-6 translate-y-6 rounded-2xl bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-[#0f1115] p-6 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-purple-500/20 shadow-blue-500/10 shadow-lg sm:h-10 sm:w-10">
                    <Bot className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs sm:text-sm">
                      Shared chat
                    </p>
                    <p className="font-semibold text-sm sm:text-base">
                      Ground Intake Specifications
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-semibold text-[11px] text-emerald-200 sm:text-xs">
                  Online
                </span>
              </div>

              <div className="mt-6 space-y-4 rounded-xl border border-white/5 bg-[#0b0c10] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-0 w-0 sm:mt-[6px] sm:h-2 sm:w-2 sm:rounded-full sm:bg-emerald-400" />
                  <div className="space-y-1">
                    <p className="text-white/60 text-xs sm:text-sm">Query</p>
                    <p className="font-medium text-sm sm:text-base">
                      "How have teams made ground intakes for balls?"
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-white/80 text-xs leading-relaxed sm:p-4 sm:text-sm">
                  <p>
                    This drawing shows a funnel‑style intake that collects balls
                    from the ground and guides them into a conveyor system. It
                    is designed to be mounted at the front bumper and is...
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 text-white/70 text-xs sm:grid-cols-2 sm:text-sm">
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3 sm:p-4">
                    <p className="text-[11px] text-white/50 uppercase tracking-wide sm:text-xs">
                      Uploads
                    </p>
                    <p className="font-semibold">robo-2022.pdf</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3 sm:p-4">
                    <p className="text-[11px] text-white/50 uppercase tracking-wide sm:text-xs">
                      TOOLS:
                    </p>
                    <p className="font-semibold">Search</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-10 grid gap-5 sm:mt-20 sm:gap-8 lg:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, body }) => (
            <AnimatedTile key={title}>
              <div className="h-full rounded-xl border border-white/10 bg-white/5 p-5 shadow-black/30 shadow-inner sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-purple-500/20 shadow-blue-500/10 shadow-lg sm:h-11 sm:w-11">
                    <Icon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    {title}
                  </h3>
                </div>
                <p className="mt-3 text-white/70 text-xs sm:text-sm">{body}</p>
              </div>
            </AnimatedTile>
          ))}
        </div>

        {/* RAG Explanation Section */}
        <AnimatedTile>
          <div className="mt-10 flex w-full flex-col items-center gap-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-10 shadow-black/30 shadow-lg sm:mt-20 sm:gap-12 md:px-8 lg:px-12">
            <div className="flex w-full min-w-0 flex-col items-center justify-between gap-8 sm:gap-12 lg:flex-row">
              <div className="w-full min-w-0 max-w-xl flex-1 space-y-5 lg:pr-8">
                <h2 className="mb-2 font-bold text-2xl sm:text-3xl">
                  How does FRC RAG work?
                </h2>
                <p className="text-base text-white/80 sm:text-lg">
                  RAG stands for{" "}
                  <span className="font-semibold text-blue-400">
                    Retrieval-Augmented Generation
                  </span>
                  . Instead of relying only on a language model's memory, RAG
                  pulls in your team's real documents, images, and data to
                  answer questions with up-to-date, context-rich information.
                </p>
                <ul className="list-disc space-y-2 pl-6 text-sm text-white/70 sm:text-base">
                  <li>
                    <span className="font-semibold text-blue-400">Upload</span>{" "}
                    your rulebooks, scouting sheets, and images.
                  </li>
                  <li>
                    <span className="font-semibold text-blue-400">Ask</span>{" "}
                    questions about rules, strategy, or even images.
                  </li>
                  <li>
                    <span className="font-semibold text-blue-400">RAG</span>{" "}
                    finds the most relevant info, then the AI crafts a tailored
                    answer by citing sources and linking docs.
                  </li>
                </ul>
                <p className="mt-4 text-sm text-white/70 sm:text-lg">
                  This means you get answers that are{" "}
                  <span className="font-semibold text-blue-400">
                    grounded in your own data
                  </span>
                  —not just generic AI guesses.
                </p>
              </div>
              <div className="flex w-full min-w-0 max-w-xl flex-1 flex-col items-center gap-8">
                {/* RAG Diagram */}
                <div className="flex w-full justify-center">
                  <svg
                    aria-label="Retrieval augmented generation diagram"
                    className="h-auto w-full max-w-[420px] drop-shadow-lg sm:max-w-[520px]"
                    fill="none"
                    role="img"
                    viewBox="0 0 520 210"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* User */}
                    <g>
                      <rect
                        fill="#23263a"
                        height="50"
                        rx="12"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        width="70"
                        x="20"
                        y="80"
                      />
                      <text
                        fill="#8ecaff"
                        fontSize="15"
                        fontWeight="bold"
                        textAnchor="middle"
                        x="55"
                        y="110"
                      >
                        User
                      </text>
                    </g>
                    {/* Docs */}
                    <g>
                      <rect
                        fill="#181a22"
                        height="40"
                        rx="10"
                        stroke="#6366f1"
                        strokeWidth="2"
                        width="80"
                        x="110"
                        y="40"
                      />
                      <text
                        fill="#a5b4fc"
                        fontSize="13"
                        textAnchor="middle"
                        x="150"
                        y="65"
                      >
                        Docs
                      </text>
                    </g>
                    {/* Images */}
                    <g>
                      <rect
                        fill="#181a22"
                        height="40"
                        rx="10"
                        stroke="#6366f1"
                        strokeWidth="2"
                        width="80"
                        x="110"
                        y="130"
                      />
                      <text
                        fill="#a5b4fc"
                        fontSize="13"
                        textAnchor="middle"
                        x="150"
                        y="155"
                      >
                        Images
                      </text>
                    </g>
                    {/* Retrieval Node */}
                    <g>
                      <rect
                        fill="#23263a"
                        height="50"
                        rx="12"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        width="80"
                        x="230"
                        y="80"
                      />
                      <text
                        fill="#8ecaff"
                        fontSize="14"
                        fontWeight="bold"
                        textAnchor="middle"
                        x="270"
                        y="110"
                      >
                        Retrieval
                      </text>
                    </g>
                    {/* Model Node */}
                    <g>
                      <rect
                        fill="#23263a"
                        height="50"
                        rx="12"
                        stroke="#8b5cf6"
                        strokeWidth="2"
                        width="70"
                        x="370"
                        y="80"
                      />
                      <text
                        fill="#8b5cf6"
                        fontSize="15"
                        fontWeight="bold"
                        textAnchor="middle"
                        x="405"
                        y="110"
                      >
                        AI
                      </text>
                    </g>
                    {/* Output answer */}
                    <g>
                      <rect
                        fill="#181a22"
                        height="40"
                        rx="10"
                        stroke="#8b5cf6"
                        strokeWidth="2"
                        width="70"
                        x="370"
                        y="10"
                      />
                      <text
                        fill="#8b5cf6"
                        fontSize="13"
                        fontWeight="bold"
                        textAnchor="middle"
                        x="405"
                        y="35"
                      >
                        Answer
                      </text>
                    </g>
                    {/* Arrows */}
                    <g>
                      <line
                        stroke="#3b82f6"
                        strokeWidth="4"
                        x1="90"
                        x2="230"
                        y1="105"
                        y2="105"
                      />
                      <line
                        stroke="#6366f1"
                        strokeWidth="3"
                        x1="190"
                        x2="230"
                        y1="60"
                        y2="105"
                      />
                      <line
                        stroke="#6366f1"
                        strokeWidth="3"
                        x1="190"
                        x2="230"
                        y1="150"
                        y2="105"
                      />
                      <line
                        stroke="#8b5cf6"
                        strokeWidth="4"
                        x1="310"
                        x2="370"
                        y1="105"
                        y2="105"
                      />
                    </g>
                    {/* AI to Answer */}
                    <g>
                      <line
                        stroke="#8b5cf6"
                        strokeWidth="3"
                        x1="405"
                        x2="405"
                        y1="80"
                        y2="50"
                      />
                    </g>
                  </svg>
                </div>
                <div className="mt-2 flex w-full flex-col gap-3 sm:mt-4 sm:gap-4 lg:flex-row lg:gap-6">
                  <div className="min-w-[200px] flex-1 rounded-xl border border-blue-500/30 bg-[#10131a] p-6 shadow-lg">
                    <p className="mb-2 font-semibold text-base text-blue-400 sm:text-lg">
                      RAG Pipeline
                    </p>
                    <ol className="list-decimal space-y-1 pl-5 text-sm text-white/80 sm:text-base">
                      <li>Receive your question</li>
                      <li>Search your uploaded docs/images</li>
                      <li>Extract the most relevant info</li>
                      <li>Generate a custom answer with citations</li>
                    </ol>
                  </div>
                  <div className="min-w-[200px] flex-1 rounded-xl border border-indigo-500/30 bg-[#181a22] p-6 shadow-lg">
                    <p className="mb-2 font-semibold text-base text-indigo-400 sm:text-lg">
                      Why it matters
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-white/80 sm:text-base">
                      <li>No more searching PDFs manually</li>
                      <li>Always up-to-date with your latest docs</li>
                      <li>Source-cited answers</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedTile>

        {/* FAQ Section */}
        <AnimatedTile>
          <div className="mx-auto mt-10 w-full max-w-3xl sm:mt-20">
            <h2 className="mb-6 font-bold text-xl sm:text-3xl">FAQ</h2>
            <div className="space-y-4">
              <details className="group rounded-xl border border-white/10 bg-white/5 p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-blue-400 text-sm group-open:text-blue-300 sm:text-lg [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-open:rotate-90 sm:h-5 sm:w-5" />
                  <span>What model does it use?</span>
                </summary>
                <div className="mt-2 ml-6 text-white/80 text-xs sm:text-base">
                  FRC RAG supports multiple AI models through OpenRouter,
                  from OpenAI, Google, xAI, and more. You can select your
                  preferred model in the chat settings.
                </div>
              </details>
              <details className="group rounded-xl border border-white/10 bg-white/5 p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-blue-400 text-sm group-open:text-blue-300 sm:text-lg [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-open:rotate-90 sm:h-5 sm:w-5" />
                  <span>Can I provide my own API key?</span>
                </summary>
                <div className="mt-2 ml-6 text-white/80 text-xs sm:text-base">
                  Yes! You can add your own API keys for various providers in
                  the settings. This allows you to use your own credits and
                  unlock additional models.
                </div>
              </details>
              <details className="group rounded-xl border border-white/10 bg-white/5 p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-blue-400 text-sm group-open:text-blue-300 sm:text-lg [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-open:rotate-90 sm:h-5 sm:w-5" />
                  <span>What data is stored?</span>
                </summary>
                <div className="mt-2 ml-6 text-white/80 text-xs sm:text-base">
                  Your chat history and uploaded files are stored securely in
                  your account. You can delete your data at any time from the
                  settings page.
                </div>
              </details>
            </div>
          </div>
        </AnimatedTile>

        {/* Footer */}
        <footer className="mt-8 flex w-full justify-center pb-6 sm:mt-12">
          <span className="text-white/40 text-xs sm:text-sm">
            by{" "}
            <a
              className="underline hover:text-blue-400"
              href="https://github.com/AadiJo"
              rel="noopener noreferrer"
              target="_blank"
            >
              Advait Johari
            </a>
            {" "}
            —{" "}
            <a
              className="underline hover:text-blue-400"
              href="https://frcrag.johari-dev.com/privacy-policy"
            >
              Privacy Policy
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}

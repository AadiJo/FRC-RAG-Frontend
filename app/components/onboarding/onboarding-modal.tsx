"use client";

import {
    ArrowRight,
    ChatCircleDots,
    Files,
    Fire,
    Key,
    Lightning,
    Sparkle,
    X,
} from "@phosphor-icons/react";
import { useAction } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import AppIcon from "@/app/icon0.svg";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { api } from "@/convex/_generated/api";
import {
    type ApiKeyProvider,
    validateApiKey,
} from "@/lib/config/api-keys";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "frc-rag-onboarding-completed";

// Check if onboarding has been completed
export function hasCompletedOnboarding(): boolean {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(ONBOARDING_KEY) === "true";
}

// Mark onboarding as completed
export function completeOnboarding(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ONBOARDING_KEY, "true");
}

// Reset onboarding (for testing)
export function resetOnboarding(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ONBOARDING_KEY);
}

interface OnboardingModalProps {
    onComplete: () => void;
}

type Step = "welcome" | "features" | "rate-limits" | "api-keys" | "complete";

const STEPS: Step[] = ["welcome", "features", "rate-limits", "api-keys", "complete"];

const FEATURES = [
    {
        icon: ChatCircleDots,
        title: "Context-Aware Answers",
        description: "Grounded in FRC rules, strategy notes, and match data.",
    },
    {
        icon: Files,
        title: "Drop-in Documents",
        description: "Upload manuals, scouting sheets, or PDFs to inform every reply.",
    },
    {
        icon: Lightning,
        title: "Fast + Reliable",
        description: "Rate-limited, stable pipeline built for drive teams on the clock.",
    },
];

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>("welcome");
    const [groqKey, setGroqKey] = useState("");
    const [openRouterKey, setOpenRouterKey] = useState("");
    const [groqError, setGroqError] = useState<string>();
    const [openRouterError, setOpenRouterError] = useState<string>();
    const [isSaving, setIsSaving] = useState(false);
    const [keysSaved, setKeysSaved] = useState<{ groq: boolean; openrouter: boolean }>({
        groq: false,
        openrouter: false,
    });

    const saveApiKey = useAction(api.api_keys.saveApiKey);

    const stepIndex = STEPS.indexOf(currentStep);
    const isFirstStep = stepIndex === 0;
    const isLastStep = stepIndex === STEPS.length - 1;

    const goNext = useCallback(() => {
        const nextIndex = stepIndex + 1;
        if (nextIndex < STEPS.length) {
            setCurrentStep(STEPS[nextIndex]);
        }
    }, [stepIndex]);

    const goBack = useCallback(() => {
        const prevIndex = stepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(STEPS[prevIndex]);
        }
    }, [stepIndex]);

    const handleSkip = useCallback(() => {
        completeOnboarding();
        onComplete();
    }, [onComplete]);

    const handleComplete = useCallback(() => {
        completeOnboarding();
        onComplete();
    }, [onComplete]);

    const handleSaveKey = useCallback(
        async (provider: ApiKeyProvider, key: string) => {
            if (!key.trim()) return;

            const validation = validateApiKey(provider, key);
            if (!validation.isValid) {
                if (provider === "groq") {
                    setGroqError(validation.error);
                } else {
                    setOpenRouterError(validation.error);
                }
                return;
            }

            setIsSaving(true);
            try {
                const result = await saveApiKey({ provider, key });
                if (!result.ok) {
                    const errorMsg = "Invalid API key - please check and try again";
                    if (provider === "groq") {
                        setGroqError(errorMsg);
                    } else {
                        setOpenRouterError(errorMsg);
                    }
                    return;
                }

                toast({ title: `${provider === "groq" ? "Groq" : "OpenRouter"} key saved!`, status: "success" });
                setKeysSaved((prev) => ({ ...prev, [provider]: true }));
                if (provider === "groq") {
                    setGroqKey("");
                    setGroqError(undefined);
                } else {
                    setOpenRouterKey("");
                    setOpenRouterError(undefined);
                }
            } catch {
                toast({ title: "Failed to save key", status: "error" });
            } finally {
                setIsSaving(false);
            }
        },
        [saveApiKey]
    );

    const renderStep = () => {
        switch (currentStep) {
            case "welcome":
                return (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center justify-center text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="mb-6"
                        >
                            <Image
                                src={AppIcon}
                                alt="App Icon"
                                width={96}
                                height={96}
                                className="size-24 rounded-xl"
                            />
                        </motion.div>
                        <h2 className="mb-3 bg-gradient-to-r from-white to-white/70 bg-clip-text font-bold text-3xl text-transparent">
                            Welcome to FRC RAG
                        </h2>
                        <p className="max-w-md text-lg text-white/70">
                            Your AI-powered technical copilot for FIRST Robotics Competition.
                            Let's get you set up in under a minute.
                        </p>
                    </motion.div>
                );

            case "features":
                return (
                    <motion.div
                        key="features"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center"
                    >
                        <h2 className="mb-6 font-semibold text-2xl text-white">What you can do</h2>
                        <div className="grid w-full max-w-lg gap-4">
                            {FEATURES.map((feature, i) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                                >
                                    <div className="rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2">
                                        <feature.icon className="size-6 text-blue-400" weight="duotone" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">{feature.title}</h3>
                                        <p className="text-sm text-white/60">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );

            case "rate-limits":
                return (
                    <motion.div
                        key="rate-limits"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center text-center"
                    >
                        <h2 className="mb-3 font-semibold text-2xl text-white">
                            Why Rate Limits?
                        </h2>
                        <p className="mb-6 max-w-md text-white/70">
                            FRC RAG is <span className="font-semibold text-green-400">completely free</span>.
                            We use shared server credentials to power your chats, but that means everyone shares the same limit.
                        </p>

                        <div className="mb-6 grid w-full max-w-md grid-cols-2 gap-4">
                            <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-4">
                                <Fire className="mb-2 size-10 text-orange-400" weight="duotone" />
                                <span className="font-medium text-white">Shared Mode</span>
                                <span className="text-sm text-white/50">Rate limited</span>
                            </div>
                            <div className="flex flex-col items-center rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                                <Sparkle className="mb-2 size-10 text-blue-400" weight="duotone" />
                                <span className="font-medium text-white">Your API Key</span>
                                <span className="text-sm text-green-400">No limits!</span>
                            </div>
                        </div>

                        <p className="max-w-md text-sm text-white/60">
                            Add your own (free) API key from Groq or OpenRouter to remove all rate limits
                            and get priority access.
                        </p>
                    </motion.div>
                );

            case "api-keys":
                return (
                    <motion.div
                        key="api-keys"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex w-full max-w-lg flex-col"
                    >
                        <div className="mb-6 text-center">
                            <h2 className="mb-2 font-semibold text-2xl text-white">
                                Add Your API Keys <span className="text-white/50">(Optional)</span>
                            </h2>
                            <p className="text-sm text-white/60">
                                Getting a key takes 30 seconds and is completely free.
                            </p>
                        </div>

                        {/* Groq */}
                        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Key className="size-5 text-yellow-400" weight="duotone" />
                                    <span className="font-medium text-white">Groq</span>
                                </div>
                                {keysSaved.groq ? (
                                    <span className="text-sm text-green-400">✓ Saved</span>
                                ) : (
                                    <a
                                        href="https://console.groq.com/keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-400 hover:underline"
                                    >
                                        Get Key →
                                    </a>
                                )}
                            </div>
                            {!keysSaved.groq && (
                                <>
                                    <div className="flex gap-2">
                                        <Input
                                            type="password"
                                            placeholder="gsk_..."
                                            value={groqKey}
                                            onChange={(e) => {
                                                setGroqKey(e.target.value);
                                                setGroqError(undefined);
                                            }}
                                            className={cn(
                                                "bg-black/30 border-white/10",
                                                groqError && "border-red-500"
                                            )}
                                        />
                                        <Button
                                            onClick={() => handleSaveKey("groq", groqKey)}
                                            disabled={isSaving || !groqKey.trim()}
                                            size="sm"
                                        >
                                            Save
                                        </Button>
                                    </div>
                                    {groqError && (
                                        <p className="mt-2 text-sm text-red-400">{groqError}</p>
                                    )}
                                </>
                            )}
                        </div>

                        {/* OpenRouter */}
                        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Key className="size-5 text-purple-400" weight="duotone" />
                                    <span className="font-medium text-white">OpenRouter</span>
                                </div>
                                {keysSaved.openrouter ? (
                                    <span className="text-sm text-green-400">✓ Saved</span>
                                ) : (
                                    <a
                                        href="https://openrouter.ai/keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-400 hover:underline"
                                    >
                                        Get Key →
                                    </a>
                                )}
                            </div>
                            {!keysSaved.openrouter && (
                                <>
                                    <div className="flex gap-2">
                                        <Input
                                            type="password"
                                            placeholder="sk-or-v1-..."
                                            value={openRouterKey}
                                            onChange={(e) => {
                                                setOpenRouterKey(e.target.value);
                                                setOpenRouterError(undefined);
                                            }}
                                            className={cn(
                                                "bg-black/30 border-white/10",
                                                openRouterError && "border-red-500"
                                            )}
                                        />
                                        <Button
                                            onClick={() => handleSaveKey("openrouter", openRouterKey)}
                                            disabled={isSaving || !openRouterKey.trim()}
                                            size="sm"
                                        >
                                            Save
                                        </Button>
                                    </div>
                                    {openRouterError && (
                                        <p className="mt-2 text-sm text-red-400">{openRouterError}</p>
                                    )}
                                </>
                            )}
                        </div>

                        <p className="text-center text-xs text-white/40">
                            You can always add or change keys later in{" "}
                            <Link href="/settings/api-keys" className="text-blue-400 hover:underline">
                                Settings → API Keys
                            </Link>
                        </p>
                    </motion.div>
                );

            case "complete":
                return (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-5"
                        >
                            <Sparkle className="size-14 text-green-400" weight="duotone" />
                        </motion.div>
                        <h2 className="mb-3 font-bold text-2xl text-white">You're All Set!</h2>
                        <p className="mb-2 max-w-sm text-white/70">
                            Start chatting and explore FRC RAG's capabilities.
                        </p>
                        <p className="mb-6 text-sm text-white/50">
                            Remember: You can always manage API keys in Settings.
                        </p>
                    </motion.div>
                );
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative flex h-[600px] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-8 shadow-2xl"
            >
                {/* Skip button */}
                {!isLastStep && (
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Skip onboarding"
                    >
                        <X className="size-5" />
                    </button>
                )}

                {/* Progress dots */}
                <div className="mb-8 flex justify-center gap-2">
                    {STEPS.map((step, i) => (
                        <div
                            key={step}
                            className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                i === stepIndex
                                    ? "w-6 bg-blue-500"
                                    : i < stepIndex
                                        ? "w-2 bg-blue-500/50"
                                        : "w-2 bg-white/20"
                            )}
                        />
                    ))}
                </div>

                {/* Step content */}
                <div className="flex min-h-[320px] flex-1 items-center justify-center">
                    <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
                </div>

                {/* Navigation buttons */}
                <div className="mt-8 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={goBack}
                        disabled={isFirstStep}
                        className={cn(isFirstStep && "invisible")}
                    >
                        Back
                    </Button>

                    {isLastStep ? (
                        <Button onClick={handleComplete} className="gap-2">
                            Get Started
                            <ArrowRight className="size-4" />
                        </Button>
                    ) : currentStep === "api-keys" ? (
                        <Button onClick={goNext} variant="secondary">
                            {keysSaved.groq || keysSaved.openrouter ? "Continue" : "Skip for Now"}
                        </Button>
                    ) : (
                        <Button onClick={goNext} className="gap-2">
                            Next
                            <ArrowRight className="size-4" />
                        </Button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

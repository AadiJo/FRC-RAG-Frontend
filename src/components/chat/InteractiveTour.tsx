"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOUR_STEPS } from "./constants";

interface InteractiveTourProps {
    step: number;
    setStep: (v: number) => void;
    onClose: () => void;
}

/**
 * Interactive UI tour with spotlight highlighting
 */
export function InteractiveTour({ step, setStep, onClose }: InteractiveTourProps) {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const currentStep = TOUR_STEPS[step];

    useEffect(() => {
        if (!currentStep) return;

        const element = document.querySelector(currentStep.target);
        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [step, currentStep]);

    if (!currentStep || !targetRect) {
        return null;
    }

    const isLast = step >= TOUR_STEPS.length - 1;
    const isFirst = step <= 0;

    const getTooltipStyle = (): React.CSSProperties => {
        const padding = 12;

        switch (currentStep.position) {
            case 'bottom-start':
                return {
                    top: targetRect.bottom + padding,
                    left: targetRect.left,
                };
            case 'top':
                return {
                    bottom: window.innerHeight - targetRect.top + padding,
                    left: targetRect.left + targetRect.width / 2,
                    transform: 'translateX(-50%)',
                };
            default:
                return {
                    top: targetRect.bottom + padding,
                    left: targetRect.left + targetRect.width / 2,
                    transform: 'translateX(-50%)',
                };
        }
    };

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Overlay with spotlight cutout */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <mask id="spotlight-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <rect
                            x={targetRect.left - 4}
                            y={targetRect.top - 4}
                            width={targetRect.width + 8}
                            height={targetRect.height + 8}
                            rx="8"
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.75)"
                    mask="url(#spotlight-mask)"
                />
            </svg>

            {/* Highlight ring around target */}
            <div
                className="absolute border-2 border-blue-500 rounded-lg pointer-events-none animate-pulse"
                style={{
                    top: targetRect.top - 4,
                    left: targetRect.left - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8,
                    boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
                }}
            />

            {/* Tooltip */}
            <div
                className="absolute bg-[#1e1e1e] border border-[#424242] rounded-xl shadow-2xl p-4 w-[280px] animate-in fade-in zoom-in-95 duration-200"
                style={getTooltipStyle()}
            >
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-[#ececec]">{currentStep.title}</h3>
                    <button
                        onClick={onClose}
                        className="text-[#8e8ea0] hover:text-white transition-colors -mt-1 -mr-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs text-[#b4b4b4] mb-4">{currentStep.description}</p>

                {/* Step indicator */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {TOUR_STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-blue-500' : 'bg-[#424242]'}`}
                            />
                        ))}
                        <span className="text-xs text-[#8e8ea0] ml-2">{step + 1}/{TOUR_STEPS.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isFirst && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="text-xs text-[#8e8ea0] hover:text-white transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 h-7"
                            onClick={() => {
                                if (isLast) {
                                    onClose();
                                } else {
                                    setStep(step + 1);
                                }
                            }}
                        >
                            {isLast ? 'Finish' : 'Next'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Skip button */}
            <button
                onClick={onClose}
                className="absolute bottom-4 right-4 text-sm text-[#8e8ea0] hover:text-white transition-colors"
            >
                Skip Tour
            </button>
        </div>
    );
}

import { Bot, Settings, Key, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingModalProps {
    onClose: () => void;
    onOpenSettings: () => void;
    onStartTour: () => void;
}

/**
 * Onboarding modal shown on first login
 */
export function OnboardingModal({ onClose, onOpenSettings, onStartTour }: OnboardingModalProps) {
    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="bg-[#1e1e1e] border border-[#333] rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#333]">
                    <h2 className="text-lg font-semibold text-[#ececec] flex items-center gap-2">
                        <Bot className="w-5 h-5 text-blue-500" />
                        Welcome to FRC RAG!
                    </h2>
                    <button onClick={onClose} className="text-[#8e8ea0] hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <p className="text-sm text-[#dcdcdc]">
                        FRC RAG helps you find answers from FRC team technical binders. Before you start, here are some tips:
                    </p>

                    {/* Settings explanation */}
                    <div className="bg-[#252525] border border-[#333] rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-[#ececec] font-medium">
                            <Settings className="w-4 h-4 text-blue-500" />
                            Settings Menu
                        </div>
                        <p className="text-xs text-[#b4b4b4]">
                            Click the <strong className="text-[#ececec]">gear icon</strong> in the top-left to access settings. You can customize your experience and add API keys.
                        </p>
                    </div>

                    {/* API Keys explanation */}
                    <div className="bg-[#1a2e1a] border border-[#2d4a2d] rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-[#9bbf7d] font-medium">
                            <Key className="w-4 h-4" />
                            All API Keys are FREE & Optional
                        </div>
                        <p className="text-xs text-[#8cb88c]">
                            The app works without any API keys! If you want to use your own keys for unlimited access:
                        </p>
                        <ul className="text-xs text-[#8cb88c] space-y-1 pl-4 list-disc">
                            <li><strong>OpenRouter</strong> — Free tier available, unlock model selection</li>
                            <li><strong>YouTube API</strong> — Free quota from Google Cloud Console</li>
                            <li><strong>SerpAPI</strong> — Free tier for web search</li>
                        </ul>
                    </div>

                    {/* Help button reminder */}
                    <p className="text-xs text-[#8e8ea0] flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" />
                        Click the help icon anytime to see this again or take a tour.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-[#333] flex items-center justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-[#ececec] hover:bg-white/10 flex items-center gap-1.5 px-2"
                        onClick={() => { onOpenSettings(); onClose(); }}
                    >
                        <Settings className="w-4 h-4" />
                        Open Settings
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-blue-400 hover:bg-blue-500/10"
                            onClick={onStartTour}
                        >
                            Take a Tour
                        </Button>
                        <Button
                            type="button"
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-6"
                            onClick={onClose}
                        >
                            Get Started
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

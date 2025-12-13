"use client";

import { useState, useEffect } from "react";
import { Settings, X, Key, Eye, EyeOff, Check, Terminal, Cpu, ArrowDown, Globe, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ModelOption } from "@/types/chat";

interface SettingsModalProps {
    onClose: () => void;
    apiKey: string;
    setApiKey: (v: string) => void;
    showApiKey: boolean;
    setShowApiKey: (v: boolean) => void;
    model: string;
    setModel: (v: string) => void;
    systemPrompt: string;
    setSystemPrompt: (v: string) => void;
    youtubeApiKey: string;
    setYoutubeApiKey: (v: string) => void;
    serpApiKey: string;
    setSerpApiKey: (v: string) => void;
    showYoutubeKey: boolean;
    setShowYoutubeKey: (v: boolean) => void;
    showSerpKey: boolean;
    setShowSerpKey: (v: boolean) => void;
    apiUrl: string;
}

interface ApiKeyQuota {
    remaining?: number;
    limit?: number;
    unlimited?: boolean;
}

/**
 * Settings modal for API keys, model selection, and custom instructions
 */
export function SettingsModal({
    onClose,
    apiKey,
    setApiKey,
    showApiKey,
    setShowApiKey,
    model,
    setModel,
    systemPrompt,
    setSystemPrompt,
    youtubeApiKey,
    setYoutubeApiKey,
    serpApiKey,
    setSerpApiKey,
    showYoutubeKey,
    setShowYoutubeKey,
    showSerpKey,
    setShowSerpKey,
    apiUrl
}: SettingsModalProps) {
    const [apiKeyValid, setApiKeyValid] = useState(false);
    const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [validatedApiKey, setValidatedApiKey] = useState<string>('');
    const [models, setModels] = useState<ModelOption[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [apiKeyQuota, setApiKeyQuota] = useState<ApiKeyQuota | null>(null);
    const [serverDefaultModel, setServerDefaultModel] = useState<string>('');

    const effectiveDefaultModelId = (() => {
        const freeModel = models.find(m => m.free);
        if (freeModel) return freeModel.id;
        return serverDefaultModel || '';
    })();

    const DEFAULT_MODEL_NAME = (() => {
        const m = models.find(x => x.id === effectiveDefaultModelId);
        if (m) return `${m.name} (Server Default)`;
        return serverDefaultModel ? `${serverDefaultModel} (Server Default)` : 'Server Default Model';
    })();

    const validateKey = async () => {
        if (!apiKey.trim()) return;
        setApiKeyStatus('loading');
        try {
            const res = await fetch(`${apiUrl}/api/openrouter/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ api_key: apiKey })
            });
            const data = await res.json();
            if (data.valid) {
                setApiKeyValid(true);
                setApiKeyStatus('success');
                setValidatedApiKey(apiKey);

                const modelsRes = await fetch(`${apiUrl}/api/openrouter/models`, {
                    headers: { 'ngrok-skip-browser-warning': 'true', 'X-OpenRouter-Key': apiKey }
                });
                const modelsData = await modelsRes.json();
                if (modelsData.models) {
                    const sorted = [...modelsData.models].sort((a: ModelOption, b: ModelOption) => {
                        if (a.free && !b.free) return -1;
                        if (!a.free && b.free) return 1;
                        return 0;
                    });
                    setModels(sorted);
                }

                try {
                    const quotaRes = await fetch(`${apiUrl}/api/quota?custom_api_key=${encodeURIComponent(apiKey)}`, {
                        headers: { 'ngrok-skip-browser-warning': 'true' }
                    });
                    if (quotaRes.ok) {
                        const q = await quotaRes.json();
                        setApiKeyQuota(q);
                    }
                } catch {
                    // Quota fetch failed, continue without it
                }
            } else {
                setApiKeyValid(false);
                setApiKeyStatus('error');
                setValidatedApiKey('');
            }
        } catch {
            setApiKeyValid(false);
            setApiKeyStatus('error');
            setValidatedApiKey('');
        }
    };

    useEffect(() => {
        if (apiKey && !validatedApiKey && apiKeyStatus !== 'loading') {
            validateKey();
        }
    }, []);

    useEffect(() => {
        return () => {
            if (apiKey && apiKey !== validatedApiKey && apiKeyStatus !== 'loading') {
                validateKey();
            }
        };
    }, [apiKey, validatedApiKey, apiKeyStatus]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${apiUrl}/api/openrouter/models`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                if (data.models) setModels(data.models);
                if (data.default_model) setServerDefaultModel(data.default_model || '');
            } catch {
                // Failed to load models, continue with empty list
            }
        })();
        return () => { cancelled = true; };
    }, [apiUrl]);

    const selectedModelName = !apiKeyValid ? 'OpenAI: gpt-oss-20b (free)' : (models.find(m => m.id === model)?.name || (model ? model : DEFAULT_MODEL_NAME));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150" onClick={onClose}>
            <div className="bg-[#1e1e1e] border border-[#333] rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-200" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#333]">
                    <h2 className="text-lg font-semibold text-[#ececec] flex items-center gap-2">
                        <Settings className="w-5 h-5 text-[#8e8ea0]" /> Settings
                    </h2>
                    <button onClick={onClose} className="text-[#8e8ea0] hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-6">
                    {/* System Prompt */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#ececec] flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-blue-500" /> Custom Instructions
                        </label>
                        <p className="text-xs text-[#8e8ea0]">Add custom behavior instructions for this session. Cleared on reload.</p>
                        <Textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Enter custom instructions (e.g. 'Be concise', 'Act like a pirate')..."
                            className="bg-[#0d0d0d] border-[#424242] text-[#ececec] placeholder:text-[#6b6b6b] min-h-[80px] resize-none focus:border-blue-500 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#ececec] flex items-center gap-2">
                            <Key className="w-4 h-4 text-blue-500" /> OpenRouter API Key
                        </label>
                        <p className="text-xs text-[#8e8ea0]">Enter your OpenRouter API key to unlock model selection and use your own quota.</p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type={showApiKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={(e) => { setApiKey(e.target.value); setApiKeyStatus('idle'); setApiKeyValid(false); }}
                                    placeholder="Enter your OpenRouter API key..."
                                    className="bg-[#0d0d0d] border-[#424242] text-[#ececec] placeholder:text-[#6b6b6b] pr-10 focus:border-blue-500 focus:ring-blue-500/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8e8ea0] hover:text-white"
                                >
                                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <button
                                onClick={validateKey}
                                disabled={!apiKey.trim() || apiKeyStatus === 'loading'}
                                className="w-11 h-9 bg-[#1e3a8a] border border-[#3b82f6] rounded-lg text-[#60a5fa] hover:bg-[#1e40af] hover:text-[#93c5fd] disabled:bg-[#2f2f2f] disabled:border-[#424242] disabled:text-[#6b6b6b] disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                            >
                                {apiKeyStatus === 'loading' ? (
                                    <div className="w-4 h-4 border-2 border-[#60a5fa] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        {apiKeyStatus === 'success' && (
                            <p className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3 h-3" /> API key validated</p>
                        )}
                        {apiKeyStatus === 'success' && apiKeyQuota && (
                            <p className="text-xs text-[#8e8ea0] mt-1">
                                {apiKeyQuota.unlimited ? (
                                    <>Provider-managed quota (check OpenRouter dashboard)</>
                                ) : (
                                    <>Quota: {apiKeyQuota.remaining}/{apiKeyQuota.limit}</>
                                )}
                            </p>
                        )}
                        {apiKeyStatus === 'error' && (
                            <p className="text-xs text-red-500">Invalid API key</p>
                        )}
                    </div>

                    {/* YouTube API Key */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#ececec] flex items-center gap-2">
                            <Youtube className="w-4 h-4 text-blue-500" /> YouTube API Key
                        </label>
                        <p className="text-xs text-[#8e8ea0]">Enter your own YouTube Data API key to bypass daily search limits.</p>
                        <div className="relative">
                            <Input
                                type={showYoutubeKey ? "text" : "password"}
                                value={youtubeApiKey}
                                onChange={(e) => setYoutubeApiKey(e.target.value)}
                                placeholder="Enter your YouTube API key..."
                                className="bg-[#0d0d0d] border-[#424242] text-[#ececec] placeholder:text-[#6b6b6b] pr-10 focus:border-blue-500 focus:ring-blue-500/20"
                            />
                            <button
                                type="button"
                                onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8e8ea0] hover:text-white"
                            >
                                {showYoutubeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* SerpAPI Key */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#ececec] flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500" /> SerpAPI Key
                        </label>
                        <p className="text-xs text-[#8e8ea0]">Enter your own SerpAPI key to bypass daily search limits.</p>
                        <div className="relative">
                            <Input
                                type={showSerpKey ? "text" : "password"}
                                value={serpApiKey}
                                onChange={(e) => setSerpApiKey(e.target.value)}
                                placeholder="Enter your SerpAPI key..."
                                className="bg-[#0d0d0d] border-[#424242] text-[#ececec] placeholder:text-[#6b6b6b] pr-10 focus:border-blue-500 focus:ring-blue-500/20"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSerpKey(!showSerpKey)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8e8ea0] hover:text-white"
                            >
                                {showSerpKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Model Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#ececec] flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-blue-500" /> Model
                        </label>
                        <p className="text-xs text-[#8e8ea0]">Select a model to use. Requires a valid API key to change from default.</p>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => apiKeyValid && setDropdownOpen(!dropdownOpen)}
                                disabled={!apiKeyValid}
                                className={`w-full bg-[#0d0d0d] border border-[#424242] rounded-lg px-3 py-2.5 text-left flex items-center justify-between transition-colors ${apiKeyValid ? 'text-[#ececec] hover:border-[#555] cursor-pointer' : 'text-[#6b6b6b] cursor-not-allowed'
                                    } ${dropdownOpen ? 'border-blue-500' : ''}`}
                            >
                                <span className="truncate">{selectedModelName}</span>
                                <ArrowDown className={`w-4 h-4 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {dropdownOpen && apiKeyValid && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#424242] rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
                                    {models.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => { setModel(m.id); setDropdownOpen(false); }}
                                            className={`w-full px-3 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center justify-between transition-colors ${model === m.id ? 'bg-[#2a2a2a] text-blue-400' : 'text-[#ececec]'
                                                }`}
                                        >
                                            <span className="truncate">{m.name}</span>
                                            {!m.free && <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">PAID</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-[#8e8ea0] flex items-center gap-1">
                            {apiKeyValid ? (
                                <><Check className="w-3 h-3 text-green-500" /> Model selection enabled (uses your key)</>
                            ) : (
                                <><span>🔒</span> Selecting a model will use the server API key unless you enter your own</>
                            )}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-[#333] flex justify-end">
                    <Button
                        onClick={onClose}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-6"
                    >
                        💾 Save Settings
                    </Button>
                </div>
            </div>
        </div>
    );
}

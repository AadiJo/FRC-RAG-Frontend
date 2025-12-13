"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect, useCallback, ChangeEvent } from "react";
import { ArrowUp, ArrowDown, Square, Settings, X, Check, SlidersHorizontal, Link2, Brain, Plus, Loader2, Youtube, HelpCircle } from "lucide-react";
import type { Message, SearchQuota, MessageMetadata } from "@/types/chat";
import { WelcomeMessage } from "./WelcomeMessage";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessage } from "./StreamingMessage";
import { SettingsModal } from "./SettingsModal";
import { OnboardingModal } from "./OnboardingModal";
import { InteractiveTour } from "./InteractiveTour";
import {
    SCROLL_THRESHOLD,
    DEFAULT_TEXTAREA_HEIGHT,
    MAX_TEXTAREA_HEIGHT,
    UPLOAD_SUCCESS_DISPLAY_MS,
    STORAGE_KEYS,
} from "./constants";

/**
 * Attempt to repair common mojibake (UTF-8 bytes mis-decoded as Latin-1)
 */
function fixEncoding(s: string): string {
    try {
        if (/[ÂÃâÄ]/.test(s)) {
            return decodeURIComponent(escape(s));
        }
        return s;
    } catch {
        return s;
    }
}

interface ChatInterfaceProps {
    isGuest: boolean;
}

/**
 * Main chat interface component
 */
export function ChatInterface({ isGuest }: ChatInterfaceProps) {
    const { user } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [streamingMetadata, setStreamingMetadata] = useState<MessageMetadata | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Settings state
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [model, setModel] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [youtubeApiKey, setYoutubeApiKey] = useState("");
    const [serpApiKey, setSerpApiKey] = useState("");
    const [showYoutubeKey, setShowYoutubeKey] = useState(false);
    const [showSerpKey, setShowSerpKey] = useState(false);

    // First-login tutorial
    const [tutorialOpen, setTutorialOpen] = useState(false);
    const [tourActive, setTourActive] = useState(false);
    const [tourStep, setTourStep] = useState(0);

    // Tools state
    const [toolsOpen, setToolsOpen] = useState(false);
    const [showReasoning, setShowReasoning] = useState(false);
    const [webSearch, setWebSearch] = useState(false);
    const [youtubeSearch, setYoutubeSearch] = useState(false);
    const [searchQuota, setSearchQuota] = useState<SearchQuota | null>(null);

    // File upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const uploadSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    // Load settings from localStorage
    useEffect(() => {
        const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
        const savedYoutubeKey = localStorage.getItem(STORAGE_KEYS.YOUTUBE_KEY);
        const savedSerpKey = localStorage.getItem(STORAGE_KEYS.SERP_KEY);
        if (savedApiKey) setApiKey(savedApiKey);
        if (savedYoutubeKey) setYoutubeApiKey(savedYoutubeKey);
        if (savedSerpKey) setSerpApiKey(savedSerpKey);
    }, []);

    // Show tutorial once per signed-in user
    useEffect(() => {
        if (isGuest || !user?.id) return;
        const seenKey = `${STORAGE_KEYS.TUTORIAL_SEEN_PREFIX}${user.id}`;
        const seen = localStorage.getItem(seenKey) === '1';
        if (!seen) {
            setTutorialOpen(true);
        }
    }, [isGuest, user?.id]);

    const completeTutorial = useCallback(() => {
        if (!isGuest && user?.id) {
            localStorage.setItem(`${STORAGE_KEYS.TUTORIAL_SEEN_PREFIX}${user.id}`, '1');
        }
        setTutorialOpen(false);
    }, [isGuest, user?.id]);

    // Save settings to localStorage
    useEffect(() => {
        if (apiKey) localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
        else localStorage.removeItem(STORAGE_KEYS.API_KEY);

        if (youtubeApiKey) localStorage.setItem(STORAGE_KEYS.YOUTUBE_KEY, youtubeApiKey);
        else localStorage.removeItem(STORAGE_KEYS.YOUTUBE_KEY);

        if (serpApiKey) localStorage.setItem(STORAGE_KEYS.SERP_KEY, serpApiKey);
        else localStorage.removeItem(STORAGE_KEYS.SERP_KEY);
    }, [apiKey, youtubeApiKey, serpApiKey]);

    // Cleanup upload success timer
    useEffect(() => {
        return () => {
            if (uploadSuccessTimer.current) {
                clearTimeout(uploadSuccessTimer.current);
            }
        };
    }, []);

    const handleLogout = () => {
        if (isGuest) {
            document.cookie = "guest-mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            window.location.reload();
        }
    };

    const scrollToBottom = useCallback(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, []);

    const handleScroll = useCallback(() => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
            setShowScrollButton(!isNearBottom);
        }
    }, []);

    const handleStop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            setUploadStatus('Only PDF files are allowed');
            event.target.value = '';
            return;
        }

        const userId = user?.id || (isGuest ? 'guest' : '');
        if (!userId) {
            setUploadStatus('Sign in to upload files');
            event.target.value = '';
            return;
        }

        if (!apiUrl) {
            setUploadStatus('Backend URL is not configured');
            event.target.value = '';
            return;
        }

        setIsUploadingFile(true);
        setUploadStatus(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${apiUrl}/api/upload/pdf`, {
                method: 'POST',
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'X-User-Id': userId
                },
                body: formData
            });

            const result = await response.json();
            if (!response.ok || !result?.success) {
                throw new Error(result?.error || 'Upload failed');
            }

            setUploadStatus(null);
            setUploadSuccess(true);
            if (uploadSuccessTimer.current) clearTimeout(uploadSuccessTimer.current);
            uploadSuccessTimer.current = setTimeout(() => setUploadSuccess(false), UPLOAD_SUCCESS_DISPLAY_MS);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Upload failed';
            setUploadStatus(message);
            setUploadSuccess(false);
        } finally {
            setIsUploadingFile(false);
            event.target.value = '';
        }
    }, [apiUrl, user?.id, isGuest]);

    const sendMessage = useCallback(async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText
        };

        setMessages(prev => [...prev, userMessage]);
        // Ensure the chat scrolls to show the just-sent user message
        setTimeout(() => scrollToBottom(), 50);
        setInput("");
        setIsLoading(true);
        setStreamingContent("");
        setStreamingMetadata(null);

        const conversationHistory = messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        const requestBody: Record<string, unknown> = {
            query: messageText,
            conversation_history: conversationHistory,
            show_reasoning: showReasoning,
            enable_web_search: webSearch,
            enable_youtube_search: youtubeSearch
        };

        if (apiKey) requestBody.custom_api_key = apiKey;
        if (model) requestBody.custom_model = model;
        if (youtubeApiKey) requestBody.custom_youtube_key = youtubeApiKey;
        if (serpApiKey) requestBody.custom_serpapi_key = serpApiKey;

        let effectiveSystemPrompt = systemPrompt;
        if (user?.firstName) {
            effectiveSystemPrompt += `\n\nThis user's name is ${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}.`;
        }
        if (effectiveSystemPrompt) requestBody.system_prompt = effectiveSystemPrompt;

        abortControllerRef.current = new AbortController();

        let currentContent = '';
        let metadata: MessageMetadata | null = null;

        try {
            const response = await fetch(`${apiUrl}/api/query/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(requestBody),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));

                            if (data.type === 'metadata') {
                                metadata = data.data;
                                setStreamingMetadata(data.data);
                                if (data.data.search_quota) {
                                    setSearchQuota(data.data.search_quota);
                                }
                            } else if (data.type === 'content') {
                                currentContent += data.data;
                                setStreamingContent(fixEncoding(currentContent));
                            } else if (data.type === 'error') {
                                throw new Error(data.error);
                            }
                        } catch (e) {
                            if (!(e instanceof SyntaxError)) {
                                throw e;
                            }
                        }
                    }
                }
            }

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: fixEncoding(currentContent),
                images: metadata?.images,
                metadata: metadata ?? undefined
            };

            setMessages(prev => [...prev, assistantMessage]);
            setStreamingContent("");
            setStreamingMetadata(null);

        } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                if (currentContent) {
                    const assistantMessage: Message = {
                        id: `assistant-${Date.now()}`,
                        role: 'assistant',
                        content: fixEncoding(currentContent),
                        images: metadata?.images,
                        metadata: metadata ?? undefined
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                }
            } else {
                const errorMessage: Message = {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`
                };
                setMessages(prev => [...prev, errorMessage]);
            }
            setStreamingContent("");
            setStreamingMetadata(null);
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [messages, isLoading, apiKey, model, systemPrompt, showReasoning, webSearch, youtubeSearch, youtubeApiKey, serpApiKey, apiUrl, user]);
    

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
        if (textareaRef.current) {
            textareaRef.current.style.height = `${DEFAULT_TEXTAREA_HEIGHT}px`;
        }
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        const textarea = e.target;
        textarea.style.height = `${DEFAULT_TEXTAREA_HEIGHT}px`;
        textarea.style.height = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT) + "px";
    };

    // Close tools menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('#toolsMenu') && !target.closest('#toolsToggle')) {
                setToolsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Update scroll button visibility when messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
            setShowScrollButton(!isNearBottom);
        }
    }, [messages.length]);

    // Fetch quota from backend
    const fetchQuota = useCallback(async (userId?: string) => {
        try {
            const headers: Record<string, string> = { 'ngrok-skip-browser-warning': 'true' };
            if (userId) headers['X-User-Id'] = userId;

            let url = `${apiUrl}/api/quota`;
            const params: string[] = [];
            if (youtubeApiKey) params.push(`custom_youtube_key=${encodeURIComponent(youtubeApiKey)}`);
            if (serpApiKey) params.push(`custom_serpapi_key=${encodeURIComponent(serpApiKey)}`);
            if (apiKey) params.push(`custom_api_key=${encodeURIComponent(apiKey)}`);
            if (params.length) url += `?${params.join('&')}`;

            const res = await fetch(url, { headers });
            const contentType = res.headers.get('content-type');

            if (!res.ok) {
                throw new Error(`HTTP error: ${res.status}`);
            }

            if (contentType?.includes('application/json')) {
                const data = await res.json();
                if (!apiKey) {
                    if (!data.unlimited) {
                        setSearchQuota({ remaining: data.remaining, limit: data.limit });
                    } else {
                        setSearchQuota(null);
                    }
                } else {
                    setSearchQuota(null);
                }
            } else {
                setSearchQuota(null);
            }
        } catch {
            setSearchQuota(null);
        }
    }, [apiUrl, youtubeApiKey, serpApiKey, apiKey]);

    useEffect(() => {
        fetchQuota();
    }, [fetchQuota]);

    useEffect(() => {
        if (user?.id) fetchQuota(user.id);
    }, [user?.id, fetchQuota]);

    return (
        <div className="flex min-h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#141414]">
            {/* Header */}
            <header className="bg-[#141414] border-b border-[#2f2f2f] px-5 py-6 flex items-center justify-center relative">
                <div className="absolute left-5 flex items-center gap-1">
                    <button
                        id="settingsToggle"
                        onClick={() => setSettingsOpen(true)}
                        className="w-9 h-9 rounded-lg text-[#8e8ea0] hover:text-white hover:bg-[#3f3f3f] flex items-center justify-center transition-colors"
                        title="Settings"
                        aria-label="Open settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        id="helpToggle"
                        onClick={() => { setTutorialOpen(true); }}
                        className="w-9 h-9 rounded-lg text-[#8e8ea0] hover:text-white hover:bg-[#3f3f3f] flex items-center justify-center transition-colors"
                        title="Help & Tutorial"
                        aria-label="Open help and tutorial"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                </div>

                <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent">
                    FRC RAG
                </h1>

                <div className="absolute right-5 flex items-center gap-3">
                    {apiKey && (
                        <div className="mr-2">
                            <div title="Using your OpenRouter API key" className="text-xs text-[#9bbf7d] bg-[#0f2a10] border border-[#123517] px-2 py-1 rounded-full">
                                API Key
                            </div>
                        </div>
                    )}
                    {isGuest ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-[#8e8ea0] hover:text-white hover:bg-[#3f3f3f]"
                        >
                            Exit Guest
                        </Button>
                    ) : (
                        <UserButton />
                    )}
                </div>
            </header>

            {/* Chat Messages */}
            <main
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto bg-[#141414]"
            >
                {messages.length === 0 && !isLoading && <WelcomeMessage />}

                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} userImageUrl={user?.imageUrl} apiUrl={apiUrl} />
                ))}

                {isLoading && (
                    <StreamingMessage
                        content={streamingContent}
                        metadata={streamingMetadata}
                    />
                )}
            </main>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-[100px] left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#212121] border border-[#424242] text-white flex items-center justify-center shadow-lg hover:bg-[#3f3f3f] hover:scale-110 active:scale-95 transition-all z-50"
                    aria-label="Scroll to bottom"
                >
                    <ArrowDown className="w-4 h-4" />
                </button>
            )}

            {/* Input Area */}
            <footer className="bg-[#141414] p-4 border-t border-[#2f2f2f]">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                    <div className="bg-[#212121] border-2 border-[#424242] rounded-[26px] p-3 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-500/20 transition-colors">
                        <textarea
                            id="chatInput"
                            ref={textareaRef}
                            value={input}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything..."
                            className="w-full bg-transparent border-none outline-none text-[#ececec] text-base leading-relaxed resize-none max-h-[200px] overflow-y-hidden placeholder:text-[#8e8ea0] min-h-[40px] pl-2"
                            rows={1}
                            style={{ height: `${DEFAULT_TEXTAREA_HEIGHT}px` }}
                            aria-label="Chat message input"
                        />
                        <div className="flex justify-between items-center mt-2">
                            {/* Tools section */}
                            <div className="flex items-center gap-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    aria-label="Upload PDF file"
                                />
                                <button
                                    type="button"
                                    onClick={openFilePicker}
                                    disabled={isUploadingFile}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${uploadSuccess
                                        ? 'text-green-400'
                                        : 'text-[#8e8ea0] hover:text-white hover:bg-[#3f3f3f]'
                                        } disabled:text-[#6b6b6b] disabled:bg-[#1c1c1c]`}
                                    title="Upload PDF"
                                    aria-label="Upload PDF"
                                >
                                    {isUploadingFile ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : uploadSuccess ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                </button>

                                <div className="relative">
                                    <button
                                        id="toolsToggle"
                                        type="button"
                                        onClick={() => setToolsOpen(!toolsOpen)}
                                        className="w-8 h-8 rounded-full text-[#8e8ea0] hover:text-white hover:bg-[#3f3f3f] flex items-center justify-center transition-colors"
                                        title="Tools"
                                        aria-label="Toggle tools menu"
                                        aria-expanded={toolsOpen}
                                    >
                                        <SlidersHorizontal className="w-4 h-4" />
                                    </button>

                                    {/* Tools Menu */}
                                    {toolsOpen && (
                                        <div
                                            id="toolsMenu"
                                            className="absolute bottom-full left-0 mb-2 bg-[#1e1e1e] border border-[#424242] rounded-xl p-2 shadow-xl z-50 min-w-[200px]"
                                            role="menu"
                                        >
                                            <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2f2f2f] cursor-pointer transition-colors group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={showReasoning}
                                                        onChange={(e) => setShowReasoning(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-[#424242] rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                                </div>
                                                <span className="text-sm text-[#e1e1e1] group-hover:text-white">Show reasoning</span>
                                            </label>
                                            <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2f2f2f] cursor-pointer transition-colors group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={webSearch}
                                                        onChange={(e) => setWebSearch(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-[#424242] rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                                </div>
                                                <span className="text-sm text-[#e1e1e1] group-hover:text-white">Web search</span>
                                            </label>
                                            <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2f2f2f] cursor-pointer transition-colors group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={youtubeSearch}
                                                        onChange={(e) => setYoutubeSearch(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-[#424242] rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                                </div>
                                                <span className="text-sm text-[#e1e1e1] group-hover:text-white">YouTube search</span>
                                            </label>

                                            {/* Search Quota Indicator */}
                                            {!youtubeApiKey && !serpApiKey && searchQuota && (
                                                <div className="px-3 py-2 mt-1 border-t border-[#333]">
                                                    <div className="flex items-center justify-between text-xs text-[#8e8ea0] mb-1">
                                                        <span>Daily Search Quota</span>
                                                        <span className={searchQuota.remaining === 0 ? "text-red-400" : "text-blue-400"}>
                                                            {searchQuota.remaining}/{searchQuota.limit}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1 bg-[#333] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${searchQuota.remaining === 0 ? "bg-red-500" : "bg-blue-500"}`}
                                                            style={{ width: `${(searchQuota.remaining / searchQuota.limit) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Active tools chips */}
                                {showReasoning && (
                                    <button
                                        type="button"
                                        onClick={() => setShowReasoning(false)}
                                        className="group px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 flex items-center gap-1 hover:bg-blue-500/30 hover:text-blue-300 transition-colors"
                                        aria-label="Disable reasoning mode"
                                    >
                                        <Brain className="w-3 h-3 group-hover:hidden" />
                                        <X className="w-3 h-3 hidden group-hover:block" />
                                        Reasoning
                                    </button>
                                )}
                                {webSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setWebSearch(false)}
                                        className="group px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 flex items-center gap-1 hover:bg-blue-500/30 hover:text-blue-300 transition-colors"
                                        aria-label="Disable web search"
                                    >
                                        <Link2 className="w-3 h-3 group-hover:hidden" />
                                        <X className="w-3 h-3 hidden group-hover:block" />
                                        Web search
                                    </button>
                                )}
                                {youtubeSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setYoutubeSearch(false)}
                                        className="group px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 flex items-center gap-1 hover:bg-blue-500/30 hover:text-blue-300 transition-colors"
                                        aria-label="Disable YouTube search"
                                    >
                                        <Youtube className="w-3 h-3 group-hover:hidden" />
                                        <X className="w-3 h-3 hidden group-hover:block" />
                                        YouTube
                                    </button>
                                )}

                                {uploadStatus && (
                                    <span className="ml-2 text-xs text-red-400" title={uploadStatus}>
                                        {uploadStatus}
                                    </span>
                                )}
                            </div>

                            <button
                                type={isLoading ? "button" : "submit"}
                                onClick={isLoading ? handleStop : undefined}
                                disabled={!isLoading && !input.trim()}
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-blue-500 hover:bg-blue-600 text-white disabled:bg-[#424242] disabled:cursor-not-allowed"
                                aria-label={isLoading ? "Stop generation" : "Send message"}
                            >
                                {isLoading ? <Square className="w-3 h-3 fill-current" /> : <ArrowUp className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </form>
            </footer>

            {/* Settings Modal */}
            {settingsOpen && (
                <SettingsModal
                    onClose={() => setSettingsOpen(false)}
                    apiKey={apiKey}
                    setApiKey={setApiKey}
                    showApiKey={showApiKey}
                    setShowApiKey={setShowApiKey}
                    model={model}
                    setModel={setModel}
                    systemPrompt={systemPrompt}
                    setSystemPrompt={setSystemPrompt}
                    youtubeApiKey={youtubeApiKey}
                    setYoutubeApiKey={setYoutubeApiKey}
                    serpApiKey={serpApiKey}
                    setSerpApiKey={setSerpApiKey}
                    showYoutubeKey={showYoutubeKey}
                    setShowYoutubeKey={setShowYoutubeKey}
                    showSerpKey={showSerpKey}
                    setShowSerpKey={setShowSerpKey}
                    apiUrl={apiUrl}
                />
            )}

            {/* First-login Tutorial / Onboarding */}
            {tutorialOpen && !isGuest && (
                <OnboardingModal
                    onClose={completeTutorial}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onStartTour={() => { completeTutorial(); setTourStep(0); setTourActive(true); }}
                />
            )}

            {/* Interactive UI Tour */}
            {tourActive && (
                <InteractiveTour
                    step={tourStep}
                    setStep={setTourStep}
                    onClose={() => setTourActive(false)}
                />
            )}
        </div>
    );
}

"use client";

import { Bot, User, Link2, Globe, ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { markdownComponents } from "./MarkdownComponents";
import { SourceCard } from "./SourceCard";
import { ImageCard } from "./ImageCard";
import type { Message, ExternalSource, TeamInfo } from "@/types/chat";

interface MessageBubbleProps {
    message: Message;
    userImageUrl?: string;
    apiUrl: string;
}

/**
 * Renders a single chat message (user or assistant)
 */
export function MessageBubble({ message, userImageUrl, apiUrl }: MessageBubbleProps) {
    const isUser = message.role === "user";

    const getTeamInfo = (webPath: string): TeamInfo => {
        const match = webPath?.match(/^(\d+)-(\d{4})/);
        if (match) {
            return { team: match[1], year: match[2] };
        }
        return { team: 'Unknown', year: '' };
    };

    return (
        <div
            data-message-role={message.role}
            className={`px-5 py-4 border-b border-[rgba(255,255,255,0.05)] animate-fadeInUp ${isUser ? "bg-[#1a1a1a]" : "bg-[#141414]"}`}
        >
            <div className="max-w-3xl mx-auto flex gap-4 items-start">
                {isUser && userImageUrl ? (
                    <img
                        src={userImageUrl}
                        alt="User"
                        className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                    />
                ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser
                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                        : "bg-gradient-to-br from-blue-500 to-red-500"
                        }`}>
                        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                )}

                <div className="flex-1 min-w-0 pt-[0.15rem]">
                    {/* Game piece context chips */}
                    {!isUser && message.metadata?.matched_pieces && message.metadata.matched_pieces.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {message.metadata.matched_pieces.map((piece, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                                    <Link2 className="w-3 h-3" />
                                    {piece}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="prose prose-invert max-w-none text-[#ececec] leading-relaxed [&>*:first-child]:mt-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                            {message.content}
                        </ReactMarkdown>
                    </div>

                    {message.images && message.images.length > 0 && (
                        <div className="mt-4 bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
                            <div className="flex items-center gap-2 mb-3 font-semibold text-[#ececec]">
                                <ImageIcon className="w-4 h-4 text-[#8e8ea0]" />
                                <span>Related Images ({message.images.length})</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {message.images.map((img, idx) => {
                                    const teamInfo = getTeamInfo(img.web_path);
                                    return (
                                        <div key={idx} className="relative">
                                            <ImageCard img={img} teamInfo={teamInfo} apiUrl={apiUrl} />
                                            {typeof img.relevance === 'number' && (
                                                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow">
                                                    Relevance: {(img.relevance * 100).toFixed(1)}%
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* External Sources Section */}
                    {((message.metadata?.external_sources?.length ?? 0) > 0 || (message.metadata?.external_sources_section && message.metadata.external_sources_section.trim())) && (
                        <div className="mt-4">
                            <div className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                External Sources
                            </div>

                            {message.metadata?.external_sources && message.metadata.external_sources.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {message.metadata.external_sources.map((source: ExternalSource, idx: number) => (
                                        <SourceCard key={idx} source={source} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-blue-500/30">
                                    <pre className="whitespace-pre-wrap text-[#ececec] text-sm font-sans">{message.metadata?.external_sources_section}</pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

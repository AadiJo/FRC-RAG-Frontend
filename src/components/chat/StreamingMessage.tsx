import { Bot, Link2, Globe } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { markdownComponents } from "./MarkdownComponents";
import { SourceCard } from "./SourceCard";
import type { MessageMetadata, ExternalSource } from "@/types/chat";

interface StreamingMessageProps {
    content: string;
    metadata: MessageMetadata | null;
}

/**
 * Message bubble for streaming content with typing indicator
 */
export function StreamingMessage({ content, metadata }: StreamingMessageProps) {
    if (!content) {
        return (
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.05)] animate-fadeInUp bg-[#141414]">
                <div className="max-w-3xl mx-auto flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 pt-[0.15rem]">
                        <div className="flex items-center gap-1 h-[1.625rem]">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.05)] animate-fadeInUp bg-[#141414]">
            <div className="max-w-3xl mx-auto flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                </div>

                <div className="flex-1 min-w-0 pt-[0.15rem]">
                    {/* Game piece context chips */}
                    {metadata?.matched_pieces && metadata.matched_pieces.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {metadata.matched_pieces.map((piece: string, idx: number) => (
                                <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                                    <Link2 className="w-3 h-3" />
                                    {piece}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="prose prose-invert max-w-none text-[#ececec] leading-relaxed [&>*:first-child]:mt-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                            {content}
                        </ReactMarkdown>
                        <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-0.5 align-middle"></span>
                    </div>

                    {/* External Sources Section (Streaming) */}
                    {((metadata?.external_sources?.length ?? 0) > 0 || (metadata?.external_sources_section && metadata.external_sources_section.trim())) && (
                        <div className="mt-4 animate-fadeInUp">
                            <div className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                External Sources
                            </div>

                            {metadata?.external_sources && metadata.external_sources.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {metadata.external_sources.map((source: ExternalSource, idx: number) => (
                                        <SourceCard key={idx} source={source} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-blue-500/30">
                                    <pre className="whitespace-pre-wrap text-[#ececec] text-sm font-sans">{metadata?.external_sources_section}</pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

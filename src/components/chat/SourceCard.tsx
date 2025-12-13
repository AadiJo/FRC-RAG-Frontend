import { Globe, Youtube } from "lucide-react";
import type { ExternalSource } from "@/types/chat";

interface SourceCardProps {
    source: ExternalSource;
}

/**
 * Card component for displaying external source links (web/YouTube)
 */
export function SourceCard({ source }: SourceCardProps) {
    const getDomain = (url: string) => {
        if (!url) return 'External Source';
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'External Source';
        }
    };

    if (!source) return null;

    return (
        <a
            href={source.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-[#1e1e1e] border border-[#333] rounded-lg hover:bg-[#2a2a2a] hover:border-[#444] transition-all group"
            onClick={(e) => !source.link && e.preventDefault()}
        >
            <div className="w-8 h-8 rounded-full bg-[#2f2f2f] flex items-center justify-center flex-shrink-0 group-hover:bg-[#3f3f3f] transition-colors">
                {source.type === 'youtube' ? (
                    <Youtube className="w-4 h-4 text-blue-400" />
                ) : (
                    <Globe className="w-4 h-4 text-blue-400" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#ececec] truncate group-hover:text-blue-400 transition-colors" title={source.title || 'Untitled Source'}>
                    {source.title || 'Untitled Source'}
                </div>
                <div className="text-xs text-[#8e8ea0] truncate">
                    {source.type === 'youtube' ? (source.channel || 'YouTube') : getDomain(source.link)}
                </div>
            </div>
        </a>
    );
}

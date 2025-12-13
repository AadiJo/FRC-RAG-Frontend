"use client";

import { useState, useEffect } from "react";
import { Eye, X } from "lucide-react";
import type { ImageResult, TeamInfo } from "@/types/chat";

interface ImageCardProps {
    img: ImageResult;
    teamInfo: TeamInfo;
    apiUrl: string;
}

/**
 * Image card with lazy loading and preview modal
 */
export function ImageCard({ img, teamInfo, apiUrl }: ImageCardProps) {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [error, setError] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        let objectUrl: string | null = null;

        const loadImage = async () => {
            try {
                const response = await fetch(`${apiUrl}/images/${img.web_path}`, {
                    headers: {
                        'ngrok-skip-browser-warning': 'true'
                    }
                });
                if (!response.ok) throw new Error('Failed to load');
                const blob = await response.blob();
                objectUrl = URL.createObjectURL(blob);
                setImgSrc(objectUrl);
            } catch {
                setError(true);
            }
        };
        loadImage();

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [apiUrl, img.web_path]);

    if (error) {
        return (
            <div className="relative bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#333]">
                <div className="w-full h-32 flex items-center justify-center bg-[#1e1e1e] text-[#666]">
                    <span>Image unavailable</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
                    <div className="text-xs text-white font-medium">Team {teamInfo.team}</div>
                    {teamInfo.year && <div className="text-xs text-gray-300">{teamInfo.year}</div>}
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="relative bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#333] hover:translate-y-[-2px] hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => imgSrc && setShowPreview(true)}
            >
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={`Team ${teamInfo.team}`}
                        className="w-full h-32 object-cover"
                    />
                ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-[#1e1e1e]">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
                    <div className="text-xs text-white font-medium">Team {teamInfo.team}</div>
                    {teamInfo.year && <div className="text-xs text-gray-300">{teamInfo.year}</div>}
                    {img.page && <div className="text-xs text-gray-400">Page {img.page}</div>}
                </div>
            </div>
            {showPreview && imgSrc && (
                <ImagePreviewModal
                    imgSrc={imgSrc}
                    img={img}
                    teamInfo={teamInfo}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </>
    );
}

interface ImagePreviewModalProps {
    imgSrc: string;
    img: ImageResult;
    teamInfo: TeamInfo;
    onClose: () => void;
}

/**
 * Full-screen image preview modal
 */
function ImagePreviewModal({ imgSrc, img, teamInfo, onClose }: ImagePreviewModalProps) {
    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="relative max-w-4xl max-h-[90vh] bg-[#1e1e1e] rounded-xl overflow-hidden border border-[#333]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white z-10 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
                <img
                    src={imgSrc}
                    alt={`Team ${teamInfo.team}`}
                    className="max-w-full max-h-[70vh] object-contain mx-auto block"
                />
                <div className="p-4 border-t border-[#333]">
                    <div className="text-lg font-semibold text-[#ececec]">Team {teamInfo.team}</div>
                    <div className="text-sm text-[#8e8ea0]">
                        {teamInfo.year && <span>{teamInfo.year} Season</span>}
                        {img.page && <span> • Page {img.page}</span>}
                    </div>
                    {typeof img.relevance === 'number' && (
                        <div className="mt-2 text-xs text-blue-400 font-semibold">Relevance: {(img.relevance * 100).toFixed(1)}%</div>
                    )}
                    {img.context_summary && (
                        <p className="mt-2 text-sm text-[#b4b4b4]">{img.context_summary}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

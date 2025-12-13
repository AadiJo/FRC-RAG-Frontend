import { Check } from "lucide-react";
import type { Components } from "react-markdown";

/**
 * Custom markdown component renderers for ReactMarkdown
 */
export const markdownComponents: Components = {
    table: ({ children }) => (
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-[#424242]">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }) => <thead className="bg-[#1e1e1e]">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-[#333]">{children}</tr>,
    th: ({ children }) => (
        <th className="border border-[#424242] bg-[#1e1e1e] px-3 py-2 text-left font-semibold text-[#ececec]">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="border border-[#333] px-3 py-2 text-[#dcdcdc]">
            {children}
        </td>
    ),
    p: ({ children }) => <p className="my-2 text-[#dcdcdc]">{children}</p>,
    h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-1 text-[#ececec]">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-bold mt-4 mb-1 text-[#ececec]">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-bold mt-3 mb-1 text-[#ececec]">{children}</h3>,
    strong: ({ children }) => <strong className="font-bold text-[#ececec]">{children}</strong>,
    ul: ({ className, children }) => {
        const isTaskList = className?.includes('contains-task-list');
        return <ul className={isTaskList ? "pl-0 my-2 space-y-1 list-none" : "list-disc pl-6 my-2 space-y-1"}>{children}</ul>;
    },
    ol: ({ children }) => <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>,
    li: ({ className, children }) => {
        const isTaskItem = className?.includes('task-list-item');
        return <li className={isTaskItem ? "list-none flex items-center gap-2 text-[#b4b4b4]" : "text-[#b4b4b4]"}>{children}</li>;
    },
    input: ({ type, checked }) => {
        if (type === 'checkbox') {
            return (
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 ${checked ? 'bg-blue-500 border-blue-500' : 'border-[#666] bg-transparent'}`}>
                    {checked && <Check className="w-3 h-3 text-white" />}
                </span>
            );
        }
        return null;
    },
    a: ({ href, children }) => <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
    blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 my-2 italic text-[#a0a0a0]">{children}</blockquote>,
    code: ({ className, children }) => {
        const isInline = !className;
        if (isInline) {
            return <code className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-sm text-[#e06c75]">{children}</code>;
        }
        return <code className={className}>{children}</code>;
    },
    pre: ({ children }) => <pre className="bg-[#1e1e1e] p-4 rounded-lg overflow-x-auto my-4 text-sm">{children}</pre>,
};

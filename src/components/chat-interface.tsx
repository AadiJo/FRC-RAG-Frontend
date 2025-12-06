"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ArrowUp, ArrowDown, Square, Settings, Bot, User, X, Eye, EyeOff, Check, SlidersHorizontal, Link2, ImageIcon, Brain, Terminal, Key, Cpu } from "lucide-react";

type Message = {
  id: string;
  role: string;
  content: string;
  images?: any[];
  isLoading?: boolean;
  metadata?: {
    matched_pieces?: string[];
    enhanced_query?: string;
    context_sources?: number;
    game_piece_context?: string;
  };
};

export function ChatInterface({ isGuest }: { isGuest: boolean }) {
  const chatHelpers = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
    }
  }) as any;
  
  const { messages: aiMessages, append, sendMessage, status, stop } = chatHelpers;
  
  // Derive isLoading from status (status can be 'idle', 'loading', 'streaming', 'error')
  const isLoading = status === 'loading' || status === 'submitted' || status === 'streaming';

  // Merge metadata from data stream into messages
  const messages = useMemo<Message[]>(() => {
    return aiMessages.map((msg: any, index: number) => {
      const isLast = index === aiMessages.length - 1;
      
      // Handle content being string, array of parts, or parts property (UI Message format)
      let content = '';
      let images: any[] = [];
      let metadata: any = undefined;
      
      if (typeof msg.content === 'string') {
        content = msg.content;
      } else if (Array.isArray(msg.parts)) {
        // UI Message format - messages have .parts array
        for (const part of msg.parts) {
          if (part.type === 'text') {
            content += part.text || '';
          } else if (part.type === 'data-metadata' && part.data) {
            // Custom data part with metadata
            metadata = part.data;
            images = part.data.images || [];
          } else if (part.type && part.type.startsWith('data-') && part.data) {
            // Any other custom data part
            if (part.data.images) {
              images = part.data.images;
              metadata = part.data;
            }
          }
        }
      } else if (Array.isArray(msg.content)) {
        // Legacy format - content is array
        content = msg.content
          .map((part: any) => {
            if (typeof part === 'string') return part;
            if (part && typeof part === 'object' && 'text' in part) return part.text;
            return '';
          })
          .join('');
      }

      const msgWithLoading = { 
        ...msg, 
        content, 
        isLoading: isLast && isLoading,
        images: images.length > 0 ? images : msg.images,
        metadata: metadata || msg.metadata
      } as Message;

      return msgWithLoading;
    });
  }, [aiMessages, isLoading]);

  const { user } = useUser();
  const [input, setInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAtBottomRef = useRef(true);
  
  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [model, setModel] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  
  // Tools state
  const [toolsOpen, setToolsOpen] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  
  // Track when user sends a message to scroll to it once
  const [justSentMessage, setJustSentMessage] = useState(false);
  const prevMessageCountRef = useRef(0);

  const handleLogout = () => {
    if (isGuest) {
      document.cookie = "guest-mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.reload();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let effectiveSystemPrompt = systemPrompt;
    if (user && user.firstName) {
      effectiveSystemPrompt += `\n\nThis user's name is ${user.firstName}${user.lastName ? `, ${user.lastName}` : ''}.`;
    }

    if (sendMessage) {
      // Use sendMessage with text property for UI Message format
      sendMessage({ text: input }, {
        body: { apiKey, model, systemPrompt: effectiveSystemPrompt, showReasoning }
      });
    } else if (append) {
      // Fallback for older versions
      append({
        role: 'user',
        content: input,
      }, {
        body: { apiKey, model, systemPrompt: effectiveSystemPrompt, showReasoning }
      });
    } else {
      console.error("No send method available from useChat");
    }
    
    setInput("");
    setJustSentMessage(true);
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
    // Keep focus on textarea after state updates
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
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
    textarea.style.height = "40px";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  };

  const handleStop = () => {
    stop();
    textareaRef.current?.focus();
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      isAtBottomRef.current = isNearBottom;
      setShowScrollButton(!isNearBottom);
    }
  };

  // Update scroll button visibility when messages change (content grows)
  useEffect(() => {
    handleScroll();
  }, [messages, isLoading]);

  // Scroll to new user message once when sent (not during streaming)
  useEffect(() => {
    // Only scroll when a new message is added (not during content streaming)
    if (justSentMessage && messages.length > prevMessageCountRef.current) {
      // Find the last user message element and scroll it to the top
      if (chatContainerRef.current) {
        // Small delay to ensure the DOM has updated
        setTimeout(() => {
          const container = chatContainerRef.current;
          if (!container) return;
          
          // Find all message elements and get the last user message
          const messageElements = container.querySelectorAll('[data-message-role]');
          const lastUserMessage = Array.from(messageElements).reverse().find(
            el => el.getAttribute('data-message-role') === 'user'
          );
          
          if (lastUserMessage) {
            // Scroll so user message is visible near the top with padding
            // Use scrollIntoView for more reliable scrolling
            lastUserMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Adjust for padding if needed (scrollIntoView aligns to top edge exactly)
            // We can do a small adjustment after the scroll starts, but usually block: 'start' is good enough
            // If we really need the 20px padding, we can use scrollBy or stick to scrollTo
            // Let's try scrollTo again but ensure we're calculating correctly
            
            const messageRect = lastUserMessage.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const offset = messageRect.top - containerRect.top;
            
            // If offset is small, we might not need to scroll much
            if (Math.abs(offset) > 5) {
               container.scrollTo({
                top: container.scrollTop + offset - 20,
                behavior: 'smooth'
              });
            }
            
            // Show scroll button since we're not at bottom after this scroll
            setTimeout(() => {
              handleScroll(); // Re-check scroll position to update button visibility
            }, 350); // After smooth scroll completes
          }
        }, 100);
      }
      setJustSentMessage(false);
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, justSentMessage]);

  // Check if we're currently waiting for/streaming a response
  const lastMessage = messages[messages.length - 1];
  const isStreamingResponse = lastMessage?.role === 'assistant' && isLoading;

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

  // Find the index of the last user message to group the final turn
  let lastUserIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      lastUserIndex = i;
      break;
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#141414]">
      {/* Header */}
      <header className="bg-[#141414] border-b border-[#2f2f2f] px-5 py-6 flex items-center justify-center relative">
        <button 
          onClick={() => setSettingsOpen(true)}
          className="absolute left-5 w-9 h-9 rounded-lg text-[#8e8ea0] hover:text-white hover:bg-[#3f3f3f] flex items-center justify-center transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent">
          FRC RAG
        </h1>
        
        <div className="absolute right-5">
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
        className="flex-1 overflow-y-auto bg-[#141414]"
      >
        {messages.length === 0 && <WelcomeMessage />}
        
        {/* Render history messages (before the last user message) */}
        {lastUserIndex !== -1 ? (
          <>
            {messages.slice(0, lastUserIndex).map((msg, i) => (
              <MessageBubble key={i} message={msg} userImageUrl={user?.imageUrl} />
            ))}
            
            {/* Render the active turn (last user message + response) in a full-height container */}
            <div className="min-h-full flex flex-col justify-start">
              {messages.slice(lastUserIndex).map((msg, i) => (
                <MessageBubble key={lastUserIndex + i} message={msg} userImageUrl={user?.imageUrl} />
              ))}
            </div>
          </>
        ) : (
          /* Fallback for when there are no user messages yet */
          messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} userImageUrl={user?.imageUrl} />
          ))
        )}
      </main>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-[100px] left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#212121] border border-[#424242] text-white flex items-center justify-center shadow-lg hover:bg-[#3f3f3f] hover:scale-110 active:scale-95 transition-all z-50"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Input Area */}
      <footer className="bg-[#141414] p-4 border-t border-[#2f2f2f]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="bg-[#212121] border-2 border-[#424242] rounded-[26px] p-3 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-500/20 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="w-full bg-transparent border-none outline-none text-[#ececec] text-base leading-relaxed resize-none max-h-[200px] overflow-y-hidden placeholder:text-[#8e8ea0] min-h-[40px] pl-2"
              rows={1}
              style={{ height: "40px" }}
            />
            <div className="flex justify-between items-center mt-2">
              {/* Tools section */}
              <div className="flex items-center gap-1">
                <div className="relative">
                  <button
                    id="toolsToggle"
                    type="button"
                    onClick={() => setToolsOpen(!toolsOpen)}
                    className="w-8 h-8 rounded-full text-[#8e8ea0] hover:text-white hover:bg-[#3f3f3f] flex items-center justify-center transition-colors"
                    title="Tools"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  
                  {/* Tools Menu */}
                  {toolsOpen && (
                    <div 
                      id="toolsMenu"
                      className="absolute bottom-full left-0 mb-2 bg-[#1e1e1e] border border-[#424242] rounded-xl p-2 shadow-xl z-50 min-w-[200px]"
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
                    </div>
                  )}
                </div>
                
                {/* Active tools chips */}
                {showReasoning && (
                  <button
                    type="button"
                    onClick={() => setShowReasoning(false)}
                    className="group px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 flex items-center gap-1 hover:bg-blue-500/30 hover:text-blue-300 transition-colors"
                  >
                    <Brain className="w-3 h-3 group-hover:hidden" />
                    <X className="w-3 h-3 hidden group-hover:block" />
                    Reasoning
                  </button>
                )}
              </div>

              <button
                type={isLoading ? "button" : "submit"}
                onClick={isLoading ? handleStop : undefined}
                disabled={!isLoading && !input.trim()}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-blue-500 hover:bg-blue-600 text-white disabled:bg-[#424242] disabled:cursor-not-allowed"
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
        />
      )}
    </div>
  );
}

function WelcomeMessage() {
  return (
    <div className="bg-[#141414] px-5 py-5 border-b border-[rgba(255,255,255,0.05)] animate-fadeInUp">
      <div className="max-w-3xl mx-auto flex gap-6 items-start">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-[#ececec] leading-relaxed">
          <h3 className="font-bold text-blue-500 text-lg mb-3">Welcome to FRC RAG!</h3>
          <p className="text-[#dcdcdc] mb-4">
            I can help you with First Robotics Competition questions using data from team technical binders. Here&apos;s what I can do:
          </p>
          <div className="space-y-2 text-[#b4b4b4] mb-4 pl-4">
            <div><strong className="text-[#ececec]">Answer technical questions</strong> about FRC robots, mechanisms, and strategies</div>
            <div><strong className="text-[#ececec]">Find relevant images</strong> from team documentation</div>
            <div><strong className="text-[#ececec]">Explain game pieces and mechanisms</strong> with enhanced context</div>
            <div><strong className="text-[#ececec]">Provide detailed analysis</strong> based on team technical documentation</div>
          </div>
          <p className="text-[#dcdcdc] mb-3">Try asking me something like:</p>
          <div className="space-y-1 text-[#b4b4b4] mb-4 italic pl-4">
            <div>&quot;How do teams handle ground intake?&quot;</div>
            <div>&quot;Show me swerve drive implementations&quot;</div>
            <div>&quot;What are elements of a good climber?&quot;</div>
          </div>
          <p className="text-[#dcdcdc]"><strong className="text-[#ececec]">Just type your question below to get started!</strong></p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, userImageUrl }: { message: Message; userImageUrl?: string }) {
  const isUser = message.role === "user";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Loading state - show typing indicator
  if (!isUser && message.isLoading && !message.content) {
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

  // Helper to extract team number and year from web_path like "3255-2025/page11_img0.png"
  const getTeamInfo = (webPath: string) => {
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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser 
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
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
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
                  // Check if this is a task list (contains checkboxes)
                  const isTaskList = className?.includes('contains-task-list');
                  return <ul className={isTaskList ? "pl-0 my-2 space-y-1 list-none" : "list-disc pl-6 my-2 space-y-1"}>{children}</ul>;
                },
                ol: ({ children }) => <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>,
                li: ({ className, children }) => {
                  // Check if this is a task list item
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
              }}
            >
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
                {message.images.map((img: any, idx: number) => {
                  const teamInfo = getTeamInfo(img.web_path);
                  return (
                    <ImageCard key={idx} img={img} teamInfo={teamInfo} apiUrl={apiUrl || ''} />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Image preview modal
function ImagePreviewModal({ imgSrc, img, teamInfo, onClose }: { 
  imgSrc: string; 
  img: any; 
  teamInfo: { team: string; year: string }; 
  onClose: () => void 
}) {
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
          {img.context_summary && (
            <p className="mt-2 text-sm text-[#b4b4b4]">{img.context_summary}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Separate component to handle image loading with proper headers
function ImageCard({ img, teamInfo, apiUrl }: { img: any; teamInfo: { team: string; year: string }; apiUrl: string }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Fetch image with proper headers to bypass ngrok warning
    const loadImage = async () => {
      try {
        const response = await fetch(`${apiUrl}/images/${img.web_path}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (!response.ok) throw new Error('Failed to load');
        const blob = await response.blob();
        setImgSrc(URL.createObjectURL(blob));
      } catch (e) {
        setError(true);
      }
    };
    loadImage();
    
    return () => {
      if (imgSrc) URL.revokeObjectURL(imgSrc);
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

function SettingsModal({ 
  onClose, 
  apiKey, 
  setApiKey, 
  showApiKey, 
  setShowApiKey,
  model,
  setModel,
  systemPrompt,
  setSystemPrompt
}: {
  onClose: () => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  showApiKey: boolean;
  setShowApiKey: (v: boolean) => void;
  model: string;
  setModel: (v: string) => void;
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
}) {
  const [apiKeyValid, setApiKeyValid] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [models, setModels] = useState<{id: string; name: string; free: boolean}[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  const DEFAULT_MODEL_NAME = 'GPT-OSS 20B (Server Default)';

  const validateKey = async () => {
    if (!apiKey.trim()) return;
    setApiKeyStatus('loading');
    try {
      const res = await fetch(`${apiUrl}/api/chutes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ api_key: apiKey })
      });
      const data = await res.json();
      if (data.valid) {
        setApiKeyValid(true);
        setApiKeyStatus('success');
        // Load models
        const modelsRes = await fetch(`${apiUrl}/api/chutes/models`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const modelsData = await modelsRes.json();
        if (modelsData.models) {
          const sorted = [...modelsData.models].sort((a: {free: boolean}, b: {free: boolean}) => {
            if (a.free && !b.free) return -1;
            if (!a.free && b.free) return 1;
            return 0;
          });
          setModels(sorted);
        }
      } else {
        setApiKeyValid(false);
        setApiKeyStatus('error');
      }
    } catch {
      setApiKeyValid(false);
      setApiKeyStatus('error');
    }
  };

  const selectedModelName = models.find(m => m.id === model)?.name || (model ? model : DEFAULT_MODEL_NAME);

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
              <Key className="w-4 h-4 text-blue-500" /> Chutes API Key
            </label>
            <p className="text-xs text-[#8e8ea0]">Enter your own Chutes API key to unlock model selection and use your own quota.</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setApiKeyStatus('idle'); setApiKeyValid(false); }}
                  placeholder="Enter your Chutes API key..."
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
            {apiKeyStatus === 'error' && (
              <p className="text-xs text-red-500">Invalid API key</p>
            )}
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
                className={`w-full bg-[#0d0d0d] border border-[#424242] rounded-lg px-3 py-2.5 text-left flex items-center justify-between transition-colors ${
                  apiKeyValid ? 'text-[#ececec] hover:border-[#555] cursor-pointer' : 'text-[#6b6b6b] cursor-not-allowed'
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
                      className={`w-full px-3 py-2.5 text-left hover:bg-[#2a2a2a] flex items-center justify-between transition-colors ${
                        model === m.id ? 'bg-[#2a2a2a] text-blue-400' : 'text-[#ececec]'
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
                <><Check className="w-3 h-3 text-green-500" /> Model selection enabled</>
              ) : (
                <><span>🔒</span> Provide a valid API key to select models</>
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
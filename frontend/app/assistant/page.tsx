"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { isAuthenticated } from "@/lib/auth";
import { askKnowledgeBase } from "@/services/tripService";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: string;
};

const SUGGESTED_PROMPTS = [
  {
    icon: "🇰🇷",
    title: "South Korea Guide",
    query: "What are the visa requirements and best places to visit in South Korea?",
  },
  {
    icon: "🇸🇬",
    title: "Singapore Visa",
    query: "What are the entry and visa rules for visiting Singapore?",
  },
  {
    icon: "🛡️",
    title: "Travel Insurance",
    query: "What emergency medical expenses and trip cancellations are covered in the insurance policy?",
  },
  {
    icon: "🇯🇵",
    title: "Japan Travel Rules",
    query: "What are the customs and medication regulations for entering Japan?",
  },
];

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextIdRef = useRef(1);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  // Auto-scroll strictly within the messages container
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  const handleSendQuery = async (queryText: string) => {
    const question = queryText.trim();
    if (!question || loading) return;

    const timeStr = new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit" }).format(new Date());

    const userMsg: Message = {
      id: nextIdRef.current++,
      role: "user",
      content: question,
      timestamp: timeStr,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await askKnowledgeBase(question);

      const assistantMsg: Message = {
        id: nextIdRef.current++,
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: timeStr,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        {
          id: nextIdRef.current++,
          role: "assistant",
          content: `⚠️ **Error retrieving information:**\n${detail}\n\nPlease verify that your AWS Knowledge Base is synced and reachable.`,
          timestamp: timeStr,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendQuery(input);
  };

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const formatSourceFilename = (uri: string) => {
    try {
      const decoded = decodeURIComponent(uri);
      const name = decoded.split("/").pop() || uri;
      return name.replace(/^[\d_-]+/, ""); // strip optional numerical prefix
    } catch {
      return uri.split("/").pop() || uri;
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900 relative">
      {/* Background Image & Gradient Overlay */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"
        alt="Background"
        className="fixed inset-0 w-full h-full object-cover -z-20 blur-[2px] scale-105 pointer-events-none"
      />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/60 to-slate-950/85 -z-10 pointer-events-none" />

      {/* Floating Animated Particles for Theme Consistency */}
      <div className="particle particle-1 top-24 left-16 pointer-events-none" />
      <div className="particle particle-2 top-48 right-24 pointer-events-none" />
      <div className="particle particle-3 top-96 left-1/4 pointer-events-none" />
      <div className="particle particle-2 bottom-32 right-1/3 pointer-events-none" />

      {/* Header Section */}
      <div className="w-full pt-20 pb-2 px-4 md:px-8 text-center flex-shrink-0 animate-float-up">
        <div className="inline-flex items-center gap-2 py-1 px-3.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/25 shadow-lg mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-200">
            RAG Knowledge Base • Bedrock
          </span>
        </div>

        <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-2xl tracking-tight mb-1">
          Kelana <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Travel Assistant</span>
        </h1>
        <p className="text-white/80 text-xs md:text-sm font-medium max-w-xl mx-auto">
          Ask questions grounded directly in your uploaded travel guides, visa rules, and insurance policies.
        </p>

        {messages.length > 0 && (
          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              onClick={handleClearChat}
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold backdrop-blur-sm border border-white/15 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Conversation
            </button>
            <span className="text-xs text-white/50">•</span>
            <span className="text-xs text-white/60 font-medium">{messages.length} messages</span>
          </div>
        )}
      </div>

      {/* Main Chat Container (Fixed height within viewport, only messages scroll) */}
      <div className="flex-1 min-h-0 w-full max-w-3xl mx-auto px-4 md:px-6 pb-3 flex flex-col justify-between overflow-hidden relative z-10">
        
        {/* Messages Scroll Container — ONLY THIS AREA SCROLLS */}
        <div
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto pr-1 md:pr-2 space-y-4 custom-scrollbar"
        >
          {/* Empty State / Quick Starters */}
          {messages.length === 0 && !loading && (
          <div className="mt-4 flex flex-col gap-6 animate-float-up">
            {/* Welcome Card */}
            <div className="rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 p-6 md:p-8 text-center text-white shadow-2xl relative overflow-hidden">
              <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>

              <h2 className="text-xl font-black mb-2 tracking-tight">How can I help with your trip today?</h2>
              <p className="text-white/80 text-sm max-w-md mx-auto leading-relaxed mb-6">
                I can provide accurate travel details, visa procedures, and document summaries based on your Knowledge Base.
              </p>

              {/* Prompt Suggestions Grid */}
              <div className="text-left">
                <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-200 mb-3 text-center">
                  💡 Suggested Questions
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTED_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendQuery(item.query)}
                      className="group flex items-start gap-3 p-3.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 hover:border-cyan-300/40 backdrop-blur-md transition-all text-left cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-white/70 line-clamp-2 mt-0.5 leading-snug">
                          {item.query}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 md:gap-4 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            } animate-float-up`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
              {msg.role === "user" ? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Bubble Content */}
            <div
              className={`max-w-[88%] md:max-w-[80%] flex flex-col gap-2 ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`rounded-lg p-5 shadow-xl backdrop-blur-md transition-all ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs border border-blue-400/30"
                    : "bg-white/95 text-slate-800 rounded-tl-xs border border-white shadow-slate-900/10"
                }`}
              >
                {/* Assistant Header Tag */}
                {msg.role === "assistant" && (
                  <div className="flex items-center justify-between gap-4 pb-2 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                        AI Knowledge Assistant
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-[10px] text-emerald-600 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Markdown / Text Body */}
                <div
                  className={`text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "text-white font-medium whitespace-pre-wrap"
                      : "prose prose-sm max-w-none prose-slate prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-slate-900 prose-headings:text-slate-900"
                  }`}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>

                {/* Citations Box (Challenge Session 9 Requirement & Bonus) */}
                {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3.5 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg className="w-3.5 h-3.5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Source Citations ({msg.sources.length})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, idx) => {
                        const filename = formatSourceFilename(src);
                        return (
                          <div
                            key={idx}
                            title={src}
                            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-xs font-semibold text-slate-700 hover:text-cyan-900 transition-all shadow-2xs"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="font-mono text-[11px] truncate max-w-[200px] md:max-w-xs">
                              {filename}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-white/50 px-2 font-medium">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 md:gap-4 items-start animate-float-up">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30 flex-shrink-0 mt-1">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>

            <div className="bg-white/95 rounded-lg border border-white px-5 py-4 shadow-xl backdrop-blur-md flex items-center gap-3">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-xs font-bold text-slate-600">
                Searching documents & synthesizing answer...
              </span>
            </div>
          </div>
        )}

          <div ref={bottomRef} />
        </div>

        {/* Fixed Input Bar Form at Bottom */}
        <div className="pt-3 flex-shrink-0 z-20">
          <form
            onSubmit={handleSubmit}
            className="form-card-glow flex items-center gap-2 md:gap-3 bg-white/95 backdrop-blur-xl rounded-lg border border-white/50 shadow-2xl p-2 md:p-2.5"
          >
            <div className="pl-3 text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about visa rules, travel guides, or insurance..."
              disabled={loading}
              className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm font-semibold focus:outline-none disabled:opacity-60 px-1 py-1.5"
              autoFocus
            />

            {input.trim() && (
              <button
                type="button"
                onClick={() => setInput("")}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <>
                  <span>Ask</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between px-3 mt-2 text-[11px] text-white/50 font-medium">
            <span>Powered by AWS Bedrock Knowledge Base</span>
            <span>Grounding documents verified ✅</span>
          </div>
        </div>
      </div>
    </div>
  );
}

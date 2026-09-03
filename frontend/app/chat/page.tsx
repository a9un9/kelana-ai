"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { isAuthenticated } from "@/lib/auth";
import {
  createConversation,
  listConversations,
  listMessages,
  sendMessage,
  renameConversation,
  deleteConversation,
} from "@/services/chatService";
import type { Conversation, Message } from "@/types";

const SUGGESTED_PROMPTS = [
  {
    icon: "🇯🇵",
    title: "5-Day Japan Itinerary",
    prompt: "Plan a 5-day family trip to Tokyo and Kyoto with a moderate budget.",
  },
  {
    icon: "🏝️",
    title: "Hidden Gems in Bali",
    prompt: "Give me hidden gem destinations and authentic local food recommendations in Bali.",
  },
  {
    icon: "🎒",
    title: "Backpacking Labuan Bajo",
    prompt: "What is a 4-day budget backpacking itinerary for Labuan Bajo and Komodo Island?",
  },
  {
    icon: "🍜",
    title: "Yogyakarta Food Tour",
    prompt: "Recommend a 3-day culinary food tour route in Yogyakarta from morning to night.",
  },
];

export default function ChatPage() {
  const router = useRouter();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Rename & Delete state
  const [editingConvId, setEditingConvId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Auth check & fetch conversations list
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadConversations();
  }, [router]);

  // 2. Auto-scroll strictly within the messages container
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  // Load all user conversations
  const loadConversations = async () => {
    try {
      const list = await listConversations();
      setConversations(list);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  // Select or switch conversation
  const handleSelectConversation = async (convId: number) => {
    if (convId === activeConversationId) return;
    setActiveConversationId(convId);
    setSidebarOpen(false);
    setLoadingHistory(true);
    try {
      const msgs = await listMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Start a fresh new chat
  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  // Start renaming
  const handleStartRename = (conv: Conversation, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingConvId(conv.id);
    setEditingTitle(conv.title || `Conversation #${conv.id}`);
  };

  // Save renamed conversation
  const handleSaveRename = async (convId: number) => {
    if (!editingTitle.trim() || renameLoading) return;
    setRenameLoading(true);
    try {
      const updated = await renameConversation(convId, editingTitle.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: updated.title } : c))
      );
      setEditingConvId(null);
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    } finally {
      setRenameLoading(false);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (convId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Send message handler
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    let convId = activeConversationId;

    // If starting from a new conversation, create it first
    if (!convId) {
      try {
        const titleSnippet = text.length > 35 ? text.slice(0, 35) + "..." : text;
        const res = await createConversation(titleSnippet);
        convId = res.conversation_id;
        setActiveConversationId(convId);
        // Refresh conversation list in sidebar
        loadConversations();
      } catch (err) {
        console.error("Failed to create conversation:", err);
        setLoading(false);
        return;
      }
    }

    // Optimistically add user message to UI
    const tempUserMsg: Message = {
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const aiReply = await sendMessage(convId, text);
      const assistantMsg: Message = {
        role: "assistant",
        content: aiReply.content,
        created_at: aiReply.created_at || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Refresh sidebar list to update titles if changed
      loadConversations();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process message";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Sorry, an error occurred:**\n${errorMsg}\n\nPlease try again in a moment.`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (index: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900 relative">
      {/* Background Image & Gradient Overlay — Same template as /assistant */}
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

      {/* Header Section — Matches /assistant */}
      <div className="w-full pt-20 pb-2 px-4 md:px-8 text-center flex-shrink-0 animate-float-up">
        <div className="inline-flex items-center gap-2 py-1 px-3.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/25 shadow-lg mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-200">
            Multi-Turn AI Chat • Amazon Bedrock
          </span>
        </div>

        <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-2xl tracking-tight mb-1">
          Kelana <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AI Chat</span>
        </h1>
        <p className="text-white/80 text-xs md:text-sm font-medium max-w-xl mx-auto">
          Interactive travel assistant with conversational memory to plan trips and answer questions.
        </p>

        {/* Top Control Bar: History Toggle & New Chat */}
        <div className="mt-2 flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span>Chat History ({conversations.length})</span>
          </button>

          <button
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ New Conversation</span>
          </button>

          {activeConversation && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-cyan-200 font-medium max-w-xs group">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span className="truncate">{activeConversation.title || `Conversation #${activeConversation.id}`}</span>
              <button
                onClick={() => handleStartRename(activeConversation)}
                className="p-0.5 text-white/50 hover:text-cyan-300 transition cursor-pointer ml-1"
                title="Rename this conversation"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-4 md:px-6 pb-4 flex flex-col md:flex-row gap-6 items-start justify-center relative z-10 overflow-hidden">
        
        {/* ── Left Sidebar (History Drawer / Card) ── */}
        <aside
          className={`${
            sidebarOpen ? "fixed inset-y-0 left-0 z-40 w-72 bg-slate-900/95 flex" : "hidden md:flex"
          } md:relative md:inset-auto w-72 h-full md:h-[580px] bg-slate-900/95 md:bg-white/10 md:backdrop-blur-xl border-r md:border border-white/20 p-4 flex-col rounded-none md:rounded-lg shadow-2xl transition-all flex-shrink-0 overflow-hidden`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/15">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white">
                Conversations
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 md:hidden"
            >
              ✕
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>

          {/* List */}
          <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1 custom-scrollbar">
            {conversations.length === 0 ? (
              <div className="text-xs text-white/50 text-center py-8 px-2 font-medium">
                No past conversations yet.
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                const isEditing = editingConvId === conv.id;

                if (isEditing) {
                  return (
                    <div
                      key={conv.id}
                      className="p-1.5 rounded-lg bg-white/20 border border-cyan-400/50 flex items-center gap-1.5 shadow-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(conv.id);
                          if (e.key === "Escape") setEditingConvId(null);
                        }}
                        autoFocus
                        className="flex-1 bg-slate-900/90 text-white text-xs px-2 py-1 rounded border border-white/20 focus:outline-none focus:border-cyan-400 font-medium"
                      />
                      <button
                        onClick={() => handleSaveRename(conv.id)}
                        disabled={renameLoading}
                        className="p-1 text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                        title="Save title"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingConvId(null)}
                        className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`group w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 font-bold shadow-md"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-cyan-400 shrink-0">💬</span>
                    <span className="truncate flex-1">
                      {conv.title || `Conversation #${conv.id}`}
                    </span>
                    {/* Actions on hover */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => handleStartRename(conv, e)}
                        className="p-1 rounded text-white/60 hover:text-cyan-300 hover:bg-white/10 transition cursor-pointer"
                        title="Rename conversation"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="p-1 rounded text-white/60 hover:text-rose-400 hover:bg-white/10 transition cursor-pointer"
                        title="Delete conversation"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          />
        )}

        {/* ── Main Chat Thread Area (Scrollable within container) ── */}
        <div className="flex-1 w-full h-full md:h-[580px] flex flex-col justify-between overflow-hidden relative">
          
          {/* Messages Scroll Container — ONLY THIS AREA SCROLLS */}
          <div
            ref={messagesContainerRef}
            className="flex-1 min-h-0 overflow-y-auto pr-1 md:pr-2 space-y-4 custom-scrollbar"
          >
            {/* Empty State / Suggested Prompts */}
            {messages.length === 0 && !loading && !loadingHistory && (
              <div className="flex flex-col gap-6 animate-float-up">
                <div className="rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 p-6 md:p-8 text-center text-white shadow-2xl relative overflow-hidden">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>

                  <h2 className="text-xl md:text-2xl font-black mb-2 tracking-tight">
                    Start a Conversation with KelanaAI
                  </h2>
                  <p className="text-white/80 text-sm max-w-md mx-auto leading-relaxed mb-6">
                    Ask travel tips, plan custom itineraries, or continue your conversation anytime.
                  </p>

                  {/* Prompt Suggestions Grid */}
                  <div className="text-left">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-200 mb-3 text-center">
                      💡 Suggested Topics
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SUGGESTED_PROMPTS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(item.prompt)}
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
                              {item.prompt}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading History Indicator */}
            {loadingHistory && (
              <div className="py-12 flex flex-col items-center justify-center text-white/80 gap-3">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold">Loading conversation thread...</p>
              </div>
            )}

            {/* Messages Thread — Exact same bubble styling as /assistant */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
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
                  className={`max-w-[88%] md:max-w-[80%] flex flex-col gap-1.5 ${
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
                            KelanaAI Assistant
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopy(idx, msg.content)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === idx ? (
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
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-white/50 px-2 font-medium">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
              </div>
            ))}

            {/* AI Loading Bubble */}
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
                    KelanaAI is thinking...
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Fixed Input Bar Form at Bottom of the Box ── */}
          <div className="pt-3 flex-shrink-0 z-20">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
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
                placeholder="Ask anything about travel, itineraries, or continue your conversation..."
                disabled={loading}
                className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 text-sm md:text-base font-medium focus:outline-none px-2 py-2"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-5 py-3 rounded-lg font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
              >
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
            <div className="text-[11px] text-white/60 text-center mt-2 font-medium drop-shadow-sm">
              KelanaAI can make mistakes. Please verify critical travel details.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

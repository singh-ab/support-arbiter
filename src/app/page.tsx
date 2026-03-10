"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type Conversation = {
  id: string;
  title: string | null;
  lastMessagePreview: string | null;
  updatedAt: string;
};

const SUGGESTIONS = [
  "Where is my order?",
  "Can I get my invoice?",
  "How do I reset my password?",
];

function FavIcon({ size = 18 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/favicon.ico"
      alt=""
      width={size}
      height={size}
      style={{ display: "block", borderRadius: 3 }}
    />
  );
}

function IconPlus() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}

function ThinkingDots() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 0",
      }}
    >
      <span
        className="dot-1"
        style={{
          display: "inline-block",
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--text-dim)",
        }}
      />
      <span
        className="dot-2"
        style={{
          display: "inline-block",
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--text-dim)",
        }}
      />
      <span
        className="dot-3"
        style={{
          display: "inline-block",
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--text-dim)",
        }}
      />
    </span>
  );
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId] = useState("demo-user");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/conversations?userId=${userId}`);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, [userId]);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      const data = await res.json();
      if (data.conversation) {
        setMessages(data.conversation.messages || []);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);
  useEffect(() => {
    if (currentConversationId) loadConversation(currentConversationId);
  }, [currentConversationId, loadConversation]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { id: "temp-user", role: "user", content: userMessage },
    ]);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: currentConversationId,
          userId,
          message: userMessage,
        }),
      });

      const data = await res.json();

      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== "temp-user");
        return [
          ...withoutTemp,
          { id: "user-" + Date.now(), role: "user", content: userMessage },
          {
            id: data.assistantMessage.id || "assistant-" + Date.now(),
            role: "assistant",
            content: data.assistantMessage.content,
          },
        ];
      });

      await loadConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== "temp-user"));
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const deleteConversation = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
      if (currentConversationId === id) startNewConversation();
      await loadConversations();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        .conv-item:hover { background: var(--surface-2) !important; }
        .conv-item:hover .conv-delete { opacity: 1 !important; }
        .conv-delete:hover { color: #f87171 !important; }
        .btn-new:hover { background: var(--accent-hover) !important; }
        .suggestion:hover { border-color: var(--accent) !important; color: var(--text) !important; }
        .send-btn:not(:disabled):hover { background: var(--accent-hover) !important; }
        textarea::placeholder { color: var(--text-muted); }
        textarea:focus { outline: none; border-color: var(--accent) !important; }
      `}</style>

      <div
        style={{
          display: "flex",
          height: "100vh",
          background: "var(--bg)",
          fontFamily: "var(--font)",
        }}
      >
        {/* ── Sidebar ── */}
        <aside
          style={{
            width: 260,
            flexShrink: 0,
            background: "var(--surface)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Brand */}
          <div
            style={{
              padding: "18px 16px 14px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                flexShrink: 0,
                background: "#e6f7f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <FavIcon size={34} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--text)",
                  lineHeight: 1.2,
                }}
              >
                Support Arbiter
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 1,
                }}
              >
                AI Customer Support
              </div>
            </div>
          </div>

          {/* New conversation */}
          <div style={{ padding: "12px 12px 6px" }}>
            <button
              className="btn-new"
              onClick={startNewConversation}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "9px 14px",
                background: "#10b981",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "var(--font)",
                transition: "background 0.15s",
              }}
            >
              <IconPlus /> New conversation
            </button>
          </div>

          {/* Conversations */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
            {conversations.length === 0 && (
              <div
                style={{
                  padding: "20px 8px",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  textAlign: "center",
                }}
              >
                No conversations yet
              </div>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="conv-item"
                onClick={() => setCurrentConversationId(conv.id)}
                style={{
                  padding: "9px 10px",
                  marginBottom: 2,
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 6,
                  background:
                    currentConversationId === conv.id
                      ? "var(--surface-2)"
                      : "transparent",
                  border: `1px solid ${currentConversationId === conv.id ? "var(--border)" : "transparent"}`,
                  transition: "background 0.1s",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {conv.title || "New conversation"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginTop: 2,
                    }}
                  >
                    {conv.lastMessagePreview || "No messages"}
                  </div>
                </div>
                <button
                  className="conv-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    borderRadius: 4,
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                    opacity: 0,
                    transition: "opacity 0.15s, color 0.15s",
                  }}
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-dim)",
              }}
            >
              D
            </div>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
              Demo User
            </span>
          </div>
        </aside>

        {/* ── Main ── */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "36px 28px" }}>
            {messages.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: 24,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 18,
                    background: "#e6f7f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <FavIcon size={60} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: 8,
                    }}
                  >
                    How can I help you?
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                    Ask about your orders, invoices, or get support.
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className="suggestion"
                      onClick={() => {
                        setInput(s);
                        inputRef.current?.focus();
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 20,
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--text-dim)",
                        fontSize: 12.5,
                        cursor: "pointer",
                        fontFamily: "var(--font)",
                        transition: "border-color 0.15s, color 0.15s",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  maxWidth: 720,
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.role === "user" ? "flex-end" : "flex-start",
                      alignItems: "flex-end",
                      gap: 10,
                    }}
                  >
                    {msg.role === "assistant" && (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          flexShrink: 0,
                          marginBottom: 2,
                          background: "#e6f7f1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        <FavIcon size={28} />
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: "76%",
                        padding: "12px 16px",
                        borderRadius:
                          msg.role === "user"
                            ? "18px 18px 4px 18px"
                            : "18px 18px 18px 4px",
                        background:
                          msg.role === "user"
                            ? "linear-gradient(135deg, #059669, #0891b2)"
                            : "var(--surface-2)",
                        border:
                          msg.role === "assistant"
                            ? "1px solid var(--border)"
                            : "none",
                        color: "var(--text)",
                        fontSize: 14,
                        lineHeight: 1.65,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "flex-end",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        flexShrink: 0,
                        background: "#e6f7f1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <FavIcon size={28} />
                    </div>
                    <div
                      style={{
                        padding: "14px 18px",
                        borderRadius: "18px 18px 18px 4px",
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <ThinkingDots />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input bar */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              padding: "16px 28px 20px",
              background: "var(--surface)",
            }}
          >
            <div
              style={{
                maxWidth: 720,
                margin: "0 auto",
                display: "flex",
                gap: 10,
                alignItems: "flex-end",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
                placeholder="Message Support Arbiter…"
                disabled={loading}
                rows={1}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--text)",
                  fontSize: 14,
                  fontFamily: "var(--font)",
                  resize: "none",
                  lineHeight: 1.5,
                  maxHeight: 120,
                  overflowY: "auto",
                  transition: "border-color 0.15s",
                  opacity: loading ? 0.5 : 1,
                }}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: "none",
                  flexShrink: 0,
                  background:
                    loading || !input.trim()
                      ? "var(--surface-2)"
                      : "var(--accent)",
                  color:
                    loading || !input.trim() ? "var(--text-muted)" : "#fff",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
                }}
              >
                <IconSend />
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

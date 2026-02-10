import { useState, useRef, useEffect } from "react";
import { chatWithGemini, QUICK_PROMPTS } from "./geminiService";

// Simple markdown-like formatting
function formatMessage(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(167,139,250,0.15);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
    .replace(/^### (.+)$/gm, '<h4 style="color:#a78bfa;margin:12px 0 6px;font-size:14px;font-weight:700">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="color:#a78bfa;margin:14px 0 8px;font-size:15px;font-weight:700">$1</h3>')
    .replace(/^- (.+)$/gm, '<div style="padding-left:12px;margin:3px 0">• $1</div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div style="padding-left:12px;margin:3px 0">$1. $2</div>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function AIAdvisor({ financialData }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem("finsight-gemini-key") || ""; } catch { return ""; }
  });
  const [showSetup, setShowSetup] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasKey = apiKey.length > 10;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveKey = () => {
    const key = tempKey.trim();
    if (key) {
      localStorage.setItem("finsight-gemini-key", key);
      setApiKey(key);
      setShowSetup(false);
      setTempKey("");
    }
  };

  const clearKey = () => {
    localStorage.removeItem("finsight-gemini-key");
    setApiKey("");
    setMessages([]);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading || !hasKey) return;
    const userMsg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await chatWithGemini(apiKey, newMessages, financialData);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ **Error:** ${err.message}\n\n${err.message.includes("API key") ? "Your Gemini API key may be invalid. Click the key icon to update it." : "Please try again."}`,
        isError: true,
      }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", outline: "none",
  };

  // ─── No API Key: Setup Screen ───
  if (!hasKey) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(234,179,8,0.06))",
          border: "1px solid rgba(167,139,250,0.15)",
          borderRadius: 20, padding: 28, textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px",
            background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(234,179,8,0.15))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, border: "1px solid rgba(167,139,250,0.2)",
          }}>🤖</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Finsight AI Advisor</h3>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 20px", lineHeight: 1.6 }}>
            Get personalized financial advice, savings plans, debt strategies, and budget recommendations — all based on your actual financial data.
          </p>

          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 20,
            textAlign: "left", marginBottom: 16,
          }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Setup — Free Gemini API Key
            </p>
            <ol style={{ margin: 0, padding: "0 0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
              <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style={{ color: "#a78bfa", textDecoration: "underline" }}>aistudio.google.com/apikey</a></li>
              <li>Click <strong style={{ color: "#fff" }}>"Create API Key"</strong></li>
              <li>Copy the key and paste it below</li>
            </ol>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "10px 0 0", lineHeight: 1.5 }}>
              🔒 Your key is stored locally on your device only — never sent to our servers.
              <br/>Gemini offers a generous free tier (~1500 requests/day).
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="password" placeholder="Paste your Gemini API key"
              value={tempKey} onChange={e => setTempKey(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveKey()}
              style={{ ...inputStyle, flex: 1, borderColor: "rgba(167,139,250,0.3)" }}
            />
            <button onClick={saveKey} disabled={!tempKey.trim()} style={{
              background: tempKey.trim() ? "linear-gradient(135deg, #a78bfa, #818cf8)" : "rgba(255,255,255,0.06)",
              border: "none", borderRadius: 12, padding: "12px 20px", cursor: "pointer",
              color: tempKey.trim() ? "#fff" : "rgba(255,255,255,0.2)", fontWeight: 700, fontSize: 14,
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              boxShadow: tempKey.trim() ? "0 4px 16px rgba(167,139,250,0.3)" : "none",
            }}>Connect</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Chat Interface ───
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 240px)", minHeight: 400 }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🤖</span>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Finsight AI</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Powered by Gemini • Knows your finances</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "6px 10px", cursor: "pointer",
              color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'DM Sans', sans-serif",
            }}>Clear chat</button>
          )}
          <button onClick={clearKey} title="Change API key" style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "6px 8px", cursor: "pointer",
            color: "rgba(255,255,255,0.4)", fontSize: 13,
          }}>🔑</button>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12,
        paddingRight: 4, minHeight: 0,
      }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, marginBottom: 20 }}>
              Ask me anything about your finances, or try a quick prompt:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {QUICK_PROMPTS.map((qp, i) => (
                <button key={i} onClick={() => sendMessage(qp.prompt)} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: "10px 14px", cursor: "pointer",
                  color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s", textAlign: "left", maxWidth: 220,
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(167,139,250,0.1)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                >{qp.label}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}>
              <div style={{
                maxWidth: "85%",
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(129,140,248,0.15))"
                  : msg.isError
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(255,255,255,0.04)",
                border: `1px solid ${msg.role === "user" ? "rgba(167,139,250,0.2)" : msg.isError ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)"}`,
                fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.85)",
              }}
                dangerouslySetInnerHTML={{
                  __html: msg.role === "user" ? msg.content.replace(/\n/g, "<br/>") : formatMessage(msg.content),
                }}
              />
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "12px 18px", borderRadius: "16px 16px 16px 4px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", gap: 6, alignItems: "center",
            }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%", background: "#a78bfa",
                    animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                    opacity: 0.6,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>Analyzing your finances…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        display: "flex", gap: 8, marginTop: 12, flexShrink: 0,
      }}>
        <input
          ref={inputRef}
          type="text" placeholder="Ask about your finances, set a goal, get advice…"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          style={{
            ...inputStyle, flex: 1,
            opacity: loading ? 0.5 : 1,
            borderColor: "rgba(167,139,250,0.2)",
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={{
            background: (input.trim() && !loading) ? "linear-gradient(135deg, #a78bfa, #818cf8)" : "rgba(255,255,255,0.06)",
            border: "none", borderRadius: 12, padding: "12px 18px", cursor: "pointer",
            color: (input.trim() && !loading) ? "#fff" : "rgba(255,255,255,0.2)",
            fontWeight: 700, fontSize: 18, fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s", flexShrink: 0,
            boxShadow: (input.trim() && !loading) ? "0 4px 16px rgba(167,139,250,0.3)" : "none",
          }}
        >↑</button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

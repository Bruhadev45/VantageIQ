import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { API_BASE_URL } from "../../services/apiClient";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type Props = {
  market: string;
  company: string;
  competitors: string[];
};

export function AIChat({ market, company, competitors }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm your AI competitive intelligence assistant for ${market}. Ask me anything about competitors, market trends, or strategic recommendations.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    // Send prior turns (minus the canned welcome) so follow-ups keep context.
    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/intelligence/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history,
          context: { market, company, competitors },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response || "I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please check your connection and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    `Who is ${company}'s biggest threat?`,
    "What are the key market trends?",
    "How should we respond to competitor moves?",
    competitors.length >= 2
      ? `Compare ${competitors[0]} vs ${competitors[1]}`
      : "Compare the top two competitors",
  ];

  return (
    <article className="panel chat-panel">
      <div className="panel-heading compact">
        <div className="chat-header">
          <Sparkles size={16} className="accent-icon" />
          <span>AI Intelligence Assistant</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <div className="message-avatar">
              {message.role === "assistant" ? <Bot size={18} /> : <User size={18} />}
            </div>
            <div className="message-content">
              <p>{message.content}</p>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message assistant">
            <div className="message-avatar">
              <Bot size={18} />
            </div>
            <div className="message-content loading">
              <Loader2 size={16} className="spin" />
              <span>Analyzing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="suggested-questions">
          {suggestedQuestions.map((question, i) => (
            <button
              key={i}
              className="suggestion-chip"
              onClick={() => sendMessage(question)}
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-container">
        <textarea
          className="chat-input"
          placeholder="Ask about competitors, trends, or strategies..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          rows={1}
          disabled={isLoading}
        />
        <button
          className="chat-send-btn"
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        </button>
      </div>
    </article>
  );
}

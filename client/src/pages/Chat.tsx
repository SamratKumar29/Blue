import { useState, useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';
import BlueMascot from '../components/BlueMascot';

interface Message {
  id: string;
  role: 'user' | 'blue';
  text: string;
  sources?: string[];
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm0',
    role: 'blue',
    text: "Hi Alex! I'm here to help. Ask me about your tasks, policies, or team. Your conversations stay private — nothing is logged or shared.",
    sources: [],
  }
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setSending(true);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(m => [...m, userMsg]);

    // Simulated response (will be wired to AI in Phase 5)
    await new Promise(r => setTimeout(r, 800));
    const reply: Message = {
      id: (Date.now() + 1).toString(),
      role: 'blue',
      text: "I'm in demo mode right now. Once you connect a model in Settings, I'll give you grounded answers about your tasks, policies, and team.",
    };
    setMessages(m => [...m, reply]);
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
        <BlueMascot size={36} mood="calm" />
        <div>
          <h1 className="font-semibold text-ink">Chat with Blue</h1>
          <p className="text-xs text-muted flex items-center gap-1">
            <Lock size={11} /> Blue is private — messages are not logged or shared
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(msg => (
          <div key={msg.id}
               className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'blue' && <BlueMascot size={32} mood="calm" className="flex-shrink-0 mt-1" />}
            <div className={[
              'max-w-[75%] px-4 py-3 rounded-2xl text-sm',
              msg.role === 'user'
                ? 'bg-blue-500 text-white rounded-tr-sm'
                : 'bg-white shadow-card text-ink rounded-tl-sm'
            ].join(' ')}>
              {msg.text}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.sources.map(s => (
                    <span key={s} className="pill bg-blue-50 text-blue-600 text-[10px]">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex gap-3 justify-start">
            <BlueMascot size={32} mood="calm" className="flex-shrink-0 mt-1" />
            <div className="bg-white shadow-card px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-muted animate-pulse">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-100 bg-white">
        <div className="flex gap-3">
          <input
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-ink
                       focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                       placeholder:text-muted"
            placeholder="Ask about your tasks, policies, or anything work-related…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }}}
            disabled={sending}
            aria-label="Chat message input"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

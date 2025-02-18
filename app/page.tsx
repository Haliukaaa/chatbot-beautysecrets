'use client';
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { BotMessageSquare, SendHorizonal, X } from 'lucide-react';
import { useOnClickOutside } from 'usehooks-ts';

const MemoizedReactMarkdown = memo(ReactMarkdown);

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  useOnClickOutside(chatRef, () => setIsChatOpen(false));

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedInput = input.trim();
      if (!trimmedInput) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        content: trimmedInput,
        role: 'user',
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmedInput,
            threadId,
          }),
        });

        if (!response.ok) throw new Error(await response.text());

        const data: ApiResponse = await response.json();
        if (data.threadId) {
          setThreadId(data.threadId);
          localStorage.setItem('chatThreadId', data.threadId);
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: formatResponse(data.message),
          role: 'assistant',
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: error instanceof Error ? error.message : 'An error occurred. Please try again.',
            role: 'assistant',
            createdAt: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, threadId, input]
  );

  useEffect(() => {
    if (threadId) localStorage.setItem('chatThreadId', threadId);
  }, [threadId]);

  useEffect(() => {
    const savedThreadId = localStorage.getItem('chatThreadId');
    if (savedThreadId) setThreadId(savedThreadId);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={chatRef}>
      {/* Floating Action Button */}
      {!isChatOpen && <motion.button
        onClick={() => setIsChatOpen(!isChatOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-14 h-14 flex items-center justify-center rounded-full shadow-2xl"
        style={{ backgroundColor: COLORS.secondary }}
      >
        <AnimatePresence mode="wait">
            <motion.div key="chat" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <BotMessageSquare className="text-white" size={24} />
            </motion.div>
        </AnimatePresence>

        {/* Pulsing dot */}
        {!isChatOpen && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </motion.button>}

      {/* Chat Container */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute bottom-0 right-0 w-80 xl:w-96 rounded-2xl shadow-2xl backdrop-blur-lg"
            style={{
              background: COLORS.glass,
              border: `1px solid ${COLORS.primary}`,
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.primary }}>
              <div className="flex items-center space-x-3">
                <img src="https://beautysecrets.mn/logo.svg" alt="Logo" className="w-8 h-8 object-contain" />
                <h2 className="font-semibold" style={{ color: COLORS.text }}>
                  Beauty Secrets AI Assistant
                </h2>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-1 hover:opacity-70 transition-opacity">
                <X size={20} color={COLORS.text} />
              </button>
            </div>

            {/* Messages Container */}
            <div className="h-80 xl:h-96 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-8 text-sm italic" style={{ color: COLORS.accent }}>
                  Надаас Beauty Secrets-ийн талаар асуугаарай..
                </motion.div>
              )}

              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm transition-all ${
                      message.role === 'user'
                        ? 'ml-12 bg-gradient-to-br from-[#FFA08E] to-[#FF7E67] text-white'
                        : 'mr-12 shadow-sm border border-[#FFE7E3]'
                    }`}
                    style={{
                      borderRadius: message.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      background: message.role === 'assistant' ? `${COLORS.assistantBg}` : undefined,
                    }}
                  >
                    {message.role === 'assistant' ? (
                      <MemoizedReactMarkdown
                        components={{
                          ol: ({ ...props }) => <ol className="list-decimal pl-5" {...props} />,
                          ul: ({ ...props }) => <ul className="list-disc pl-5" {...props} />,
                          a: ({ ...props }) => <a className="text-blue-600 underline" {...props} />,
                        }}
                        className="prose-sm"
                      >
                        {message.content}
                      </MemoizedReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div className="flex justify-start">
                  <div className="p-3 rounded-2xl shadow-sm" style={{ background: COLORS.assistantBg, border: `1px solid ${COLORS.primary}` }}>
                    <div className="flex space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{ background: COLORS.accent }}
                          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t flex space-x-2 items-center" style={{ borderColor: COLORS.primary }}>
              <motion.div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Асуултаа бичнэ үү..."
                  className="w-full p-3 text-sm rounded-xl pr-12 transition-all border focus:outline-none"
                  style={{ background: COLORS.background, color: COLORS.text, borderColor: COLORS.primary }}
                />
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-2 top-1.5 p-2 rounded-lg disabled:opacity-50 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ background: COLORS.accent, color: 'white' }}
                >
                  <SendHorizonal size={18} />
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInterface;

// Utility functions
const formatResponse = (content: string | undefined) => {
  if (!content) return 'No response received. Please try again.';
  return content.replace(/【.*?†.*?】/g, '').replace(/(\d+\.\s)/g, '\n$1').replace(/\n\n+/g, '\n').trim();
};

type Message = {
  id: string;
  content: string;
  role: 'assistant' | 'user';
  createdAt: Date;
};

type ApiResponse = {
  message?: string;
  threadId?: string;
  error?: string;
};

const COLORS = {
  primary: '#FFE7E3',
  secondary: '#F8D7D1',
  accent: '#FF7E67',
  background: '#FFFCFA',
  text: '#554D4B',
  glass: 'rgba(255, 252, 250, 0.95)',
  assistantBg: '#FBF3F0',
};
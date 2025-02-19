'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BotMessageSquare } from 'lucide-react';
import { useOnClickOutside } from 'usehooks-ts';
import { ChatHeader } from './chat/chat-header';
import { ChatMessage } from './chat/chat-message';
import { LoadingDots } from './chat/loading-dots';
import { useChatThread } from './chat/use-chat-thread';
import { formatResponse } from './chat/format-response-helper';
import { COLORS } from './chat/constants';
import type { Message, ApiResponse } from './chat/types';
import { EmptyState } from './chat/empty-state';
import { ChatInput } from './chat/chat-input';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const { threadId, setThreadId } = useChatThread();

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
          body: JSON.stringify({ message: trimmedInput, threadId }),
        });

        if (!response.ok) throw new Error(await response.text());

        const data: ApiResponse = await response.json();
        if (data.threadId) setThreadId(data.threadId);

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: formatResponse(data.message),
            role: 'assistant',
            createdAt: new Date(),
          },
        ]);
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
    [input, threadId, setThreadId]
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={chatRef}>
      {/* Дэлгэцийн баруун доор байрлах чатлах товч */}
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
      {/* Чатлах товчин дээр дарсан үед нээгдэх чатны цонх */}
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
            <ChatHeader onClose={() => setIsChatOpen(false)} />

            <div className="h-80 xl:h-96 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 && (
                <EmptyState />
              )}

              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isLoading && <LoadingDots />}
              <div ref={messagesEndRef} />
            </div>

            <ChatInput
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInterface;
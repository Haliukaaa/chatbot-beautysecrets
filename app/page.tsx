'use client';
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleMore, SendHorizonal, UserRound } from 'lucide-react';
import CyrillicToTranslit from 'cyrillic-to-translit-js';

type Message = {
  id: string;
  content: string;
  role: 'assistant' | 'user';
  createdAt: Date;
};

const formatResponse = (content: string) => {
  const cleanContent = content.replace(/【.*?†.*?】/g, '');
  const formattedContent = cleanContent
    .replace(/(\d+\.\s)/g, '\n$1')
    .replace(/\n\n+/g, '\n');
  
  return formattedContent.trim();
};

const isCyrillic = (text: string) => {
  const cyrillicRegex = /[\u0400-\u04FF]/;
  return cyrillicRegex.test(text);
};

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processInput = (input: string) => {
    if (isCyrillic(input)) {
      return input;
    }
    return CyrillicToTranslit({preset: "mn"}).transform(input);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const processedInput = processInput(input);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: processedInput,
      role: 'user',
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: processedInput,
          threadId: threadId 
        }),
      });

      const data = await response.json();
      if (data.threadId) {
        setThreadId(data.threadId);
      }
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: formatResponse(data.message),
        role: 'assistant',
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Уучлаарай, таны хүсэлтийг биелүүлэхэд алдаа гарлаа. Та дахин оролдоно уу.',
        role: 'assistant',
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (threadId) {
      localStorage.setItem('chatThreadId', threadId);
    }
  }, [threadId]);

  useEffect(() => {
    const savedThreadId = localStorage.getItem('chatThreadId');
    if (savedThreadId) {
      setThreadId(savedThreadId);
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Buttons Container */}
      <motion.div 
        className="flex space-x-2"
        animate={{ 
          y: [0, -10, 0],
          transition: { 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }
        }}
      >

        {/* Chat Toggle Button */}
        <motion.button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 bg-[#ffe7e3] rounded-full flex items-center justify-center 
            shadow-lg transition-all duration-300 ease-in-out"
        >
          <MessageCircleMore className='stroke-1'/>
        </motion.button>
      </motion.div>

      {/* Chat Interface */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-16 right-0 w-[300px] md:w-[350px] bg-[#ffe7e3] rounded-lg shadow-xl border border-gray-200"
          >
            {/* Messages Container */}
            <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-white rounded-t-lg">
              {messages.length === 0 && (
                <div className='text-[#ffa08e] text-center'>
                  Та Beauty Secrets-ийн талаар асуух зүйлээ бичнэ үү...
                </div>
              )}
              {messages.map((message) => (
                <motion.div 
                  key={message.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start space-x-2 animate-fadeIn relative ${
                    message.role === 'assistant' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[#ffe7e3] flex items-center justify-center">
                      <img 
                        src="https://beautysecrets.mn/logo.svg" 
                        alt="Assistant" 
                        className="w-6 h-6"
                      />
                      {/* Speech Bubble Pointer for Assistant */}
                      <div className="absolute top-4 left-10 w-0 h-0 
                        border-t-8 border-t-transparent 
                        border-b-8 border-b-transparent 
                        border-r-8 border-r-gray-100 
                        -ml-2 -mt-2"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-lg relative ${
                      message.role === 'assistant'
                        ? 'bg-gray-100'
                        : 'bg-[#ffa08e] text-white'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <ReactMarkdown 
                        components={{
                          ol: ({...props}) => (
                            <ol className="list-decimal pl-5" {...props} />
                          ),
                          ul: ({...props}) => (
                            <ul className="list-disc pl-5" {...props} />
                          ),
                          a: ({...props}) => (
                            <a className="text-blue-600 underline" {...props} />
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                    {/* Speech Bubble Pointer for User */}
                    {message.role === 'user' && (
                      <div className="absolute top-4 right-full w-0 h-0 
                        border-t-8 border-t-transparent 
                        border-b-8 border-b-transparent 
                        border-l-8 border-l-[#ffa08e] 
                        -mr-2 -mt-2"
                      />
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[#ffa08e] flex items-center justify-center">
                      <UserRound className="w-5 h-5 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-500" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-1000" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex p-2 space-x-2 bg-[#ffe7e3] rounded-b-lg">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e58b79]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="p-2 px-3 bg-[#ffa08e] text-white rounded-full hover:bg-[#e58b79] transition-colors disabled:bg-[#fbb3a4]"
              >
                <SendHorizonal className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInterface;
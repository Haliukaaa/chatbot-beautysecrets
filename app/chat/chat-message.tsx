// AI Assistant болон хэрэглэгчийн мессежийг харуулж байгаа хэсэг
import { motion } from 'framer-motion';
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from './types';
import { COLORS } from './constants';
const MemoizedReactMarkdown = memo(ReactMarkdown);

type ChatMessageProps = {
    message: Message;
};

export const ChatMessage = ({ message }: ChatMessageProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
        <div
            className={`max-w-[85%] p-3 rounded-2xl text-sm transition-all ${message.role === 'user'
                ? 'ml-12 bg-gradient-to-br from-[#FFA08E] to-[#FF7E67] text-white'
                : 'mr-12 shadow-sm border border-[#FFE7E3]'
                }`}
            style={{
                borderRadius: message.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: message.role === 'assistant' ? COLORS.assistantBg : undefined,
            }}
        >
            {message.role === 'assistant' ? (
                <MemoizedReactMarkdown
                    components={{
                        ol: ({ ...props }) => <ol className="list-decimal pl-4" {...props} />,
                        ul: ({ ...props }) => <ul className="list-disc pl-4" {...props} />,
                        a: ({ ...props }) => <a className="text-blue-600 underline" {...props} />,
                        p: ({ ...props }) => <p className="mb-4" {...props} />
                    }}
                    className="prose-sm"
                >
                    {message.content}
                </MemoizedReactMarkdown>
            ) : (
                <div>{message.content}</div>
            )}
        </div>
    </motion.div>
);
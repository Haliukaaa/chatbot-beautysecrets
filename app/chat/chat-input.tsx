// AI Assistant-руу мессежээ илгээх input хэсэг
import { motion } from 'framer-motion';
import { SendHorizonal } from 'lucide-react';
import { COLORS } from './constants';

type ChatInputProps = {
    input: string;
    setInput: (value: string) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    isLoading: boolean;
};

export const ChatInput = ({ input, setInput, handleSubmit, isLoading }: ChatInputProps) => (
    <form
        onSubmit={handleSubmit}
        className="p-4 border-t flex space-x-2 items-center"
        style={{ borderColor: COLORS.primary }}
    >
        <motion.div className="relative flex-1">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Асуултаа бичнэ үү..."
                className="w-full p-3 text-sm rounded-xl pr-12 transition-all border focus:outline-none"
                style={{
                    background: COLORS.background,
                    color: COLORS.text,
                    borderColor: COLORS.primary
                }}
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
);
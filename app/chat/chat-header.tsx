// Beauty Secrets-ийн логотой чатны header хэсэг
import { X } from 'lucide-react';
import { COLORS } from './constants';
type ChatHeaderProps = {
    onClose: () => void;
};

export const ChatHeader = ({ onClose }: ChatHeaderProps) => (
    <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.primary }}>
        <div className="flex items-center space-x-3">
            <img src="https://beautysecrets.mn/logo.svg" alt="Logo" className="w-8 h-8 object-contain" />
            <h2 className="font-semibold" style={{ color: COLORS.text }}>
                Beauty Secrets AI Assistant
            </h2>
        </div>
        <button onClick={onClose} className="p-1 hover:opacity-70 transition-opacity">
            <X size={20} color={COLORS.text} />
        </button>
    </div>
);
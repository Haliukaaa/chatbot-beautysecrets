import { motion } from 'framer-motion';
import { COLORS } from './constants';

export const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center pt-8 text-sm italic"
        style={{ color: COLORS.accent }}
    >
        Надаас Beauty Secrets-ийн талаар асуугаарай...<br />
        Кирилл үсгээр бичихээ мартав аа 😊
    </motion.div>
);
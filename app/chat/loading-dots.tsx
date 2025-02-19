// AI Assistant-аас хариу ирэхийг хүлээх зуур уншиж байгаа мэт харагдах гурван цэг
import { motion } from 'framer-motion';
import { COLORS } from './constants';
export const LoadingDots = () => (
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
);
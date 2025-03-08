import { motion } from 'framer-motion';
import { COLORS } from './constants';

export const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center pt-8 text-sm italic"
        style={{ color: COLORS.accent }}
    >
        Та асуух зүйлээ кирилл үсгээр<br/>бичин асууна уу... 😊
    </motion.div>
);
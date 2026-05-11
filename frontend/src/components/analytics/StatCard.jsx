import { motion } from 'framer-motion';

import useCountUp from '../../hooks/useCountUp';

const StatCard = ({ label, value = 0, accent = 'text-primary' }) => {
  const animatedValue = useCountUp({ end: Number(value || 0), duration: 1100 });

  return (
    <motion.div
      className="rounded-2xl border border-border bg-surface p-4 shadow-soft"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <p className="text-sm text-text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{animatedValue}</p>
    </motion.div>
  );
};

export default StatCard;

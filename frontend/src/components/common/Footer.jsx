import { motion } from 'framer-motion';

import { APP_NAME } from '../../utils/constants';

const Footer = () => {
  return (
    <motion.footer
      className="hidden border-t border-border bg-surface py-4 lg:block"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 text-xs text-text-muted sm:px-6">
        <motion.p whileHover={{ y: -1 }}>{APP_NAME} Real-Time Reporting Platform</motion.p>
        <motion.p whileHover={{ y: -1 }}>Emergency support: Contact local law enforcement for urgent incidents</motion.p>
        <motion.p whileHover={{ y: -1 }}>{new Date().getFullYear()} All rights reserved</motion.p>
      </div>
    </motion.footer>
  );
};

export default Footer;

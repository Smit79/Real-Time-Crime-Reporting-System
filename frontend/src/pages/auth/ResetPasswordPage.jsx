import { useEffect } from 'react';
import { motion } from 'framer-motion';

import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import PageTransition from '../../components/common/PageTransition';

const ResetPasswordPage = () => {
  useEffect(() => {
    document.title = 'Reset Password | CrimeWatch';
  }, []);

  return (
    <PageTransition className="grid min-h-screen place-items-center bg-auth-pattern px-4 py-10">
      <motion.div
        className="w-full max-w-md rounded-3xl border border-border bg-surface/90 p-6 shadow-soft backdrop-blur"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <motion.h1 className="font-heading text-2xl font-bold text-text" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          Set a new password
        </motion.h1>
        <motion.p className="mt-2 text-sm text-text-muted" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          Enter your new password below to complete the reset.
        </motion.p>
        <motion.div className="mt-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <ResetPasswordForm />
        </motion.div>
      </motion.div>
    </PageTransition>
  );
};

export default ResetPasswordPage;

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, MailCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import RegisterForm from '../../components/auth/RegisterForm';
import PageTransition from '../../components/common/PageTransition';

const RegisterPage = () => {
  const [verificationOverlay, setVerificationOverlay] = useState(false);

  useEffect(() => {
    document.title = 'Register | CrimeWatch';
  }, []);

  const handleRegistered = () => {
    setVerificationOverlay(true);
    setTimeout(() => setVerificationOverlay(false), 1500);
  };

  return (
    <PageTransition className="grid min-h-screen bg-auth-pattern lg:grid-cols-5">
      <section className="relative overflow-hidden px-6 py-10 lg:col-span-3 lg:px-12 lg:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,64,175,0.28),transparent_38%),radial-gradient(circle_at_70%_35%,rgba(15,118,110,0.2),transparent_35%)]" />
        <div className="relative z-10 max-w-xl">
          <p className="inline-flex rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary">
            Join the response network
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-tight text-text sm:text-5xl">
            Build safer neighborhoods with community intelligence.
          </h1>
          <p className="mt-4 text-base text-text-muted sm:text-lg">
            Register once to submit reports, follow investigations, and receive nearby alerts that matter.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 lg:col-span-2 lg:px-10">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md rounded-3xl border border-border bg-surface/90 p-6 shadow-soft backdrop-blur"
        >
          <h2 className="font-heading text-2xl font-bold text-text">Create account</h2>
          <p className="mt-1 text-sm text-text-muted">Start reporting responsibly in minutes.</p>
          <div className="mt-6">
            <RegisterForm onRegistered={handleRegistered} />
          </div>
        </motion.div>
      </section>

      <AnimatePresence>
        {verificationOverlay ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-success/30 bg-surface p-6 text-center shadow-soft"
            >
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-heading text-2xl font-bold text-text">Account Created</h3>
              <p className="mt-2 text-sm text-text-muted">
                Please verify your email to unlock all reporting features.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold text-secondary">
                <MailCheck size={14} /> Verification link sent
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PageTransition>
  );
};

export default RegisterPage;

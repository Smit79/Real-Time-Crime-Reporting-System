import { motion } from 'framer-motion';
import { useEffect } from 'react';

import LoginForm from '../../components/auth/LoginForm';
import PageTransition from '../../components/common/PageTransition';
import useCountUp from '../../hooks/useCountUp';

const LoginPage = () => {
  const liveReports = useCountUp({ end: 1248, duration: 1200 });
  const activeAlerts = useCountUp({ end: 84, duration: 1400 });

  useEffect(() => {
    document.title = 'Login | CrimeWatch';
  }, []);

  return (
    <PageTransition className="grid min-h-screen bg-auth-pattern lg:grid-cols-5">
      <section className="relative overflow-hidden px-6 py-10 lg:col-span-3 lg:px-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(30,64,175,0.32),transparent_36%),radial-gradient(circle_at_80%_30%,rgba(15,118,110,0.24),transparent_35%)]"
        />
        <motion.div
          className="absolute -right-20 -top-10 h-[620px] w-[620px] rounded-full border border-primary/20"
          animate={{ x: [-24, 0, -24], y: [-10, 10, -10], scale: [1, 1.04, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -left-24 bottom-[-220px] h-[560px] w-[560px] rounded-full border border-secondary/20"
          animate={{ x: [0, 30, 0], y: [12, -12, 12], scale: [1.03, 1, 1.03] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundImage:
              'linear-gradient(rgba(30,64,175,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(30,64,175,0.12) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 max-w-xl">
          <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Real-time citizen safety network
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-tight text-text sm:text-5xl">
            Stay Safe. Report Crime. Save Lives.
          </h1>
          <p className="mt-4 max-w-lg text-base text-text-muted sm:text-lg">
            Collaborate with your city in real-time. Verified crime intelligence, instant alerts, and faster response.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
              className="rounded-2xl border border-border bg-surface/70 p-5 backdrop-blur"
            >
              <p className="text-sm text-text-muted">Live reports tracked</p>
              <p className="mt-2 text-3xl font-bold text-primary">{liveReports}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.35 }}
              className="rounded-2xl border border-border bg-surface/70 p-5 backdrop-blur"
            >
              <p className="text-sm text-text-muted">Active alerts</p>
              <p className="mt-2 text-3xl font-bold text-danger">{activeAlerts}</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 lg:col-span-2 lg:px-10">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md rounded-3xl border border-border bg-surface/90 p-6 shadow-soft backdrop-blur"
        >
          <h2 className="font-heading text-2xl font-bold text-text">Welcome back</h2>
          <p className="mt-1 text-sm text-text-muted">Sign in to access your dashboard.</p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </motion.div>
      </section>
    </PageTransition>
  );
};

export default LoginPage;

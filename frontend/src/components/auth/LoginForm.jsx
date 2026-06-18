import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';
import { ROLE_HOME } from '../../utils/constants';
import { loginSchema } from '../../utils/validators';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState('idle');

  const defaultValues = useMemo(
    () => ({ email: '', password: '', rememberMe: true }),
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues,
    mode: 'onChange',
  });

  const onSubmit = async (values) => {
    setSubmitState('loading');
    try {
      const response = await login(values);
      setSubmitState('success');
      const role = response?.data?.user?.role;
      setTimeout(() => {
        navigate(ROLE_HOME[role] || '/home', { replace: true });
      }, 350);
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Unable to sign in right now.';
      toast.error(message);
      setSubmitState('idle');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <div className="relative">
          <Mail size={16} className="pointer-events-none absolute left-3 top-[15px] text-text-muted" />
          <input
            id="email"
            type="email"
            className="input-field pl-9"
            placeholder="Enter your email"
            {...register('email')}
            aria-label="Email"
          />
        </div>
        {errors.email ? <p className="error-text">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute left-3 top-[15px] text-text-muted" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="input-field pl-9 pr-10"
            placeholder="Enter your password"
            {...register('password')}
            aria-label="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-3 text-text-muted"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password ? <p className="error-text">{errors.password.message}</p> : null}
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-text-muted">
        <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('rememberMe')} />
        Remember me
      </label>

      <button
        type="submit"
        disabled={isLoading || submitState === 'loading'}
        className="btn-primary w-full"
        aria-label="Login to account"
      >
        <AnimatePresence mode="wait" initial={false}>
          {submitState === 'success' ? (
            <motion.span
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="inline-flex items-center gap-2"
            >
              <span>Success</span>
              <span aria-hidden="true">✓</span>
            </motion.span>
          ) : submitState === 'loading' || isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="inline-flex items-center gap-2"
            >
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Signing in...</span>
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              Login
            </motion.span>
          )}
        </AnimatePresence>
      </button>



      <div className="flex items-center justify-between text-sm">
        <Link to="/forgot-password" className="font-medium text-primary hover:underline">
          Forgot password?
        </Link>
        <Link to="/register" className="font-medium text-secondary hover:underline">
          Create account
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;

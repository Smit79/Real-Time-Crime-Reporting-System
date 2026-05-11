import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Phone, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';
import { ROLE_HOME } from '../../utils/constants';
import { registerSchema } from '../../utils/validators';

const getPasswordStrength = (password) => {
  if (!password) return { label: 'Weak', score: 10, color: 'bg-danger' };

  let score = 0;
  if (password.length >= 8) score += 30;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;

  if (score >= 75) return { label: 'Strong', score, color: 'bg-success' };
  if (score >= 45) return { label: 'Medium', score, color: 'bg-warning' };
  return { label: 'Weak', score, color: 'bg-danger' };
};

const RegisterForm = ({ onRegistered }) => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitState, setSubmitState] = useState('idle');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: useMemo(
      () => ({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' }),
      []
    ),
    mode: 'onChange',
  });

  const passwordValue = watch('password');
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (values) => {
    setSubmitState('loading');
    try {
      const response = await registerUser({ ...values, role: 'citizen' });
      setSubmitState('success');
      onRegistered?.(response);
      const role = response?.data?.user?.role;
      setTimeout(() => {
        navigate(ROLE_HOME[role] || '/home', { replace: true });
      }, 1600);
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Unable to create account right now.';
      toast.error(message);
      setSubmitState('idle');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="fullName" className="label">
          Full name
        </label>
        <div className="relative">
          <User size={16} className="pointer-events-none absolute left-3 top-[15px] text-text-muted" />
          <input
            id="fullName"
            className="input-field pl-9"
            placeholder="Enter your full name"
            {...register('fullName')}
            aria-label="Full name"
          />
        </div>
        {errors.fullName ? <p className="error-text">{errors.fullName.message}</p> : null}
      </div>

      <div>
        <label htmlFor="email" className="label">
          Email
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
        <label htmlFor="phone" className="label">
          Phone
        </label>
        <div className="relative">
          <Phone size={16} className="pointer-events-none absolute left-3 top-[15px] text-text-muted" />
          <input
            id="phone"
            className="input-field pl-9"
            placeholder="Enter your phone number"
            {...register('phone')}
            aria-label="Phone number"
          />
        </div>
        {errors.phone ? <p className="error-text">{errors.phone.message}</p> : null}
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="input-field pr-10"
            placeholder="Create a password"
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
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className={`h-full transition-all ${strength.color}`} style={{ width: `${strength.score}%` }} />
        </div>
        <p className="mt-1 text-xs text-text-muted">Strength: {strength.label}</p>
        {errors.password ? <p className="error-text">{errors.password.message}</p> : null}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label">
          Confirm password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            className="input-field pr-10"
            placeholder="Re-enter your password"
            {...register('confirmPassword')}
            aria-label="Confirm password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="absolute right-3 top-3 text-text-muted"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword ? <p className="error-text">{errors.confirmPassword.message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isLoading || submitState === 'loading'}
        className="btn-primary w-full"
        aria-label="Create account"
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
              <span>Registered</span>
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
              <span>Creating account...</span>
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              Create account
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;

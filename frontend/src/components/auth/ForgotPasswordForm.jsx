import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { forgotPassword } from '../../api/authApi';
import { forgotPasswordSchema } from '../../utils/validators';

const ForgotPasswordForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onChange',
  });

  const onSubmit = async (values) => {
    const response = await forgotPassword(values);
    toast.success(response.message || 'If the email exists, reset instructions have been sent.');
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-1 block text-sm font-medium text-text" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <Mail size={16} className="pointer-events-none absolute left-3 top-3 text-text-muted" />
          <input
            id="email"
            type="email"
            className="input-field pl-9"
            placeholder="you@example.com"
            {...register('email')}
            aria-label="Email"
          />
        </div>
        {errors.email ? <p className="error-text">{errors.email.message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
        aria-label="Send password reset link"
      >
        {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
      </button>

      <p className="text-center text-sm text-text-muted">
        Remembered your password?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;

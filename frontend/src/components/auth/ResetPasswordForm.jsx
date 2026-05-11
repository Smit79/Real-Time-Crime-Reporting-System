import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

import { resetPassword } from '../../api/authApi';
import { resetPasswordSchema } from '../../utils/validators';

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const onSubmit = async (values) => {
    if (!token) {
      toast.error('Reset token is missing');
      return;
    }

    const response = await resetPassword(token, { password: values.password });
    toast.success(response?.message || 'Password reset successful');
    navigate('/login', { replace: true });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="label" htmlFor="password">
          New password
        </label>
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute left-3 top-3 text-text-muted" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="input-field pl-9 pr-10"
            placeholder="Enter new password"
            {...register('password')}
            aria-label="New password"
          />
          <button
            type="button"
            className="absolute right-3 top-3 text-text-muted"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password ? <p className="error-text">{errors.password.message}</p> : null}
      </div>

      <div>
        <label className="label" htmlFor="confirmPassword">
          Confirm password
        </label>
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute left-3 top-3 text-text-muted" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            className="input-field pl-9 pr-10"
            placeholder="Confirm new password"
            {...register('confirmPassword')}
            aria-label="Confirm new password"
          />
          <button
            type="button"
            className="absolute right-3 top-3 text-text-muted"
            onClick={() => setShowConfirmPassword((value) => !value)}
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword ? <p className="error-text">{errors.confirmPassword.message}</p> : null}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full" aria-label="Reset password">
        {isSubmitting ? 'Resetting password...' : 'Reset password'}
      </button>
    </form>
  );
};

export default ResetPasswordForm;

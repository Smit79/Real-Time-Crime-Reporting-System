import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from 'next-themes';
import { LocateFixed, Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { updatePassword } from '../../api/authApi';
import { getSubscriptions } from '../../api/alertApi';
import { getMyReports, getProfile, updateProfile, updateLocation, deleteAccount } from '../../api/userApi';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageTransition from '../../components/common/PageTransition';
import useGeolocation from '../../hooks/useGeolocation';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your new password'),
  })
  .superRefine((values, context) => {
    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

const ProfilePage = () => {
  const { setTheme } = useTheme();
  const setStoredTheme = useThemeStore((state) => state.setTheme);
  const logout = useAuthStore((state) => state.logout);

  const { latitude, longitude, getCurrentPosition } = useGeolocation();
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const [locationUpdating, setLocationUpdating] = useState(false);

  const [profile, setProfile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ reports: 0, alerts: 0 });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', phone: '' },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isChangingPassword },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    document.title = 'Profile | CrimeWatch';
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileResponse, reportsResponse, alertsResponse] = await Promise.all([
        getProfile(),
        getMyReports({ page: 1, limit: 1 }),
        getSubscriptions({ page: 1, limit: 1 }),
      ]);

      const user = profileResponse?.data?.user || null;
      setProfile(user);
      setAvatarPreview(user?.avatar || '');

      setValue('fullName', user?.fullName || '');
      setValue('phone', user?.phone || '');

      setStats({
        reports: reportsResponse?.data?.pagination?.total || 0,
        alerts: alertsResponse?.data?.pagination?.total || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile().catch(() => {});
  }, []);

  useEffect(() => {
    if (!hasCoordinates) return;
    if (!locationUpdating) return;

    updateLocation({ latitude, longitude })
      .then(() => {
        setProfile((current) => {
          if (!current) return current;
          return {
            ...current,
            location: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
          };
        });
      })
      .finally(() => {
        setLocationUpdating(false);
      });
  }, [hasCoordinates, latitude, longitude, locationUpdating]);

  const onProfileSubmit = async (values) => {
    const formData = new FormData();
    formData.append('fullName', values.fullName);
    formData.append('phone', values.phone || '');
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const response = await updateProfile(formData);
    const user = response?.data?.user;
    setProfile(user);
    setAvatarFile(null);
  };

  const onChangePassword = async (values) => {
    await updatePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    resetPasswordForm();
  };

  const onDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      await logout();
      setDeleteModalOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const locationText = useMemo(() => {
    const coords = profile?.location?.coordinates;
    if (!coords || coords.length !== 2) return 'Location not updated yet';
    if (Number(coords[0]) === 0 && Number(coords[1]) === 0) return 'Location not updated yet';
    return `Lat ${coords[1]?.toFixed?.(4) || coords[1]}, Lng ${coords[0]?.toFixed?.(4) || coords[0]}`;
  }, [profile?.location?.coordinates]);

  return (
    <PageTransition className="space-y-6">
      <h1 className="font-heading text-3xl font-bold text-text">Profile</h1>
      {loading ? <LoadingSpinner label="Loading profile" /> : null}

      {!loading && profile ? (
        <>
          <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <h2 className="font-heading text-xl font-bold text-text">Personal Information</h2>

              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full border border-border bg-slate-100 dark:bg-slate-800">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile avatar" className="h-full w-full object-cover" />
                  ) : null}
                </div>

                <label className="btn-surface inline-flex cursor-pointer items-center gap-1" aria-label="Upload avatar">
                  <UploadCloud size={14} /> Upload avatar
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>

              <div>
                <label className="label">Full name</label>
                <input className="input-field" {...register('fullName')} aria-label="Full name" />
                {errors.fullName ? <p className="error-text">{errors.fullName.message}</p> : null}
              </div>

              <div>
                <label className="label">Phone</label>
                <input className="input-field" {...register('phone')} aria-label="Phone number" />
              </div>

              <button type="submit" className="btn-primary" disabled={isSubmitting} aria-label="Save profile changes">
                {isSubmitting ? 'Saving...' : 'Save profile'}
              </button>
            </form>

            <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <h2 className="font-heading text-xl font-bold text-text">Account Stats</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-text-muted">Reports submitted</p>
                  <p className="mt-1 text-2xl font-bold text-primary">{stats.reports}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-text-muted">Alerts active</p>
                  <p className="mt-1 text-2xl font-bold text-secondary">{stats.alerts}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3">
                <p className="text-xs text-text-muted">Current location</p>
                <p className="mt-1 text-sm text-text">{locationText}</p>
                <button
                  type="button"
                  className="btn-surface mt-2 inline-flex items-center gap-1"
                  onClick={() => {
                    setLocationUpdating(true);
                    getCurrentPosition();
                  }}
                  disabled={locationUpdating}
                  aria-label="Update my location"
                >
                  <LocateFixed size={14} /> {locationUpdating ? 'Updating...' : 'Update location'}
                </button>
              </div>

              <div className="rounded-xl border border-border p-3">
                <p className="mb-2 text-xs text-text-muted">Theme preference</p>
                <div className="flex items-center gap-2">
                  {['light', 'dark', 'system'].map((themeName) => (
                    <button
                      key={themeName}
                      type="button"
                      className="btn-surface capitalize"
                      onClick={() => {
                        setTheme(themeName);
                        setStoredTheme(themeName);
                      }}
                      aria-label={`Set ${themeName} theme`}
                    >
                      {themeName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <h2 className="font-heading text-xl font-bold text-text">Change Password</h2>
            <form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={handlePasswordSubmit(onChangePassword)}>
              <div>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Current password"
                  {...registerPassword('currentPassword')}
                  aria-label="Current password"
                />
                {passwordErrors.currentPassword ? <p className="error-text">{passwordErrors.currentPassword.message}</p> : null}
              </div>
              <div>
                <input
                  type="password"
                  className="input-field"
                  placeholder="New password"
                  {...registerPassword('newPassword')}
                  aria-label="New password"
                />
                {passwordErrors.newPassword ? <p className="error-text">{passwordErrors.newPassword.message}</p> : null}
              </div>
              <div>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Confirm new password"
                  {...registerPassword('confirmPassword')}
                  aria-label="Confirm new password"
                />
                {passwordErrors.confirmPassword ? <p className="error-text">{passwordErrors.confirmPassword.message}</p> : null}
              </div>
              <button type="submit" className="btn-primary md:col-span-3" disabled={isChangingPassword} aria-label="Update password">
                {isChangingPassword ? 'Updating password...' : 'Update password'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-danger/40 bg-danger/5 p-5 shadow-soft">
            <h2 className="font-heading text-xl font-bold text-danger">Danger Zone</h2>
            <p className="mt-1 text-sm text-text-muted">Deleting your account will deactivate access and sign you out.</p>
            <button
              type="button"
              className="btn-danger mt-3 inline-flex items-center gap-1"
              onClick={() => setDeleteModalOpen(true)}
              aria-label="Delete account"
            >
              <Trash2 size={14} /> Delete account
            </button>
          </section>
        </>
      ) : null}

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete account"
        message="Are you sure you want to deactivate your account? This will sign you out immediately."
        confirmText="Delete account"
        confirmLoading={deleteLoading}
        onConfirm={onDeleteAccount}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </PageTransition>
  );
};

export default ProfilePage;

import useAuthStore from '../store/authStore';

const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initialized = useAuthStore((state) => state.initialized);

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const hydrateUser = useAuthStore((state) => state.hydrateUser);
  const updateUser = useAuthStore((state) => state.updateUser);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    initialized,
    login,
    register,
    logout,
    refreshToken,
    hydrateUser,
    updateUser,
  };
};

export default useAuth;

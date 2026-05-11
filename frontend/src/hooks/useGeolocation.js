import { useCallback, useState } from 'react';

const initialLocation = {
  loading: false,
  latitude: null,
  longitude: null,
  error: null,
};

const useGeolocation = () => {
  const [state, setState] = useState(initialLocation);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'Geolocation is not supported in this browser.' }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
        });
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || 'Unable to fetch your location.',
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return { ...state, getCurrentPosition };
};

export default useGeolocation;

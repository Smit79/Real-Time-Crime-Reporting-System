import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { useTheme } from 'next-themes';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

import App from './App.jsx';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';
import useThemeStore from './store/themeStore';

const ThemeInitializer = () => {
  const { setTheme } = useTheme();
  const savedTheme = useThemeStore((state) => state.theme);

  useEffect(() => {
    if (savedTheme) setTheme(savedTheme);
  }, [savedTheme, setTheme]);

  return null;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <ThemeInitializer />
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
            },
          }}
        />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);

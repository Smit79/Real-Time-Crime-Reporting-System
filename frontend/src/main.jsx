import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { useTheme } from 'next-themes';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

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

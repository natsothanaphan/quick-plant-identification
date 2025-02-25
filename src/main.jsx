import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

const themeMode = import.meta.env.VITE_THEME_MODE;
if (themeMode === "light") {
  document.documentElement.setAttribute("theme-mode", "light");
} else if (themeMode === "dark") {
  document.documentElement.setAttribute("theme-mode", "dark");
} else {
  document.documentElement.removeAttribute("theme-mode");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

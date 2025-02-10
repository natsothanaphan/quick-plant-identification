import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Set your theme mode: "system", "dark", or "light"
const themeMode = "system"; // change this value as needed

if (themeMode === "light") {
  // Explicitly force light mode by setting data-theme to "light"
  document.documentElement.setAttribute("data-theme", "light");
} else if (themeMode === "dark") {
  // Force dark mode by setting data-theme to "dark"
  // This prevents the media query from applying light mode overrides.
  document.documentElement.setAttribute("data-theme", "dark");
} else {
  // Use system mode: remove the attribute so that the browser's
  // prefers-color-scheme rule in your CSS takes over.
  document.documentElement.removeAttribute("data-theme");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

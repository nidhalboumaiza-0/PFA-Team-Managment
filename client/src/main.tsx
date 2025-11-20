// Initialize dark mode based on user preference or system preference
if (
  localStorage.getItem("darkMode") === "true" ||
  (!localStorage.getItem("darkMode") &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ModalProvider } from "./context/ModalContext";
import { SnackbarProvider } from "./context/SnackbarContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ModalProvider>
          <SnackbarProvider>
            <App />
          </SnackbarProvider>
        </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

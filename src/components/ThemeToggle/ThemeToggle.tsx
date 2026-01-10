// src/styles/ThemeToggle.tsx
import React from "react";
import { useTheme } from "../../styles/StyleWrapper";
import { lightTheme, darkTheme } from "../../styles/themes";

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme.name === "dark";

  const handleToggle = () => {
    // Important: pass a *full* Theme so StyleWrapper replaces it
    setTheme(isDark ? lightTheme : darkTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Toggle color mode"
      style={{
        cursor: "pointer",
        border: "none",
        borderRadius: "9999px",
        padding: "0.35rem 0.75rem",
        fontSize: "0.875rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        background: "var(--surface, #ffffff)",
        color: "var(--text)",
        boxShadow: "var(--shadow-low)",
        transition: "background var(--transition-fast), transform var(--transition-fast)",
      }}
    >
      <span
        style={{
          width: "1.1rem",
          height: "1.1rem",
          borderRadius: "9999px",
          background: isDark ? "var(--primary)" : "var(--warning)",
          display: "inline-block",
        }}
      />
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
};

export default ThemeToggle;

// /opt/dash/gatsby-dash/src/styles/themes.ts
// Lightweight design tokens for a ThemeProvider (styled-components / emotion / custom)
import { metricStatus } from "../types/alerts";

export function statusToColor(status: metricStatus) {
  switch (status) {
    case "ok":
        return "var(--ok, #53c937";
    case "stale": 
        return "var(--stale, #969696";
    case "info":
        return "var(--info, #2563eb";
    case "critical":
      return "var(--critical, #f15e53)";
    case "warning":
      return "var(--warning, #f6bc1b)";
    case "info":
      return "var(--info, #2563eb)";
    default:
      return "var(--critical, #f15e53)";
  }
}

export type Theme = {
    name: "light" | "dark";
    colors: {
        background: string;
        surface: string;
        tile: string;
        text: string;
        textDim: string;
        muted: string;
        border: string;
        primary: string;
        primaryHover: string;
        secondary: string;
        accent: string;
        ok: string;
        stale: string;
        info: string;
        warning: string;
        critical: string;
        link: string;
        codeBg: string;
    };
    typography: {
        fontFamily: string;
        fontSize: string; // base
        lineHeight: string;
        sizes: {
            xs: string;
            sm: string;
            md: string;
            lg: string;
            xl: string;
        };
        weights: {
            regular: number;
            medium: number;
            bold: number;
        };
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    radii: {
        sm: string;
        md: string;
        lg: string;
        round: string;
    };
    shadows: {
        low: string;
        medium: string;
        high: string;
    };
    transitions: {
        fast: string;
        base: string;
    };
    breakpoints: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
};

export const lightTheme: Theme = {
    name: "light",
    colors: {
        background: "#f7fafc", // page background
        surface: "#ffffff", // cards, panels
        text: "#0f1724",
        textDim: "#475569",
        muted: "#6b7280",
        border: "#e6eef6",
        primary: "#2563eb", // blue-600
        primaryHover: "#1e4bb8",
        secondary: "#7c3aed", // purple-600
        accent: "#06b6d4", // cyan-500
        ok: "#53c937",
        stale: "#969696ff",
        info: "#2563eb",
        warning: "#f6bc1b",
        critical: "#f15e53",
        link: "#1d4ed8",
        codeBg: "#f1f5f9",
    },
    typography: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
        fontSize: "16px",
        lineHeight: "1.5",
        sizes: {
            xs: "12px",
            sm: "14px",
            md: "16px",
            lg: "20px",
            xl: "24px",
        },
        weights: {
            regular: 400,
            medium: 500,
            bold: 700,
        },
    },
    spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
    },
    radii: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        round: "9999px",
    },
    shadows: {
        low: "0 1px 2px rgba(16,24,40,0.05)",
        medium: "0 6px 18px rgba(15,23,42,0.08)",
        high: "0 20px 40px rgba(2,6,23,0.2)",
    },
    transitions: {
        fast: "150ms ease",
        base: "250ms cubic-bezier(.4,0,.2,1)",
    },
    breakpoints: {
        sm: "480px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
    },
};

export const darkTheme: Theme = {
    name: "dark",
    colors: {
        background: "#071025", // dark page background
        surface: "#0b1220", // default tile background
        text: "#e6eef8",
        textDim: "#9aa6b2",
        muted: "#94a3b8",
        border: "#172033",
        primary: "#60a5fa", // blue-400
        primaryHover: "#3b82f6",
        secondary: "#a78bfa", // purple-300
        accent: "#22d3ee", // cyan-400
        ok: "#53c937",
        stale: "#969696ff",
        info: "#3b82f6",
        warning: "#f6bc1b",
        critical: "#f15e53",
        link: "#93c5fd",
        codeBg: "#071429",
    },
    typography: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
        fontSize: "16px",
        lineHeight: "1.5",
        sizes: {
            xs: "12px",
            sm: "14px",
            md: "16px",
            lg: "20px",
            xl: "24px",
        },
        weights: {
            regular: 400,
            medium: 500,
            bold: 700,
        },
    },
    spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
    },
    radii: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        round: "9999px",
    },
    shadows: {
        low: "0 1px 2px rgba(2,6,23,0.6)",
        medium: "0 6px 18px rgba(2,6,23,0.6)",
        high: "0 20px 40px rgba(2,6,23,0.8)",
    },
    transitions: {
        fast: "150ms ease",
        base: "250ms cubic-bezier(.4,0,.2,1)",
    },
    breakpoints: {
        sm: "480px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
    },
};
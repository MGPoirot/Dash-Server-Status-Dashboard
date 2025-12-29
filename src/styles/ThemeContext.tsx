import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type ThemeName = "light" | "dark";

type Theme = {
    colors: {
        background: string;
        surface: string;
        text: string;
        primary: string;
        secondary: string;
        border: string;
        muted: string;
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
    };
    // add other theme tokens as needed
};

export const lightTheme: Theme = {
    colors: {
        background: "#ffffff",
        surface: "#f7f7f8",
        text: "#0b0b0b",
        primary: "#0d6efd",
        secondary: "#6c757d",
        border: "#e6e6e6",
        muted: "#9aa0a6",
    },
    spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px" },
};

export const darkTheme: Theme = {
    colors: {
        background: "#0b1220",
        surface: "#0f1724",
        text: "#e6eef8",
        primary: "#5b9dff",
        secondary: "#9aa6b2",
        border: "#1f2937",
        muted: "#6b7280",
    },
    spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px" },
};

type ThemeContextType = {
    themeName: ThemeName;
    theme: Theme;
    toggleTheme: () => void;
    setThemeName: (name: ThemeName) => void;
};

const defaultContext: ThemeContextType = {
    themeName: "light",
    theme: lightTheme,
    toggleTheme: () => {},
    setThemeName: () => {},
};

export const ThemeContext = createContext<ThemeContextType>(defaultContext);

function getInitialTheme(): ThemeName {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    const prefersDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [themeName, setThemeNameState] = useState<ThemeName>(getInitialTheme);

    // helper to centrally set theme name and persist + set attribute
    const setThemeName = (name: ThemeName) => {
        setThemeNameState(name);
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem("theme", name);
            } catch {}
            document.documentElement.setAttribute("data-theme", name);
        }
    };

    useEffect(() => {
        // ensure HTML attribute is set after mount (useful for SSR)
        if (typeof window !== "undefined") {
            document.documentElement.setAttribute("data-theme", themeName);
        }
    }, [themeName]);

    const toggleTheme = () => setThemeName(themeName === "light" ? "dark" : "light");

    const theme = themeName === "light" ? lightTheme : darkTheme;

    return (
        <ThemeContext.Provider value={{ themeName, theme, toggleTheme, setThemeName }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
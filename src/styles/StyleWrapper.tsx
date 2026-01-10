// /src/styles/StyleWrapper.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ThemeProvider } from "styled-components";
import { GlobalStyle } from "./GlobalStyle";
import { Theme, lightTheme, darkTheme } from "./themes";
import { getCookie, setCookie } from "../methods/useCookies";

type SetTheme =
  | ((next: Partial<Theme> | ((prev: Theme) => Partial<Theme>)) => void)
  | ((next: Theme) => void);

type ThemeContextValue = {
  theme: Theme;
  setTheme: SetTheme;
};

const defaultTheme: Theme = lightTheme;

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  setTheme: () => {
    /* noop */
  },
});

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);

/**
 * Resolve initial theme:
 * 1. explicit initialTheme prop
 * 2. cookie "theme" (light | dark)
 * 3. system prefers-color-scheme
 * 4. fallback: light
 */
const getInitialTheme = (initialTheme?: Theme): Theme => {
  if (initialTheme) return initialTheme;

  // 1) cookie override
  const stored = getCookie("theme");
  if (stored === "dark") return darkTheme;
  if (stored === "light") return lightTheme;

  // 2) system preference (only in browser)
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
  ) {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (prefersDark) return darkTheme;
  }

  // 3) fallback
  return lightTheme;
};

export const StyleWrapper: React.FC<{
  initialTheme?: Theme;
  children?: ReactNode;
}> = ({ initialTheme, children }) => {
  const [theme, setThemeState] = useState<Theme>(() =>
    getInitialTheme(initialTheme)
  );

  const setTheme: SetTheme = (next: any) => {
    if (typeof next === "function") {
      // function gets previous theme, returns a *partial* theme
      setThemeState((prev) => {
        const result = (next as (prev: Theme) => Partial<Theme>)(prev);
        return { ...prev, ...result };
      });
    } else if (isFullTheme(next)) {
      // replace entirely if a full Theme is provided
      setThemeState(next as Theme);
    } else {
      // shallow-merge partial theme (top-level)
      setThemeState((prev) => ({ ...prev, ...(next as Partial<Theme>) }));
    }
  };

  // Persist theme name in a cookie on the client
  useEffect(() => {
    // will no-op on server because setCookie checks typeof document
    setCookie("theme", theme.name);
  }, [theme.name]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        {children ?? null}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

// Helper to heuristically detect if object is a full Theme
function isFullTheme(obj: any): obj is Theme {
  return (
    obj &&
    typeof obj === "object" &&
    "colors" in obj &&
    "typography" in obj &&
    "spacing" in obj
  );
}

// Higher-order component to inject theme as a prop
export function withTheme<P extends { theme?: Theme }>(
  Component: React.ComponentType<P>
) {
  const Wrapped: React.FC<Omit<P, "theme">> = (props) => {
    const { theme } = useTheme();
    return <Component {...(props as P)} theme={theme} />;
  };
  const name = Component.displayName || Component.name || "Component";
  Wrapped.displayName = `withTheme(${name})`;
  return Wrapped;
}

export default StyleWrapper;

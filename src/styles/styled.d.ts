import 'styled-components';

// /opt/dash/gatsby-dash/src/styles/styled.d.ts

type LightTheme = typeof import('./themes').lightTheme;
type DarkTheme = typeof import('./themes').darkTheme;

/**
 * Use an intersection so DefaultTheme contains all keys from both
 * lightTheme and darkTheme. If both themes share the same shape
 * this will effectively be that shape; if they differ you'll get
 * the union of keys (safe for typed access).
 */
type AppTheme = LightTheme & DarkTheme;

declare module 'styled-components' {
    // wired DefaultTheme used by styled-components' ThemeProvider and styled() helpers
    export interface DefaultTheme extends AppTheme {}
}

// optional exports for convenience in TS code
export type { LightTheme, DarkTheme, AppTheme };
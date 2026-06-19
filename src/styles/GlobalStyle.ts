// src/styles/GlobalStyle.ts
import { createGlobalStyle } from "styled-components";
import type { Theme } from "./themes";

export const GlobalStyle = createGlobalStyle`
    :root {
        /* Colors */
        --bg: ${({ theme }) => theme.colors.background};
        --surface: ${({ theme }) => theme.colors.surface};
        --text: ${({ theme }) => theme.colors.text};
        --text-dim: ${({ theme }) => theme.colors.textDim};
        --muted: ${({ theme }) => theme.colors.muted};
        --border: ${({ theme }) => theme.colors.border};
        --primary: ${({ theme }) => theme.colors.primary};
        --primary-hover: ${({ theme }) => theme.colors.primaryHover};
        --secondary: ${({ theme }) => theme.colors.secondary};
        --accent: ${({ theme }) => theme.colors.accent};
        --ok: ${({ theme }) => theme.colors.ok};
        --stale: ${({ theme }) => theme.colors.stale};
        --info: ${({ theme }) => theme.colors.info};
        --warning: ${({ theme }) => theme.colors.warning};
        --critical: ${({ theme }) => theme.colors.critical};
        --link: ${({ theme }) => theme.colors.link};
        --code-bg: ${({ theme }) => theme.colors.codeBg};

        /* Typography */
        --font-sans: ${({ theme }) => theme.typography.fontFamily};
        --font-size-base: ${({ theme }) => theme.typography.fontSize};
        --line-height-base: ${({ theme }) => theme.typography.lineHeight};
        --font-size-xs: ${({ theme }) => theme.typography.sizes.xs};
        --font-size-sm: ${({ theme }) => theme.typography.sizes.sm};
        --font-size-md: ${({ theme }) => theme.typography.sizes.md};
        --font-size-lg: ${({ theme }) => theme.typography.sizes.lg};
        --font-size-xl: ${({ theme }) => theme.typography.sizes.xl};
        --font-weight-regular: ${({ theme }) => theme.typography.weights.regular};
        --font-weight-medium: ${({ theme }) => theme.typography.weights.medium};
        --font-weight-bold: ${({ theme }) => theme.typography.weights.bold};

        /* Mono font – not in Theme, so keep a sane default */
        --font-mono: 'SFMono-Regular', Menlo, Monaco, "Roboto Mono", "Courier New", monospace;

        /* Spacing */
        --space-xs: ${({ theme }) => theme.spacing.xs};
        --space-sm: ${({ theme }) => theme.spacing.sm};
        --space-md: ${({ theme }) => theme.spacing.md};
        --space-lg: ${({ theme }) => theme.spacing.lg};
        --space-xl: ${({ theme }) => theme.spacing.xl};

        /* Radii */
        --radius-sm: ${({ theme }) => theme.radii.sm};
        --radius-md: ${({ theme }) => theme.radii.md};
        --radius-lg: ${({ theme }) => theme.radii.lg};
        --radius-round: ${({ theme }) => theme.radii.round};

        /* Shadows */
        --shadow-low: ${({ theme }) => theme.shadows.low};
        --shadow-medium: ${({ theme }) => theme.shadows.medium};
        --shadow-high: ${({ theme }) => theme.shadows.high};

        /* Transitions */
        --transition-fast: ${({ theme }) => theme.transitions.fast};
        --transition-base: ${({ theme }) => theme.transitions.base};

        /* Breakpoints */
        --bp-sm: ${({ theme }) => theme.breakpoints.sm};
        --bp-md: ${({ theme }) => theme.breakpoints.md};
        --bp-lg: ${({ theme }) => theme.breakpoints.lg};
        --bp-xl: ${({ theme }) => theme.breakpoints.xl};
    }

    *, *::before, *::after {
        box-sizing: border-box;
    }

    html, body, #___gatsby, #gatsby-focus-wrapper {
        height: 100%;
    }

    html {
        font-size: var(--font-size-base);
    }

    body {
        margin: 0;
        padding: 0;
        background: var(--bg);
        color: var(--text);
        font-family: var(--font-sans);
        line-height: var(--line-height-base);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    a {
        color: var(--link);
        text-decoration: none;
        transition: color var(--transition-fast);
    }

    a:hover {
        text-decoration: underline;
    }

    img, picture, video, canvas, svg {
        display: block;
        max-width: 100%;
    }

    input, button, textarea, select {
        font: inherit;
    }

    code, kbd, pre {
        font-family: var(--font-mono);
    }

    pre {
        overflow: auto;
        background: var(--code-bg);
    }
`;

export default GlobalStyle;

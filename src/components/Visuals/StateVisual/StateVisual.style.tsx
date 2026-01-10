// StateVisual.style.tsx
import styled, { keyframes, css } from "styled-components";
import type { Theme } from "../../../styles/themes";

// If token matches a theme color key (ok/warning/etc), return theme color.
// Otherwise assume it's already a valid CSS color string (hex/rgb/hsl/...).
function resolveColorToken(theme: Theme, token: string): string {
  const colors = theme.colors as Record<string, string>;
  return Object.prototype.hasOwnProperty.call(colors, token) ? colors[token] : token;
}

const bulbOn = keyframes`
  0% {
    opacity: 0.35;
    filter: brightness(0.9) saturate(0.95);
    box-shadow:
      inset 0 0 0 9999px color-mix(in srgb, var(--ink) 8%, transparent),
      inset 0 0 0 2px color-mix(in srgb, var(--ink) 45%, transparent),
      0 0 0 rgba(0,0,0,0);
  }
  55% {
    opacity: 1;
    filter: brightness(1.25) saturate(1.15);
    box-shadow:
      inset 0 0 0 9999px color-mix(in srgb, var(--ink) 45%, transparent),
      inset 0 0 0 2px var(--ink),
      0 10px 26px color-mix(in srgb, var(--ink) 22%, transparent);
  }
  100% {
    opacity: 1;
    filter: brightness(1.08) saturate(1.05);
    box-shadow:
      inset 0 0 0 9999px color-mix(in srgb, var(--ink) 50%, transparent),
      inset 0 0 0 2px var(--ink),
      0 10px 26px color-mix(in srgb, var(--ink) 16%, transparent);
  }
`;

export const Boxes = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 10px;
`;

export const StyledColorBox = styled.div<{
  $color: string;
  $active: boolean;
}>`
  --ink: ${({ theme, $color }) => resolveColorToken(theme as Theme, $color)};

  height: 60px;
  padding: 10px 12px;

  display: grid;
  place-items: center;

  position: relative;
  isolation: isolate;

  border-radius: ${({ theme }) => (theme as Theme).radii.md};
  font-size: ${({ theme }) => (theme as Theme).typography.sizes.sm};
  font-weight: ${({ theme, $active }) =>
    $active
      ? (theme as Theme).typography.weights.medium
      : (theme as Theme).typography.weights.regular};

  letter-spacing: 0.2px;

  color: ${({ $active, theme }) =>
    $active ? (theme as Theme).colors.text : (theme as Theme).colors.muted};

  background: ${({ theme }) =>
    (theme as Theme).colors.tile ?? (theme as Theme).colors.surface};

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  pointer-events: ${({ $active }) => ($active ? "auto" : "none")};
  cursor: ${({ $active }) => ($active ? "pointer" : "default")};

  transition:
    transform ${({ theme }) => (theme as Theme).transitions.fast},
    filter ${({ theme }) => (theme as Theme).transitions.fast},
    opacity ${({ theme }) => (theme as Theme).transitions.fast};

  opacity: ${({ $active }) => ($active ? 1 : 0.9)};
  filter: ${({ $active }) => ($active ? "brightness(1.02)" : "brightness(0.98)")};

  box-shadow: ${({ $active, theme }) =>
    $active
      ? `
        inset 0 0 0 9999px color-mix(in srgb, var(--ink) 50%, transparent),
        inset 0 0 0 2px var(--ink),
        0 10px 26px color-mix(in srgb, var(--ink) 16%, transparent);
      `
      : `
        inset 0 0 0 9999px color-mix(in srgb, var(--ink) 12%, transparent),
        inset 0 0 0 1px ${(theme as Theme).colors.border},
        ${(theme as Theme).shadows.medium};
      `};

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    opacity: ${({ $active }) => ($active ? 0.75 : 0.35)};
    background:
      radial-gradient(
        120% 80% at 20% 15%,
        color-mix(in srgb, var(--ink) 22%, transparent),
        transparent 55%
      ),
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.14),
        rgba(255, 255, 255, 0.02) 55%,
        transparent
      );
    mix-blend-mode: soft-light;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      animation: ${bulbOn}
        3s
        cubic-bezier(0.2, 0.9, 0.2, 1)
        both;
    `}
`;

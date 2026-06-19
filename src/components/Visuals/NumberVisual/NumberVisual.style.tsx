// NumberVisual.style.tsx
import styled, { DefaultTheme, keyframes } from "styled-components";

export const StyledRect = styled.rect`
  rx: var(--radius-md);
`;

export const Container = styled.div<{
  $chartBg: (theme: DefaultTheme) => string;
  $endOrigin: string;
  $endDelayMs: number;
}>`
  width: 200px;
  margin: auto;
  height: 214px;
  overflow: hidden;
  --chart-bg: ${({ theme, $chartBg }) => $chartBg(theme)};
  border-radius: 12px;
  /* end-dot animation target */
  .end-dot-pop {
    opacity: 0;
    transform-origin: ${({ $endOrigin }) => $endOrigin};
    animation: ${keyframes`
      from { opacity: 0; transform: scale(2); }
      to   { opacity: 1; transform: scale(1); }
    `} 180ms ease-out forwards;
    animation-delay: ${({ $endDelayMs }) => $endDelayMs}ms;
  }
`;

export const Svg = styled.svg`
  display: block;
  width: 100%;
  height: auto;
`;

export const XLabelText = styled.text`
  font-size: 9px;
  transform: translateY(-10px);
  fill: ${({ theme }) => theme?.colors?.textDim ?? "#374151"};
`;

export const ChartTextDim = styled.text`
  font-size: 12px;
  fill: #f7fafc;
  pointer-events: none;
`;

export const AlertBand = styled.rect<{ $fill: (theme: DefaultTheme) => string }>`
  fill: ${({ theme, $fill }) => $fill(theme)};
`;

const draw = keyframes`
  from { stroke-dashoffset: var(--path-len, 1); }
  to   { stroke-dashoffset: 0; }
`;

export const LinePath = styled.polyline<{ $stroke: (theme: DefaultTheme) => string }>`
  fill: none;
  stroke: ${({ theme, $stroke }) => $stroke(theme)};
  stroke-width: 2.75;
  stroke-linejoin: round;
  stroke-linecap: round;
  shape-rendering: geometricPrecision;

  stroke-dasharray: var(--path-len, 1);
  stroke-dashoffset: var(--path-len, 1);

  &.is-drawing {
    animation: ${draw} 700ms cubic-bezier(0.42, 0, 1, 1);
    animation-fill-mode: forwards;
  }
`;

export const EndDot = styled.circle<{ $fill: (theme: DefaultTheme) => string }>`
  fill: ${({ theme, $fill }) => $fill(theme)};
`;

export const EndDotText = styled.text`
  font-size: 14px;
  font-weight: 700;
  fill: #ffffff;
  pointer-events: none;

`;

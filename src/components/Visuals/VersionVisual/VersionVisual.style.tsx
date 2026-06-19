// VersionVisual.style.tsx
import styled, { keyframes } from "styled-components";
import { metricStatus } from "../../../types/alerts";
import { statusToThemeColor } from "../../../methods/utils";

/**
 * Fly in from above (reversed direction), while scaling to the FINAL per-item scale.
 * No "scale to 1 then jump" — scale is baked into keyframes via CSS variables.
 */
const flyIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-18px) scale(var(--scale-from));
  }
  70% {
    opacity: var(--alpha);
    transform: translateY(0px) scale(var(--scale-to-overshoot));
  }
  to {
    opacity: var(--alpha);
    transform: translateY(0px) scale(var(--scale-to));
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const Row = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 10px 0;
`;

export const DateBox = styled.div<{ $delayMs: number; $durMs: number }>`
  width: 140px;
  font-size: 0.92rem;
  opacity: 0;
  color: ${(p) => p.theme?.colors?.textDim ?? "rgba(0,0,0,0.65)"};

  animation: ${fadeIn} ${(p) => p.$durMs}ms ease-out forwards;
  animation-delay: ${(p) => p.$delayMs}ms;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const VersionBox = styled.div<{
  $status: metricStatus;
  $recencyIndex: number; // 0 newest
  $animIndex: number; // 0 oldest ... last newest
  $staggerMs: number;
  $durMs: number;
}>`
  height: 38px;
  min-width: 140px;
  padding: 0 12px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;
  font-weight: 700;
  letter-spacing: 0.2px;

  background: ${(p) => statusToThemeColor(p.theme, p.$status)};
  color: ${(p) => p.theme.colors.text ?? "#ffffff"};

  transform-origin: center;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.10);

  /* Final per-item scale/opacity: newest=1.0, older=0.9, 0.8, ... */
  --scale-to: ${(p) => Math.max(0.7, 1 - p.$recencyIndex * 0.1)};
  --alpha: ${(p) => Math.max(0.25, 1 - p.$recencyIndex * 0.25)};

  /* Start slightly smaller than target, overshoot slightly above target */
  --scale-from: calc(var(--scale-to) * 0.94);
  --scale-to-overshoot: calc(var(--scale-to) * 1.02);

  opacity: 0;
  transform: translateY(-18px) scale(var(--scale-from));

  animation: ${flyIn} ${(p) => p.$durMs}ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
  animation-delay: ${(p) => p.$animIndex * p.$staggerMs}ms;
`;

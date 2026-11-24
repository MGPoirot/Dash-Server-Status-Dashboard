// CounterVisual.style.tsx
import styled, { keyframes, css } from "styled-components";

const DIGIT_H = 62; // px
const DIGIT_W = 44; // px

export const Container = styled.div`
  width: 100%;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
   pointer-events: none;
`;

export const DigitsRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

export const DigitCell = styled.div`
  width: ${DIGIT_W}px;
  height: ${DIGIT_H}px;
  position: relative;
  border-radius: 10px;
  overflow: hidden;

  background: linear-gradient(
    to bottom,
    rgba(15, 23, 42, 0.92),
    rgba(2, 6, 23, 0.92)
  );
  border: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -10px 20px rgba(0, 0, 0, 0.35),
    0 1px 2px rgba(16, 24, 40, 0.06);

  &::before,
  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 50%;
    z-index: 2;
  }

  &::before {
    top: 0;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.06), transparent);
  }

  &::after {
    bottom: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.25), transparent);
  }
`;

export const DigitWindow = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: grid;
  place-items: center;
  z-index: 1;
`;

export const DigitReel = styled.div<{ $digit: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;

  transform: translateY(${(p) => -p.$digit * DIGIT_H}px);
  transition: transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1);
  will-change: transform;
`;

export const DigitGlyph = styled.div<{ $color: string }>`
  height: ${DIGIT_H}px;
  width: ${DIGIT_W}px;

  display: grid;
  place-items: center;

  font-variant-numeric: tabular-nums;
  font-family: ${({ theme }) => theme?.typography?.fontFamily ?? "system-ui"};
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0.5px;

  color: ${(p) => p.$color};

  text-shadow:
    0 1px 0 rgba(0, 0, 0, 0.5),
    0 0 10px rgba(0, 0, 0, 0.25);
`;

export const Divider = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: rgba(255, 255, 255, 0.10);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
  z-index: 3;
`;

const flyIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

export const InfoNote = styled.div<{
  $show: boolean;
  $tone: "info" | "warning" | "critical";
}>`
  margin-top: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: var(--font-size-sm);
  color: var(--text);
  border: 1px solid var(--border);
  line-height: 1.2;

  opacity: 0;
  transform: translateY(-10px) scale(0.94);

  ${({ $show }) =>
    $show &&
    css`
      opacity: 1;
      transform: translateY(0) scale(1);
      animation: ${flyIn} 320ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
    `}
`;

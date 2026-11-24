// GaugeVisual.style.tsx
import styled from "styled-components";

export const Container = styled.div`
  position: relative;
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 8px;
`;

export const Svg = styled.svg`
  width: 100%;
  max-width: 300px;
  height: auto;
`;

export const BaseArc = styled.path`
  fill: none;
  stroke: ${({ theme }) => theme?.colors?.border ?? "var(--border, #e6eef6)"};
  stroke-width: 14px;
  stroke-linecap: round;
`;

export const ArcPath = styled.path<{ $stroke: string }>`
  fill: none;
  stroke: ${(p) => p.$stroke};
  stroke-width: 14px;
  stroke-linecap: butt;
`;

export const Needle = styled.line`
  stroke: ${({ theme }) => theme?.colors?.text ?? "var(--text, #0f1724)"};
  stroke-width: 2px;
  stroke-linecap: round;
`;

export const NeedlePivot = styled.circle`
  fill: ${({ theme }) => theme?.colors?.surface ?? "var(--surface, #ffffff)"};
  stroke: ${({ theme }) => theme?.colors?.border ?? "var(--border, #e6eef6)"};
  stroke-width: 2px;
`;

export const ValueText = styled.div`
  position: absolute;
  line-height: 2em;
  bottom: ${({ theme }) => theme?.typography?.sizes?.xl ?? "24px"};
  font-size: ${({ theme }) => theme?.typography?.sizes?.xl ?? "24px"};
  font-weight: ${({ theme }) => theme?.typography?.weights?.medium ?? 500};
`;

export const RangeText = styled.div`
  position: absolute;
  bottom: 10px;
  font-size: ${({ theme }) => theme?.typography?.sizes?.sm ?? "14px"};
  color: ${({ theme }) => theme?.colors?.textDim ?? "#6b7280"};
`;

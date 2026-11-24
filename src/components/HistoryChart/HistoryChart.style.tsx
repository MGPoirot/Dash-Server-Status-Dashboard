import styled from "styled-components";

export const Wrap = styled.section`
  margin: 12px 0 28px;
`;

export const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(48px, max-content) minmax(0, 1fr);
  column-gap: 8px;
  align-items: stretch;
`;

export const OverviewRow = styled(Row)`
  margin-top: 16px;
`;

export const YAxis = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  max-width: 112px;
  padding: 2px 0;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  line-height: 1.2;
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

export const Plot = styled.div`
  position: relative;
  min-width: 0;
`;

export const MainSvg = styled.svg`
  display: block;
  width: 100%;
  height: 260px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
`;

export const OverviewSvg = styled.svg`
  display: block;
  width: 100%;
  height: 72px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
  touch-action: none;
  cursor: ew-resize;
  user-select: none;
`;

export const AxisLabels = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-variant-numeric: tabular-nums;

  span {
    min-width: 0;
  }

  span:last-child {
    text-align: right;
  }
`;

export const SelectionLabel = styled.div`
  margin-bottom: 4px;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-variant-numeric: tabular-nums;
  text-align: center;
`;

export const Tooltip = styled.div<{ $alignEnd: boolean; $below: boolean }>`
  position: absolute;
  z-index: 2;
  transform: translate(
    ${({ $alignEnd }) => ($alignEnd ? "calc(-100% - 8px)" : "8px")},
    ${({ $below }) => ($below ? "8px" : "-120%")}
  );
  padding: 6px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadows.low};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  line-height: 1.35;
  white-space: nowrap;
  pointer-events: none;

  strong {
    display: block;
    font-weight: ${({ theme }) => theme.typography.weights.bold};
  }
`;

export const Line = styled.polyline`
  fill: none;
  stroke: ${({ theme }) => theme.colors.text};
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
`;

export const OverviewLine = styled.polyline`
  fill: none;
  stroke: ${({ theme }) => theme.colors.text};
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke-linecap: round;
  opacity: 0.8;
  vector-effect: non-scaling-stroke;
`;

export const HoverGuide = styled.line`
  stroke: ${({ theme }) => theme.colors.textDim};
  stroke-width: 1;
  stroke-dasharray: 3 3;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
`;

export const HoverDot = styled.div`
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: ${({ theme }) => theme.colors.text};
  border: 2px solid ${({ theme }) => theme.colors.surface};
  pointer-events: none;
`;

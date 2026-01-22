// src/components/Tile/Tile.style.tsx
import styled, { css, keyframes } from "styled-components";
import { metricStatus } from "../../types/alerts";
import { Link } from "gatsby";
import { Theme } from "../../styles/themes";
import { statusToThemeColor } from "../../methods/utils";

export interface TileStyleProps {
  size?: "sm" | "md" | "lg";
  status?: metricStatus;
  clickable?: boolean;
  collapsed?: boolean;
}

/* size helpers */
const sizeMap = {
  sm: css`
    padding: 8px 12px;
    font-size: 0.85rem;
  `,
  md: css`
    padding: 12px 16px;
    font-size: 1rem;
  `,
  lg: css`
    padding: 16px 20px;
    font-size: 1.125rem;
  `,
};

/* status helpers */

const criticalPulse = keyframes`
    0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.00); }
   50% { box-shadow: 0 0 12px 6px rgba(239,68,68,0.3); }
  100% { box-shadow: 0 0 24px 12px rgba(239,68,68,0.00); }
`;

/* status helpers */
const statusMap = {
  ok: css`
    background: var(--surface, #ffffff);
    color: var(--text, #111827);
    border: 2px solid var(--ok, #53c937);
  `,
  stale: css`
    background: var(--surface, #ffffff);
    color: var(--stale, #969696ff);
    border: 2px solid var(--stale, #969696ff);
  `,
  info: css`
    background: var(--surface, #ffffff);
    color: var(--text, #111827);
    border: 2px solid var(--info, #197cb9ff);
  `,
  warning: css`
    background: var(--surface, #ffffff);
    color: var(--text, #111827);
    border: 2px solid var(--warning, #f6bc1b);

    box-shadow: 0 0 12px 6px rgba(239, 68, 68, 0.3);
  `,
  critical: css`
    background: var(--surface, #ffffff);
    color: var(--text, #111827);
    border: 2px solid var(--critical, #f15e53);

    animation: ${criticalPulse} 1.5s ease-in-out infinite;
    will-change: box-shadow;
  `,
};

export const TileLink = styled(Link)`
  text-decoration: none;
  color: inherit;

  &:hover,
  &:focus,
  &:active,
  &:visited {
    text-decoration: none;
    color: inherit;
  }
`;

export interface TileStyleProps {
  size?: "sm" | "md" | "lg";
  status?: metricStatus;
  clickable?: boolean;
  collapsed?: boolean;
}

export const TileWrapper = styled.div<TileStyleProps>`
  --state-color: ${({ theme, status }) =>
    statusToThemeColor(theme as Theme, status)};
  box-sizing: border-box;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
  transition: box-shadow 160ms ease, transform 160ms ease;

  display: flex;
  flex-direction: ${({ collapsed }) => (collapsed ? "row" : "column")};
  align-items: ${({ collapsed }) => (collapsed ? "center" : "stretch")};
  justify-content: ${({ collapsed }) => (collapsed ? "flex-start" : "flex-start")};
  gap: ${({ collapsed }) => (collapsed ? "10px" : "8px")};

  ${({ size = "md" }) => sizeMap[size]}
  ${({ status = "ok" }) => statusMap[status]}

  ${({ clickable = true, status = "ok" }) =>
    clickable &&
    css`
      cursor: pointer;

      &:hover {
        transform: scale(1.02);
        box-shadow:
          0 0 0 2px color-mix(in srgb, var(--state-color) 70%, transparent),
          0 0 14px 4px color-mix(in srgb, var(--state-color) 35%, transparent);
      }
      &:active {
        tansform: scale(1.02);
        box-shadow:
          0 0 0 2px var(--state-color),
          0 0 8px 2px var(--state-color);
      }
    `}
`;

/* Optional structural pieces for tiles */
export const TileHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 600;
`;

export const TileContent = styled.div`
  flex: 1 1 auto;
  min-height: 1px;
  line-height: 1.3;
`;

export const TileFooter = styled.footer`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  font-size: 0.9em;
`;

export const Title = styled.h2`
  margin: 0;
  font-size: 1rem;
  line-height: 1.2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Meta = styled.div`
  font-size: 0.85rem;
  opacity: 0.8;
`;

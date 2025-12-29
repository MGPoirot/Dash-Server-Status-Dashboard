import styled, { css } from "styled-components";

export interface TileStyleProps {
    size?: "sm" | "md" | "lg";
    variant?: "good" | "warning" | "danger";
    clickable?: boolean;
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

/* variant helpers */
const variantMap = {
    good: css`
        background: var(--surface, #ffffff);
        color: var(--text, #111827);
        border: 1px solid var(--good, #16a34a);
    `,
    warning: css`
        background: var(--surface, #ffffff);
        color: var(--text, #111827);
        border: 1px solid var(--warning, #f59e0b);
    `,
    danger: css`
        background: var(--surface, #ffffff);
        color: var(--text, #111827);
        border: 1px solid var(--danger, #ef4444);
    `,
};

export const TileWrapper = styled.div<TileStyleProps>`
    box-sizing: border-box;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    transition: box-shadow 160ms ease, transform 160ms ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
    ${({ size = "md" }) => sizeMap[size]}
    ${({ variant = "good" }) => variantMap[variant]}

    ${({ clickable }) =>
        clickable &&
        css`
            cursor: pointer;
            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 18px rgba(16, 24, 40, 0.08);
            }
            &:active {
                transform: translateY(0);
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


// export const TileWrapper = styled(Link)`
//   display: block;
//   border: 1px solid #ddd;
//   padding: 1rem;
//   border-radius: 4px;
//   text-decoration: none;
//   color: inherit;
// `;

export const Title = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
`;

export const Meta = styled.div`
  font-size: 0.85rem;
  opacity: 0.8;
`;

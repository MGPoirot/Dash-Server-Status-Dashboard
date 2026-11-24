import styled from "styled-components";


export const SectionHeaderButton = styled.button`
  max-width: 900px;
  padding: 1.5rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-dim);
  margin: 0 auto 8px;
  padding: 10px 12px;

  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);

  font-size: 1.2rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;

  transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;

  &:hover {
    background: rgba(159, 159, 159, 0.03);
    color: var(--text);
  }

  &:active {
    transform: translateY(1px);
    color: var(--text);
  }

  &:focus-visible {
    outline: 3px solid rgba(0, 120, 255, 0.35);
    outline-offset: 2px;
    color: var(--text);
  }

  &[aria-expanded="true"] {
    color: var(--text);
  }
`;


export const Chevron = styled.span<{ $open: boolean }>`
  display: inline-block;
  margin-left: 12px;
  transition: transform 180ms ease;
  transform: rotate(${(p) => (p.$open ? "180deg" : "0deg")});
`;

export const SectionPanel = styled.div<{ $open: boolean; $maxHeight: number }>`
  overflow: hidden;
  max-height: ${(p) => (p.$open ? `${p.$maxHeight}px` : "0px")};
  opacity: ${(p) => (p.$open ? 1 : 0)};
  transform: translateY(${(p) => (p.$open ? "0px" : "-4px")});

  transition: max-height 240ms ease, opacity 200ms ease, transform 200ms ease;
`;

export const SectionInner = styled.div`
  padding: 6px 2px 2px;
`;

export const CollapsibleStyle = styled.div`
  > div {
    width: fit-content;
  }

  @media (min-width: 1000px) {
    > div {
      padding: 0 50px;
      min-width: 1000px;
      margin: 0 auto;
    }
  }
`;

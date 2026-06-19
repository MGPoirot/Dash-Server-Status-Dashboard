// src/components/navbar/navbar.style.ts
import styled from "styled-components";
import type { Theme } from "../../styles/themes";

type Themed = { theme: Theme };

export const NavbarContainer = styled.header<Themed>`
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  background: var(--surface, #ffffff);
  color: var(--text);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-low);

  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding-inline: var(--space-lg);
  }
  
`;

/**
 * Brand / logo
 */
export const Logo = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  color: var(--text);
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
`;

/**
 * Desktop nav (hidden on mobile)
 */
export const Nav = styled.ul<Themed>`
  list-style: none;
  margin: 0;
  padding: 0;
  display: none;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
  /* so it sits between logo and right section */
  justify-content: flex-start;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
    margin-left: var(--space-md);
  }
`;

export const NavItem = styled.li`
  margin: 0;
  padding: 0;
`;

export const NavAnchor = styled.a`
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.65rem;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--text-dim);
  text-decoration: none;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast);

  &:hover,
  &:focus-visible {
    text-decoration: none;
    background: var(--hover-surface);
    color: var(--text);
    transform: translateY(-2px);
    outline: none;
  }

  &.active {
    background: var(--primary);
    color: #fff;
  }
`;

/**
 * Right side: theme toggle + CTA
 */
export const RightSection = styled.div<Themed>`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-left: auto;
`;

/**
 * CTA (desktop only)
 */
export const CTAButton = styled.button<Themed>`
  border: none;
  border-radius: var(--radius-round);
  padding: 0.4rem 0.95rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  background: var(--primary);
  color: #fff;
  cursor: pointer;
  box-shadow: var(--shadow-medium);
  text-decoration: none;
  display: none;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast);

  &:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-high);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: inline-flex;
  }
`;

/**
 * Theme toggle pill
 */
export const ThemeToggleButton = styled.button`
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-dim);
  border-radius: var(--radius-round);
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
  box-shadow: var(--shadow-low);

  .dot {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 999px;
    background: var(--primary);
  }

  .label {
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &:hover {
    background: var(--hover-surface);
    color: var(--text);
    transform: translateY(-1px);
    box-shadow: var(--shadow-medium);
  }
`;

/**
 * Hamburger (mobile only)
 */
export const Hamburger = styled.button<Themed>`
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);

  span {
    display: block;
    width: 18px;
    height: 2px;
    border-radius: 999px;
    background: var(--text);
  }

  &:hover,
  &:focus-visible {
    background: var(--hover-surface);
    transform: translateY(-1px);
    outline: none;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

/**
 * Mobile dropdown menu (only rendered when open)
 */
export const MobileMenu = styled.ul<Themed>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;

  margin: 0;
  padding: var(--space-sm) var(--space-md) var(--space-md);
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  background: var(--surface, #ffffff);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-medium);

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

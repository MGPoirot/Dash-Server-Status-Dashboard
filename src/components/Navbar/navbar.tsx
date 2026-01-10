import React, { useState } from "react";
import { Link, graphql, useStaticQuery } from "gatsby";
import {
  NavbarContainer,
  Logo,
  Nav,
  NavItem,
  NavAnchor,
  Hamburger,
  MobileMenu,
  CTAButton,
  RightSection,
  ThemeToggleButton,
} from "./navbar.style";
import { useTheme } from "../../styles/StyleWrapper";
import { lightTheme, darkTheme } from "../../styles/themes";

const navItems = [
  { to: "/about", label: "About" },
  // { to: "/server-profile", label: "Server Profile" },
  { to: "/configs", label: "Configs" },
  { to: "/scripts", label: "Scripts" },
  { to: "/series", label: "Series" },
  // Integrations page will be added at a later stage
  { to: "/prompt", label: "Prompts" },
  { to: "/scheduler", label: "Scheduler" },
  // { to: "/integrations", label: "Integrations" }
];

type NavLinksProps = {
  onClick?: () => void;
};

const NavLinks: React.FC<NavLinksProps> = ({ onClick }) => (
  <>
    {navItems.map((item) => (
      <NavItem key={item.to}>
        <NavAnchor
          as={Link}
          to={item.to}
          activeClassName="active"
          onClick={onClick}
        >
          {item.label}
        </NavAnchor>
      </NavItem>
    ))}
  </>
);

const Navbar: React.FC = () => {
  const data = useStaticQuery(graphql`
    query NavbarSiteMetadata {
      site {
        siteMetadata {
          title
          description
          siteUrl
        }
      }
    }
  `);

  const siteTitle = data.site?.siteMetadata?.title ?? "Dash";

  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = () => setMobileOpen((s) => !s);
  const closeMobile = () => setMobileOpen(false);

  const { theme, setTheme } = useTheme();
  const isDark = theme.name === "dark";

  const handleToggleTheme = () => {
    setTheme(isDark ? lightTheme : darkTheme);
  };

  return (
    <NavbarContainer role="navigation" aria-label="Main navigation">
      {/* mobile first order: hamburger – logo – right section */}
      <Hamburger
        onClick={toggleMobile}
        aria-expanded={mobileOpen}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </Hamburger>

      <Logo as={Link} to="/">
        {siteTitle}
      </Logo>

      {/* Desktop nav */}
      <Nav>
        <NavLinks onClick={closeMobile} />
      </Nav>

      <RightSection>
        <ThemeToggleButton
          type="button"
          onClick={handleToggleTheme}
          aria-label="Toggle color mode"
        >
          <span className="dot" />
          <span className="label">{isDark ? "Dark" : "Light"}</span>
        </ThemeToggleButton>

        {/* <CTAButton as={Link} to="/signup">
          Get Started
        </CTAButton> */}
      </RightSection>

      {/* Mobile nav */}
      {mobileOpen && (
        <MobileMenu>
          <NavLinks onClick={closeMobile} />
        </MobileMenu>
      )}
    </NavbarContainer>
  );
};

export default Navbar;

import React from "react";
import { SectionHeaderButton, Chevron, SectionInner, SectionPanel, CollapsibleStyle } from "./Collapsible.style";


const Collapsible: React.FC<{
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ id, title, open, onToggle, children }) => {
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = React.useState<number>(0);

  React.useEffect(() => {
    if (!innerRef.current) return;

    // Measure content height for smooth max-height animation.
    // Re-measure on open, and also when content changes while open.
    const measure = () => {
      if (!innerRef.current) return;
      setMaxHeight(innerRef.current.scrollHeight);
    };

    measure();

    // Optional: respond to dynamic content changes (e.g., script loaded).
    // ResizeObserver is widely supported in modern browsers.
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        if (open) measure();
      });
      ro.observe(innerRef.current);
    }

    return () => {
      ro?.disconnect();
    };
  }, [open, children]);

  return (
    <CollapsibleStyle>
      <SectionHeaderButton
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
      >
        <span>{title}</span>
        <Chevron $open={open} aria-hidden="true">
          ▼
        </Chevron>
      </SectionHeaderButton>

      <SectionPanel id={id} role="region" aria-label={title} $open={open} $maxHeight={maxHeight}>
        <SectionInner ref={innerRef}>{children}</SectionInner>
      </SectionPanel>
    </CollapsibleStyle>
  );
};

export default Collapsible

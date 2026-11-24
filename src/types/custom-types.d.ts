// src/types/custom-elements.d.ts
import * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "deckgo-highlight-code": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        language?: string;
        "line-numbers"?: string;
        "terminal"?: string;
        "theme"?: string;
        "editable"?: string;
      };
    }
  }
}

export {};

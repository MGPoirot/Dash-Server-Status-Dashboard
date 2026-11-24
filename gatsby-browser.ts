import { defineCustomElements as deckDeckGoHighlightElement } from "@deckdeckgo/highlight-code/dist/loader";

export const onClientEntry = () => {
  // Register the <deckgo-highlight-code> web component once on the client
  deckDeckGoHighlightElement();
};


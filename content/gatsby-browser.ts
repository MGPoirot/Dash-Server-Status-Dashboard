import { defineCustomElements as deckDeckGoHighlightElement } from "@deckdeckgo/highlight-code/dist/loader";

export const onClientEntry = () => {
  deckDeckGoHighlightElement();
};
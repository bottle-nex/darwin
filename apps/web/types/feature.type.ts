import type { ComponentType } from "react";

/** A single card in the landing "Why darwin" feature row. */
export type Feature = {
    title: string;
    body: string;
    /**
     * Renders the upper section of this card once it is expanded. One component
     * per card, so each can illustrate something different.
     */
    Media: ComponentType;
};

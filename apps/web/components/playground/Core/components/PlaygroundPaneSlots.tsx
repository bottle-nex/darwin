"use client";
import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

type PaneSlots = {
    lead: HTMLElement | null;
    actions: HTMLElement | null;
};

const PaneSlotsContext = createContext<PaneSlots>({ lead: null, actions: null });

export const PaneSlotsProvider = PaneSlotsContext.Provider;

export function usePaneSlots() {
    return useContext(PaneSlotsContext);
}

export function PaneLeadSlot({ children }: { children: ReactNode }) {
    const { lead } = useContext(PaneSlotsContext);
    return lead && createPortal(children, lead);
}

export function PaneActionsSlot({ children }: { children: ReactNode }) {
    const { actions } = useContext(PaneSlotsContext);
    return actions && createPortal(children, actions);
}

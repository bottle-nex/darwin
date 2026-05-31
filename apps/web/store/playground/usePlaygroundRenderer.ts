import { create } from "zustand";

export enum PlayGroundSidebarProps {
	KANBAN = "KANBAN",
	CODE = "CODE",
	PROPS = "PROPS",
	EVENTS = "EVENTS",
	MANAGE = "MANAGE",
}

interface PlaygroundRendererState {
	renderer: PlayGroundSidebarProps;
	setRenderer: (renderer: PlayGroundSidebarProps) => void;
}

export const usePlaygroundRenderer = create<PlaygroundRendererState>((set) => ({
	renderer: PlayGroundSidebarProps.KANBAN,
	setRenderer: (renderer) => set({ renderer }),
}));

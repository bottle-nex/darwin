"use client";
import { create } from "zustand";

interface OpenIssueState {
    /** Id of the issue whose dialog is open, or `null` when none is open. */
    openIssueId: string | null;
    setOpenIssueId: (id: string | null) => void;
}

/**
 * Holds which issue's detail dialog is currently open. The store is the single
 * source of truth for rendering; the URL (`…/issue/<id>`) is mirrored to it by
 * `useOpenIssueUrlSync` and written from it by `useOpenIssue`.
 */
export const useOpenIssueStore = create<OpenIssueState>((set) => ({
    openIssueId: null,
    setOpenIssueId: (openIssueId) => set({ openIssueId }),
}));

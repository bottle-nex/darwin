"use client";
import { useEffect, useRef } from "react";

import type { IssueDraftFields } from "@/types/issueDraft.type";

import { deleteIssueDraft, getIssueDraft, putIssueDraft } from "./db";

const PERSIST_DEBOUNCE_MS = 800;

export function useIssueDraftStorage({
    key,
    enabled,
    onLoad,
}: {
    key: string;
    enabled: boolean;
    /** Called once, asynchronously, with the stored draft (or `null` if none exists). */
    onLoad: (fields: IssueDraftFields | null) => void;
}) {
    const pendingFieldsRef = useRef<IssueDraftFields | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onLoadRef = useRef(onLoad);
    useEffect(() => {
        onLoadRef.current = onLoad;
    });

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        getIssueDraft(key).then((record) => {
            if (!cancelled) onLoadRef.current(record?.fields ?? null);
        });
        return () => {
            cancelled = true;
        };
    }, [key, enabled]);

    function writeNow(fields: IssueDraftFields) {
        putIssueDraft({ key, updatedAt: Date.now(), fields });
    }

    useEffect(() => {
        function flushPending() {
            if (pendingFieldsRef.current) writeNow(pendingFieldsRef.current);
        }
        window.addEventListener("beforeunload", flushPending);
        return () => {
            window.removeEventListener("beforeunload", flushPending);
            flushPending();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function persist(fields: IssueDraftFields) {
        if (!enabled) return;
        pendingFieldsRef.current = fields;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            if (pendingFieldsRef.current) writeNow(pendingFieldsRef.current);
        }, PERSIST_DEBOUNCE_MS);
    }

    function discard() {
        pendingFieldsRef.current = null;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        deleteIssueDraft(key);
    }

    return { persist, discard };
}

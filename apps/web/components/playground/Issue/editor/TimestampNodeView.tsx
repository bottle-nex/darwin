"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import DateTimePicker, {
    DATE_TIME_SEGMENTS,
    stepDateTime,
    type DateTimeDraft,
    type DateTimeSegment,
} from "./DateTimePicker";
import { formatTimestamp, type TimestampMode } from "./timestamp";

export default function TimestampNodeView({
    node,
    updateAttributes,
    editor,
    selected,
}: ReactNodeViewProps) {
    const value = node.attrs.value as string;
    const mode = node.attrs.mode as TimestampMode;

    const [draft, setDraft] = useState<DateTimeDraft | null>(null);
    const [segment, setSegment] = useState<DateTimeSegment>("day");
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (draft) panelRef.current?.focus();
    }, [draft]);

    function openPicker() {
        if (!editor.isEditable) return;
        setSegment("day");
        setDraft({ date: new Date(value), mode });
    }

    function save(next: DateTimeDraft) {
        updateAttributes({ value: next.date.toISOString(), mode: next.mode });
        setDraft(null);
        editor.commands.focus();
    }

    function moveSegment(step: number) {
        const index = DATE_TIME_SEGMENTS.indexOf(segment) + step;
        if (index < 0 || index > DATE_TIME_SEGMENTS.length - 1) return;
        setSegment(DATE_TIME_SEGMENTS[index]);
    }

    return (
        <NodeViewWrapper as="span" className="relative inline-block">
            <Button
                variant="unstyled"
                type="button"
                onClick={openPicker}
                className={`timestamp-chip cursor-pointer ${selected ? "ProseMirror-selectednode" : ""}`}
            >
                {formatTimestamp(value, mode)}
            </Button>

            {draft && (
                <div
                    ref={panelRef}
                    tabIndex={-1}
                    contentEditable={false}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") setDraft(null);
                        else if (event.key === "Enter") save(draft);
                        else if (event.key === "ArrowUp") setDraft(stepDateTime(draft, segment, 1));
                        else if (event.key === "ArrowDown")
                            setDraft(stepDateTime(draft, segment, -1));
                        else if (event.key === "ArrowLeft") moveSegment(-1);
                        else if (event.key === "ArrowRight") moveSegment(1);
                        else return;
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                    className="absolute top-full left-0 z-50 mt-1 outline-none"
                >
                    <DateTimePicker
                        draft={draft}
                        segment={segment}
                        confirmLabel="Save"
                        onSegment={setSegment}
                        onStep={(name, step) => {
                            setSegment(name);
                            setDraft(stepDateTime(draft, name, step));
                        }}
                        onInsert={() => save(draft)}
                    />
                </div>
            )}
        </NodeViewWrapper>
    );
}

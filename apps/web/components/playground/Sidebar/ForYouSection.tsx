"use client";
import { useParams } from "next/navigation";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import { HiOutlineAnnotation } from "react-icons/hi";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import Row from "./SidebarRow";
import Section from "./SidebarSection";
import { type SidebarSectionProps } from "./shared";
import { PlaygroundTab } from "../playgroundTabs";

// Everything waiting on you personally, as opposed to the board at large.
const FOR_YOU_ROWS: { id: string; label: string; icon: React.ComponentType }[] = [
    { id: PlaygroundTab.Chats, label: "Chats", icon: HiOutlineAnnotation },
    { id: PlaygroundTab.Reviews, label: "Reviews", icon: HiOutlineCheckCircle },
];

export default function PlaygroundSidebarForYouSection({
    selectedRowId,
    onSelect,
}: SidebarSectionProps) {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const openThread = usePlaygroundNavStore((s) => s.openThread);

    return (
        <Section title="For you">
            {FOR_YOU_ROWS.map((r) => (
                <Row
                    key={r.id}
                    label={r.label}
                    leading={{ kind: "icon", icon: r.icon }}
                    active={
                        r.id === PlaygroundTab.Chats
                            ? selectedRowId === PlaygroundTab.Chats ||
                              selectedRowId === PlaygroundTab.ThreadDetail
                            : selectedRowId === r.id
                    }
                    onClick={() =>
                        r.id === PlaygroundTab.Chats
                            ? openThread({ kind: "project" }, projectSlug ?? "")
                            : onSelect(r.id)
                    }
                />
            ))}
        </Section>
    );
}

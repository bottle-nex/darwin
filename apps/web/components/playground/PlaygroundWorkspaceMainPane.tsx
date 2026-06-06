"use client";
import { UserPlus } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePlaygroundMainViewStore } from "@/store/playground/usePlaygroundMainViewStore";
import PlaygroundTeamView from "./PlaygroundTeamView/PlaygroundTeamViewMain";

export default function PlaygroundWorkspaceMainPane() {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const view = usePlaygroundMainViewStore((s) => s.view);
    const setView = usePlaygroundMainViewStore((s) => s.setView);

    if (view.type === "team" && view.projectSlug === projectSlug) {
        return (
            <main className="flex flex-1 min-w-0 flex-col">
                <PlaygroundTeamView team={view.team} onClose={() => setView({ type: "home" })} />
            </main>
        );
    }

    return (
        <main className="flex flex-1 min-w-0 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
                <span
                    className="flex size-14 items-center justify-center rounded-2xl bg-charcoal text-neutral-300 ring-1 ring-white/10"
                    aria-hidden
                >
                    <UserPlus className="size-6" />
                </span>
                <h2 className="mt-4 text-[15px] font-semibold text-neutral-100">
                    Looking to collaborate?
                </h2>
                <p className="mt-1 text-[13px] text-neutral-500">
                    Collaboration is one invite away.
                </p>
                <Button
                    size="sm"
                    className="mt-4 h-8 cursor-pointer rounded-full bg-neutral-200 px-4 text-[12px] font-medium text-neutral-900 hover:bg-white"
                >
                    Invite people
                </Button>
            </div>
        </main>
    );
}

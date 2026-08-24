"use client";
import OfflineTicker from "./OfflineTicker";
import PlaygroundProjectSwitcher from "./PlaygroundProjectSwitcher";

export default function PlaygroundLeadBar() {
    return (
        <div className="flex min-w-0 items-center gap-1">
            <PlaygroundProjectSwitcher />
            <OfflineTicker />
        </div>
    );
}

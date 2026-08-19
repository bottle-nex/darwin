"use client";
import PlaygroundProjectSwitcher from "./PlaygroundProjectSwitcher";
import OfflineTicker from "./OfflineTicker";

export default function PlaygroundLeadBar() {
    return (
        <div className="flex min-w-0 items-center gap-1">
            <PlaygroundProjectSwitcher />
            <OfflineTicker />
        </div>
    );
}

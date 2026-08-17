"use client";
import ChatsListPane from "./ChatsListPane";
import ThreadDetailDisplay from "./ThreadDetailDisplay";

export default function ChatsDisplay() {
    return (
        <div className="flex min-h-0 flex-1">
            <ChatsListPane />
            <ThreadDetailDisplay />
        </div>
    );
}

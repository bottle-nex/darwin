import NoResource from "@/components/utility/NoResource";
import ProjectsGlyph from "@/components/utility/ProjectsGlyph";

export default function InboxMainPane() {
    return (
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-5">
            <NoResource
                className="pl-[4%] mt-12"
                icon={<ProjectsGlyph className="size-24" />}
                title="Inbox"
                description="Your inbox is where issues assigned to you, replies to your threads, and updates from your agents are routed. It keeps everything that needs your attention in one place so you can triage quickly. It's empty for now."
            />
        </div>
    );
}

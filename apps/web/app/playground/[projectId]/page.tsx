import PlaygroundPill from "@/components/playground/PlaygroundPill";
import PlaygroundSidebar from "@/components/playground/PlaygroundSidebar";
import PlaygroundTopper from "@/components/playground/PlaygroundTopper";

export default function ProjectPage() {
    return (
        <main className="flex flex-col h-full overflow-hidden bg-[#0c0c0c] grain">
            <section className="flex flex-1 min-h-0">
                <PlaygroundSidebar />
                <div className="flex-1 min-w-0">
                    <PlaygroundPill />
                </div>
            </section>
        </main>
    );
}

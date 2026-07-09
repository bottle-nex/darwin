import NoResource from "@/components/utility/NoResource";
import ProjectsGlyph from "@/components/utility/ProjectsGlyph";

export default function MentionsDisplay() {
    return (
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-5">
            <NoResource
                className="pl-[4%] mt-12"
                icon={<ProjectsGlyph className="size-24" />}
                title="Mentions"
                description="Mentions gather every place someone tags you with @ across issues, comments, and reviews. Instead of scanning the whole board, you get one focused list of the threads that need your input. You haven't been mentioned yet."
            />
        </div>
    );
}

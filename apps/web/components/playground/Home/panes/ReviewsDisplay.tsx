import NoResource from "@/components/utility/NoResource";
import ProjectsGlyph from "@/components/utility/ProjectsGlyph";

export default function ReviewsDisplay() {
    return (
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-5">
            <NoResource
                className="pl-[4%] mt-12"
                icon={<ProjectsGlyph className="size-24" />}
                title="Reviews"
                description="Reviews are the pull requests your agents open once they've implemented an issue and need a human to sign off. Read the diff, leave feedback, and approve or request changes right from the board. Nothing is waiting on you yet."
            />
        </div>
    );
}

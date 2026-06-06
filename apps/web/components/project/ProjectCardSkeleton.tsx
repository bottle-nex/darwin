export default function ProjectCardSkeleton() {
    return (
        <div className="flex w-full animate-pulse flex-col gap-4 rounded-sm bg-neutral-900 p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="size-8 shrink-0 rounded-md bg-neutral-800" />
                    <div className="flex flex-col gap-1.5">
                        <div className="h-3.5 w-28 rounded bg-neutral-800" />
                        <div className="h-3 w-16 rounded bg-neutral-800" />
                    </div>
                </div>
                <div className="h-4 w-14 shrink-0 rounded-full bg-neutral-800" />
            </div>

            <div className="flex min-h-10 flex-col gap-1.5">
                <div className="h-3 w-full rounded bg-neutral-800" />
                <div className="h-3 w-3/4 rounded bg-neutral-800" />
            </div>

            <div className="flex items-center gap-4 pt-3">
                <div className="h-3 w-16 rounded bg-neutral-800" />
                <div className="h-3 w-16 rounded bg-neutral-800" />
                <div className="ml-auto h-3 w-12 rounded bg-neutral-800" />
            </div>
        </div>
    );
}

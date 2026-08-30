"use client";
import PreviewImage from "@/components/ui/PreviewImage";

const SHOT_WIDTH = 3024;
const SHOT_HEIGHT = 1964;
const SHOT_SIZES = "(min-width: 1024px) 45vw, 100vw";

export default function ImportPreview({ repo }: { repo: string }) {
    return (
        <div className="flex flex-col gap-3">
            <PreviewImage
                src="/images/integrations/github/github-dashboard.png"
                alt={`The issue list on ${repo}`}
                width={SHOT_WIDTH}
                height={SHOT_HEIGHT}
                sizes={SHOT_SIZES}
                priority
            />
            <PreviewImage
                src="/images/integrations/github/matcha-dashboard.png"
                alt="The same issues as tagged cards on the matcha board"
                width={SHOT_WIDTH}
                height={SHOT_HEIGHT}
                sizes={SHOT_SIZES}
            />
        </div>
    );
}

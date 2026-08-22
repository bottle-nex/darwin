"use client";
import type { ReviewTab } from "@trymatcha/types";
import IconWrapper from "@/components/ui/IconWrapper";
import ReviewTabBar from "./ReviewTabBar";
import { LiaGithub } from "react-icons/lia";

export default function ReviewHeader({ tab, htmlUrl }: { tab: ReviewTab; htmlUrl: string }) {
    return (
        <header className="flex shrink-0 items-center gap-1.5 px-3 pt-3 pb-2">
            <ReviewTabBar active={tab} />
            <a
                href={htmlUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open on GitHub"
                className="group cursor-pointer"
            >
                <IconWrapper icon={LiaGithub} variant="outline" title="Open on GitHub" />
            </a>
        </header>
    );
}

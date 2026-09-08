"use client";
import { ReviewTab } from "@trydarwin/types";
import { GithubLogoIcon } from "@trydarwin/ui/icons";

import IconWrapper from "@/components/ui/IconWrapper";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";

import CommitFilterMenu from "./changes/CommitFilterMenu";
import DiffViewMenu from "./changes/DiffViewMenu";
import ReviewTabBar from "./ReviewTabBar";

export default function ReviewHeader({
    tab,
    htmlUrl,
    projectId,
    pullNumber,
    commit,
}: {
    tab: ReviewTab;
    htmlUrl: string;
    projectId: string | undefined;
    pullNumber: number;
    commit: string | undefined;
}) {
    const openReview = usePaneRouteStore((s) => s.openReview);
    const route = usePaneRouteStore((s) => s.route);

    return (
        <header className="flex shrink-0 items-center gap-1.5 px-4 pt-3">
            <ReviewTabBar active={tab} />
            <div className="ml-auto flex items-center gap-1.5">
                {tab === ReviewTab.Changes && <DiffViewMenu />}
                {tab === ReviewTab.Changes && route.kind === "review" && (
                    <CommitFilterMenu
                        projectId={projectId}
                        pullNumber={pullNumber}
                        commit={commit}
                        onSelect={(sha) =>
                            openReview({
                                pullNumber,
                                slug: route.slug,
                                tab: ReviewTab.Changes,
                                commit: sha,
                            })
                        }
                    />
                )}
                <a
                    href={htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open on GitHub"
                    className="group cursor-pointer"
                >
                    <IconWrapper icon={GithubLogoIcon} variant="outline" title="Open on GitHub" />
                </a>
            </div>
        </header>
    );
}

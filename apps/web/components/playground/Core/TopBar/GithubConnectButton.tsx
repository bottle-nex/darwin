"use client";

import { useParams } from "next/navigation";
import { FaCheck, FaGithub } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { useConnectGithub } from "@/hooks/github/useConnectGithub";
import { useDisconnectGithub } from "@/hooks/github/useDisconnectGithub";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";

/**
 * Top-bar affordance for connecting the active org to GitHub. Only shown to
 * members who can manage connectors (Owner/Admin). Resolves the active org from
 * the route slug, matching {@link PlaygroundUserMenu}.
 */
export default function GithubConnectButton() {
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const { data: organizations } = useFetchOrganizations();
    const connect = useConnectGithub();
    const disconnect = useDisconnectGithub();

    const slug = typeof orgSlug === "string" ? orgSlug : "";
    const org = (organizations ?? []).find((o) => o.slug === slug);

    if (!org) return null;

    const canManage = org.role === "Owner" || org.role === "Admin";
    if (!canManage) return null;

    if (org.githubConnected) {
        return (
            <Button
                variant="unstyled"
                type="button"
                onClick={() => {
                    if (
                        window.confirm(
                            "Disconnect GitHub from this org? Projects keep their repo info but lose the live link.",
                        )
                    ) {
                        disconnect.mutate(org.id);
                    }
                }}
                loading={disconnect.isPending}
                iconOnly
                title="GitHub connected — click to disconnect"
                className="flex h-6.75 cursor-pointer items-center gap-1 rounded-sm px-2.5 text-[11px] font-medium text-neutral-300 hover:bg-white/10"
            >
                <FaGithub className="size-3.5" aria-hidden />
                <FaCheck className="size-3 text-matcha" aria-hidden />
            </Button>
        );
    }

    return (
        <Button
            variant={"tertiary"}
            type="button"
            size={"sm"}
            loading={connect.isPending}
            onClick={() => connect.mutate(org.id)}
            disabled={connect.isPending}
        >
            {!connect.isPending && <FaGithub className="size-3.5" aria-hidden />}
            Connect GitHub
        </Button>
    );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

import LogoLoader from "@/components/app/LogoLoader";
import { Button } from "@/components/ui/button";
import useAcceptInvite from "@/hooks/invitations/useAcceptInvite";
import useInvitationPreview from "@/hooks/invitations/useInvitationPreview";
import useRejectInvite from "@/hooks/invitations/useRejectInvite";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import { INVITATION_STATUS } from "@/types/types.invitation";

const ACCENT = "var(--color-matcha)";

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex min-h-dvh w-full items-center justify-center bg-[#141414] p-4">
            <div className="w-full max-w-100 overflow-hidden rounded-xl border border-border bg-card p-6">
                {children}
            </div>
        </main>
    );
}

function Brand() {
    return (
        <div className="mb-4 flex items-center gap-x-2">
            <span
                className="flex size-6 items-center justify-center rounded-md shadow-sm"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #bcdb6f)` }}
                aria-hidden
            >
                <span className="size-2 rounded-full bg-[#1a2e05]/80" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">darwin</span>
        </div>
    );
}

export default function InvitePage() {
    const { token } = useParams<{ token: string }>();
    const router = useRouter();

    const sessionToken = useUserSessionStore((s) => s.session?.user?.token);
    const userEmail = useUserSessionStore((s) => s.session?.user?.email);

    const { data: invite, isLoading, isError } = useInvitationPreview(token);
    const { mutate: accept, isPending: isAccepting } = useAcceptInvite();
    const { mutate: reject, isPending: isRejecting } = useRejectInvite();

    const [declined, setDeclined] = useState(false);

    // Not signed in: prompt sign-in. The preview query stays disabled until a session
    // token appears, after which this page re-renders authenticated and fetches.
    if (!sessionToken) {
        return (
            <Shell>
                <Brand />
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                    You&apos;ve been invited to darwin
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Sign in or create an account to view this invitation.
                </p>
                <Button
                    className="mt-5 h-10 w-full"
                    onClick={() => router.push(`/login?callbackUrl=/invite/${token}`)}
                >
                    Sign in to continue
                </Button>
            </Shell>
        );
    }

    if (isLoading) {
        return (
            <Shell>
                <Brand />
                <LogoLoader size={36} className="py-10" />
            </Shell>
        );
    }

    if (isError || !invite) {
        return (
            <Shell>
                <Brand />
                <h1 className="text-lg font-semibold text-foreground">Invitation not found</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    This invitation is invalid or no longer exists.
                </p>
            </Shell>
        );
    }

    if (declined || invite.status === INVITATION_STATUS.REJECTED) {
        return (
            <Shell>
                <Brand />
                <h1 className="text-lg font-semibold text-foreground">Invitation declined</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    You&apos;ve declined this invitation.
                </p>
            </Shell>
        );
    }

    if (invite.status === INVITATION_STATUS.ACCEPTED) {
        return (
            <Shell>
                <Brand />
                <h1 className="text-lg font-semibold text-foreground">You&apos;re already in</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    You&apos;ve already accepted this invitation.
                </p>
                <Button className="mt-5 h-10 w-full" onClick={() => router.push("/playground")}>
                    Go to playground
                </Button>
            </Shell>
        );
    }

    if (invite.isExpired) {
        return (
            <Shell>
                <Brand />
                <h1 className="text-lg font-semibold text-foreground">Invitation expired</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    This invitation has expired. Ask{" "}
                    {invite.invitedBy.name ?? invite.invitedBy.email} to send a new one.
                </p>
            </Shell>
        );
    }

    // Signed in as a different account than the invite was sent to.
    if (!invite.emailMatches) {
        return (
            <Shell>
                <Brand />
                <h1 className="text-lg font-semibold text-foreground">Wrong account</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    This invitation was sent to{" "}
                    <span className="font-semibold text-foreground">{invite.email}</span>, but
                    you&apos;re signed in as{" "}
                    <span className="font-semibold text-foreground">{userEmail}</span>.
                </p>
                <Button
                    variant="outline"
                    className="mt-5 h-10 w-full"
                    onClick={() => signOut({ callbackUrl: `/invite/${token}` })}
                >
                    Switch account
                </Button>
            </Shell>
        );
    }

    const scope = invite.team
        ? `${invite.team.name}${invite.project ? ` · ${invite.project.name}` : ""}`
        : invite.org?.name;
    const roleLabel = invite.role ?? invite.teamRoleOnAccept;

    return (
        <Shell>
            <Brand />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Join {invite.org?.name ?? "the organization"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
                {invite.invitedBy.name ?? invite.invitedBy.email} invited you to{" "}
                {invite.team ? "the team" : "the organization"}{" "}
                <span className="font-semibold text-foreground">{scope}</span> as{" "}
                <span className="font-semibold text-foreground">{roleLabel}</span>.
            </p>

            <div className="mt-6 flex gap-x-3">
                <Button
                    variant="outline"
                    className="h-10 flex-1"
                    loading={isRejecting}
                    disabled={isAccepting || isRejecting}
                    onClick={() => reject(token, { onSuccess: () => setDeclined(true) })}
                >
                    Decline
                </Button>
                <Button
                    className="h-10 flex-1"
                    loading={isAccepting}
                    disabled={isAccepting || isRejecting}
                    onClick={() => accept(token, { onSuccess: () => router.push("/playground") })}
                >
                    Accept
                </Button>
            </div>
        </Shell>
    );
}

"use client";

import { ErrorCircleIcon, LoadingSpinnerIcon, SuccessCircleIcon } from "@trydarwin/ui/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCompleteGithubConnect } from "@/hooks/github/useCompleteGithubConnect";
import { GITHUB_LINK_RETURN_KEY, useCompleteGithubLink } from "@/hooks/github/useGithubLink";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";

type Status = "loading" | "success" | "error";

type Flow = "install" | "link";

const COPY: Record<Flow, Record<Status, { title: string; hint: string }>> = {
    install: {
        loading: {
            title: "Connecting GitHub",
            hint: "Linking your organization — this only takes a moment.",
        },
        success: { title: "GitHub connected", hint: "Taking you back to your workspace…" },
        error: {
            title: "Couldn't connect GitHub",
            hint: "Something went wrong finishing the connection. Please try again.",
        },
    },
    link: {
        loading: { title: "Linking GitHub", hint: "Confirming your account — one moment." },
        success: { title: "GitHub linked", hint: "Taking you back…" },
        error: {
            title: "Couldn't link GitHub",
            hint: "Something went wrong finishing the link. Please try again.",
        },
    },
};

function StatusIcon({ status }: { status: Status }) {
    if (status === "success")
        return <SuccessCircleIcon className="size-5 text-matcha" aria-hidden />;
    if (status === "error")
        return <ErrorCircleIcon className="size-5 text-destructive" aria-hidden />;
    return <LoadingSpinnerIcon className="size-5 animate-spin text-muted-foreground" aria-hidden />;
}

function GithubCallback() {
    const router = useRouter();
    const params = useSearchParams();
    const completeConnect = useCompleteGithubConnect();
    const completeLink = useCompleteGithubLink();
    const token = useUserSessionStore((s) => s.session?.user?.token);

    const installationId = params.get("installation_id");
    const code = params.get("code");
    const state = params.get("state");
    const flow: Flow = installationId ? "install" : "link";
    const hasParams = Boolean(code && state);

    const [status, setStatus] = useState<Status>(hasParams ? "loading" : "error");
    const [hint, setHint] = useState<string | null>(
        hasParams
            ? null
            : "We didn't get the details GitHub should send back. Start over to retry.",
    );
    const started = useRef(false);

    useEffect(() => {
        if (started.current || !code || !state || !token) return;
        started.current = true;

        const leaveTo = (target: string) => setTimeout(() => router.replace(target), 1200);
        const fail = () => {
            setStatus("error");
            setHint(null);
        };

        if (installationId) {
            completeConnect.mutate(
                { installationId, code, state },
                {
                    onSuccess: (data) => {
                        setStatus("success");
                        setHint(
                            data.accountLogin
                                ? `Connected ${data.accountLogin}. Taking you back…`
                                : null,
                        );
                        leaveTo(data.orgSlug ? `/playground/${data.orgSlug}` : "/playground");
                    },
                    onError: fail,
                },
            );
            return;
        }

        completeLink.mutate(
            { code, state },
            {
                onSuccess: (data) => {
                    setStatus("success");
                    setHint(`Linked ${data.githubLogin}. Taking you back…`);
                    const back = sessionStorage.getItem(GITHUB_LINK_RETURN_KEY);
                    sessionStorage.removeItem(GITHUB_LINK_RETURN_KEY);
                    leaveTo(back ?? "/playground");
                },
                onError: fail,
            },
        );
    }, [installationId, code, state, token, completeConnect, completeLink, router]);

    const copy = COPY[flow][status];

    return (
        <main className="flex h-dvh items-center justify-center bg-ink px-6 text-foreground">
            <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center justify-center gap-4 text-center"
            >
                <span className="flex size-12 items-center justify-center rounded-xl border border-edge bg-graphite">
                    <StatusIcon status={status} />
                </span>

                <div>
                    <p className="text-sm font-medium text-foreground">{copy.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{hint ?? copy.hint}</p>
                </div>

                {status === "error" && (
                    <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => router.replace("/playground")}
                    >
                        Back to workspace
                    </Button>
                )}
            </div>
        </main>
    );
}

export default function GithubCallbackPage() {
    return (
        <Suspense fallback={null}>
            <GithubCallback />
        </Suspense>
    );
}

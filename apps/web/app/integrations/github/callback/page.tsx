"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import { RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { useCompleteGithubConnect } from "@/hooks/github/useCompleteGithubConnect";

type Status = "loading" | "success" | "error";

const COPY: Record<Status, { title: string; hint: string }> = {
    loading: {
        title: "Connecting GitHub",
        hint: "Linking your organization — this only takes a moment.",
    },
    success: {
        title: "GitHub connected",
        hint: "Taking you back to your workspace…",
    },
    error: {
        title: "Couldn't connect GitHub",
        hint: "Something went wrong finishing the connection. Please try again.",
    },
};

function StatusIcon({ status }: { status: Status }) {
    if (status === "success")
        return <FaCircleCheck className="size-5 text-[#9bc24f]" aria-hidden />;
    if (status === "error") return <FaCircleXmark className="size-5 text-red-400" aria-hidden />;
    return <RiLoader4Line className="size-5 animate-spin text-neutral-400" aria-hidden />;
}

function GithubCallback() {
    const router = useRouter();
    const params = useSearchParams();
    const complete = useCompleteGithubConnect();

    const installationId = params.get("installation_id");
    const code = params.get("code");
    const state = params.get("state");
    const hasParams = Boolean(installationId && code && state);

    const [status, setStatus] = useState<Status>(hasParams ? "loading" : "error");
    const [hint, setHint] = useState<string | null>(
        hasParams
            ? null
            : "We didn't get the details GitHub should send back. Start over to retry.",
    );
    const started = useRef(false);

    useEffect(() => {
        if (started.current || !installationId || !code || !state) return;
        started.current = true;

        complete.mutate(
            { installationId, code, state },
            {
                onSuccess: (data) => {
                    setStatus("success");
                    setHint(
                        data.accountLogin
                            ? `Connected ${data.accountLogin}. Taking you back…`
                            : null,
                    );
                    const target = data.orgSlug ? `/playground/${data.orgSlug}` : "/playground";
                    setTimeout(() => router.replace(target), 1200);
                },
                onError: () => {
                    setStatus("error");
                    setHint(null);
                },
            },
        );
    }, [installationId, code, state, complete, router]);

    const copy = COPY[status];

    return (
        <main className="flex h-dvh items-center justify-center bg-charcoal px-6 text-neutral-100">
            <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center justify-center gap-4 text-center"
            >
                <span className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <StatusIcon status={status} />
                </span>

                <div>
                    <p className="text-sm font-medium text-neutral-200">{copy.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">{hint ?? copy.hint}</p>
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

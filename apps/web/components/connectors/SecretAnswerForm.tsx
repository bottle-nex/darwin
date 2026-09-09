"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnswerSecret, useQuestion } from "@/hooks/connectors/useQuestion";
import { toast } from "@/lib/toast";

export default function SecretAnswerForm({ questionId }: { questionId: string }) {
    const { data: question, isLoading, isError } = useQuestion(questionId);
    const answer = useAnswerSecret(questionId);
    const [value, setValue] = useState("");

    if (isLoading) {
        return <p className="text-[13px] text-overlay/50">Loading…</p>;
    }

    if (isError || !question) {
        return (
            <p className="text-[13px] text-overlay/60">
                This question could not be found, or it is not yours to answer.
            </p>
        );
    }

    if (question.status !== "Waiting") {
        return (
            <p className="text-[13px] text-overlay/60">
                This question is no longer waiting for an answer.
            </p>
        );
    }

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                if (!value.trim()) return;

                answer.mutate(value, {
                    onSuccess: () => {
                        setValue("");
                        toast.success("Secret saved. The agent will continue.");
                    },
                    onError: () => toast.error("Could not save the secret."),
                });
            }}
        >
            <div className="flex flex-col gap-1">
                {question.projectName ? (
                    <span className="text-[12px] text-overlay/50">{question.projectName}</span>
                ) : null}
                <h1 className="font-mono text-lg font-600 text-overlay">{question.key}</h1>
                <p className="text-[13px] text-overlay/70">{question.prompt}</p>
            </div>

            <Input
                type="password"
                autoComplete="off"
                placeholder={`Value for ${question.key}`}
                value={value}
                onChange={(event) => setValue(event.target.value)}
            />

            <p className="text-[12px] text-overlay/45">
                Stored encrypted and injected into the sandbox as an environment variable. It is
                never shown again and never sent to Slack or Telegram.
            </p>

            <Button
                type="submit"
                variant="flat-primary"
                disabled={answer.isPending || !value.trim()}
            >
                {answer.isPending ? "Saving…" : "Save secret"}
            </Button>
        </form>
    );
}

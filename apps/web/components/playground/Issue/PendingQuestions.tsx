"use client";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    type PendingQuestion,
    useAnswerQuestion,
    useIssueQuestions,
} from "@/hooks/connectors/useIssueQuestions";

export default function PendingQuestions({ issueId }: { issueId: string }) {
    const { data: questions } = useIssueQuestions(issueId);
    const answer = useAnswerQuestion(issueId);

    // Questions the agent asked mid-run are answered inline in that run's log, where they were
    // asked. What is left for here is the approval that comes after the run has ended and has no
    // log to sit in.
    const standalone = (questions ?? []).filter(
        (question) => question.type === "ApprovePullRequest",
    );

    if (standalone.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            {standalone.map((question) => (
                <QuestionCard
                    key={question.id}
                    question={question}
                    busy={answer.isPending}
                    onAnswer={(value) =>
                        answer.mutate(
                            { questionId: question.id, value },
                            {
                                onSuccess: () => toast.success("Answer sent to the agent"),
                                onError: () => toast.error("Could not record that answer"),
                            },
                        )
                    }
                />
            ))}
        </div>
    );
}

function QuestionCard({
    question,
    busy,
    onAnswer,
}: {
    question: PendingQuestion;
    busy: boolean;
    onAnswer: (value: string) => void;
}) {
    const [text, setText] = useState("");
    const isSecret = question.type === "NeedSecret";

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex flex-col gap-1">
                <span className="text-[11px] tracking-wide text-amber-300/80 uppercase">
                    {question.type === "ApprovePullRequest" ? "Approval needed" : "Agent question"}
                </span>
                <p className="text-[13px] text-snow">{question.prompt}</p>
            </div>

            {isSecret ? (
                <a
                    className="text-[12px] text-primary underline underline-offset-2"
                    href={`/questions/${question.id}/secret`}
                >
                    Provide it securely
                </a>
            ) : question.options.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {question.options.map((option) => (
                        <Button
                            key={option}
                            type="button"
                            variant="flat"
                            size="sm"
                            disabled={busy}
                            onClick={() => onAnswer(option)}
                        >
                            {option}
                        </Button>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Input
                        variant="outline"
                        className="h-8 text-[13px]"
                        placeholder="Your answer"
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && text.trim()) onAnswer(text.trim());
                        }}
                    />
                    <Button
                        type="button"
                        variant="flat-primary"
                        size="sm"
                        className="h-8 shrink-0"
                        disabled={busy || !text.trim()}
                        onClick={() => onAnswer(text.trim())}
                    >
                        Send
                    </Button>
                </div>
            )}
        </div>
    );
}

import type { Metadata } from "next";

import SecretAnswerForm from "@/components/connectors/SecretAnswerForm";

export const metadata: Metadata = {
    title: "Provide a secret · darwin",
};

export default async function QuestionSecretPage({
    params,
}: {
    params: Promise<{ questionId: string }>;
}) {
    const { questionId } = await params;

    return (
        <main className="theme-playground flex min-h-dvh items-center justify-center bg-ink p-6">
            <div className="w-full max-w-md rounded-[12px] bg-snow/5 p-6">
                <SecretAnswerForm questionId={questionId} />
            </div>
        </main>
    );
}

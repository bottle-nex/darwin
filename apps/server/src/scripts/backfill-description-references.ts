import { reference_key } from "@trymatcha/types";
import { prisma } from "@trymatcha/database";

const MENTION_SPAN = /<span[^>]*data-type="mention"[^>]*>([\s\S]*?)<\/span>/g;
const DATA_ID = /data-id="([^"]+)"/;
const ISSUE_TEXT = /^#(\d+)\s+/;

const apply = process.argv.includes("--apply");

type Member = { id: string; name: string | null; email: string };

function tokenSpan(kind: "member" | "issue", id: string): string {
    const char = kind === "issue" ? "#" : "@";
    return `<span data-type="mention" data-kind="${kind}" data-id="${id}" data-mention-suggestion-char="${char}" class="reference-chip">${char}[${reference_key(kind, id)}]</span>`;
}

async function main() {
    const issues = await prisma.issue.findMany({
        where: { description: { contains: 'data-type="mention"' } },
        select: { id: true, number: true, projectId: true, description: true },
    });

    let rewritten = 0;
    let resolvedChips = 0;
    let orphanChips = 0;

    for (const issue of issues) {
        const byNumber = new Map(
            (
                await prisma.issue.findMany({
                    where: { projectId: issue.projectId },
                    select: { id: true, number: true },
                })
            ).map((row) => [row.number, row.id]),
        );
        const members: Member[] = (
            await prisma.projectMember.findMany({
                where: { projectId: issue.projectId },
                select: { id: true, user: { select: { name: true, email: true } } },
            })
        ).map((row) => ({ id: row.id, name: row.user.name, email: row.user.email }));

        const next = issue.description.replace(MENTION_SPAN, (span, inner: string) => {
            if (DATA_ID.test(span)) return span;

            const text = inner.trim();
            const issueMatch = ISSUE_TEXT.exec(text);
            if (issueMatch) {
                const target = byNumber.get(Number(issueMatch[1]));
                if (target) {
                    resolvedChips += 1;
                    return tokenSpan("issue", target);
                }
            }

            if (text.startsWith("@")) {
                const name = text.slice(1).trim().toLowerCase();
                const member = members.find(
                    (row) => row.name?.toLowerCase() === name || row.email.toLowerCase() === name,
                );
                if (member) {
                    resolvedChips += 1;
                    return tokenSpan("member", member.id);
                }
            }

            orphanChips += 1;
            return span;
        });

        if (next === issue.description) continue;
        rewritten += 1;
        console.log(`#${issue.number} (${issue.id})`);
        if (apply) {
            await prisma.issue.update({ where: { id: issue.id }, data: { description: next } });
        }
    }

    console.log(
        `\n${apply ? "rewrote" : "would rewrite"} ${rewritten} description(s) — ` +
            `${resolvedChips} chip(s) linked, ${orphanChips} left as plain text`,
    );
    if (!apply) console.log("dry run — pass --apply to write");
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());

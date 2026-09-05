export const BLANK_QUESTION = "Fill this in";

const PROMPT_SPAN = /<span[^>]*(?:class="prompt"|data-prompt)[^>]*>[\s\S]*?<\/span>/g;
const BRACES = /\{\{([^{}]*)\}\}/g;
const CODE_BLOCK = /(<pre[\s\S]*?<\/pre>)/;

function promptSpan(question: string): string {
    const text = (question.trim() || BLANK_QUESTION).replace(/"/g, "&quot;");
    return `<span class="prompt" data-prompt="${text}">${text}</span>`;
}

export function promptsFromBraces(html: string): string {
    return html
        .split(CODE_BLOCK)
        .map((chunk) =>
            chunk.startsWith("<pre")
                ? chunk
                : chunk.replace(BRACES, (_, question: string) => promptSpan(question)),
        )
        .join("");
}

export function stripPrompts(html: string): string {
    return html.replace(PROMPT_SPAN, "").replace(/<p>\s*<\/p>/g, "");
}

const ESCAPES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
};

/**
 * Turn the model's plain prose into the minimal HTML an issue body is stored as.
 *
 * Issue descriptions come from the TipTap editor everywhere else, so they are HTML. The model
 * writes plain text, and storing that raw would render as one unbroken run with any stray angle
 * bracket treated as markup. Blank lines become paragraphs; everything else is escaped.
 *
 * @example
 * to_issue_html("Checkout flakes.\n\nSteps:\n1. Run the suite");
 * // "<p>Checkout flakes.</p><p>Steps:<br />1. Run the suite</p>"
 */
export function to_issue_html(text: string): string {
    return text
        .trim()
        .split(/\n{2,}/)
        .map((paragraph) => {
            const escaped = paragraph.replace(/[&<>]/g, (char) => ESCAPES[char] ?? char);
            return `<p>${escaped.split("\n").join("<br />")}</p>`;
        })
        .join("");
}

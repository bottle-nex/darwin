import sanitizeHtml from "sanitize-html";

const WORDS_PER_MINUTE = 220;

const ALLOWED_TAGS = [
    "p",
    "br",
    "strong",
    "em",
    "s",
    "u",
    "code",
    "pre",
    "blockquote",
    "hr",
    "h1",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "figure",
    "figcaption",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "label",
    "input",
    "div",
    "span",
];

export default class PostContentService {
    static sanitize(html: string): string {
        return sanitizeHtml(html, {
            allowedTags: ALLOWED_TAGS,
            allowedAttributes: {
                a: ["href", "target", "rel"],
                img: ["src", "alt", "title", "width", "height"],
                code: ["class"],
                pre: ["class"],
                div: ["class", "data-type"],
                li: ["class", "data-checked"],
                ul: ["class", "data-type"],
                span: ["class"],
                input: ["type", "checked", "disabled"],
            },
            allowedSchemesByTag: { img: ["http", "https"] },
            transformTags: {
                a: sanitizeHtml.simpleTransform("a", {
                    rel: "noopener noreferrer",
                    target: "_blank",
                }),
                input: sanitizeHtml.simpleTransform("input", { disabled: "disabled" }),
            },
        });
    }

    static to_plain_text(html: string): string {
        return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
            .replace(/\s+/g, " ")
            .trim();
    }

    static reading_time(plainText: string): number {
        const words = plainText.split(/\s+/).filter(Boolean).length;
        return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
    }

    static slugify(value: string): string {
        return value
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80);
    }

    static prepare(html: string) {
        const content = this.sanitize(html);
        const plainText = this.to_plain_text(content);
        return {
            content,
            plainText,
            readingTime: this.reading_time(plainText),
            isEmpty: plainText.length === 0 && !content.includes("<img"),
        };
    }
}

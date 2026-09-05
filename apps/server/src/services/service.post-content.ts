import sanitizeHtml from "sanitize-html";

import {
    BASE_ALLOWED_TAGS,
    SAFE_LINK_ATTRS,
    SAFE_LINK_TRANSFORM,
    TABLE_SPAN_ATTRS,
} from "./service.html-sanitize";

const WORDS_PER_MINUTE = 220;

const POST_TABLE_SPAN_ATTRS = [...TABLE_SPAN_ATTRS, "colwidth"];

const ALLOWED_TAGS = [
    ...BASE_ALLOWED_TAGS,
    "u",
    "figure",
    "figcaption",
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
                a: SAFE_LINK_ATTRS,
                td: POST_TABLE_SPAN_ATTRS,
                th: POST_TABLE_SPAN_ATTRS,
                img: ["src", "alt", "title", "width", "height"],
                code: ["class"],
                pre: ["class"],
                div: ["class", "data-type"],
                figure: ["class", "data-type"],
                figcaption: ["class", "data-type"],
                li: ["class", "data-checked"],
                ul: ["class", "data-type"],
                span: ["class"],
                input: ["type", "checked", "disabled"],
            },
            allowedSchemesByTag: { img: ["http", "https"] },
            transformTags: {
                a: SAFE_LINK_TRANSFORM,
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

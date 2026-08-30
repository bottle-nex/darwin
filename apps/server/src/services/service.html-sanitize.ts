import sanitizeHtml from "sanitize-html";

/**
 * The tags both sanitizers agree on. Each caller spreads this and adds its own,
 * because the two have different threat models: one takes third-party HTML from
 * GitHub, the other takes our own editor's output.
 */
export const BASE_ALLOWED_TAGS = [
    "p",
    "br",
    "strong",
    "em",
    "s",
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
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
];

export const SAFE_LINK_ATTRS = ["href", "target", "rel"];

export const SAFE_LINK_TRANSFORM = sanitizeHtml.simpleTransform("a", {
    rel: "noopener noreferrer",
    target: "_blank",
});

export const TABLE_SPAN_ATTRS = ["colspan", "rowspan"];

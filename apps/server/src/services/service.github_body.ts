import sanitizeHtml from "sanitize-html";

import GithubAppService from "./service.github_app";
import {
    BASE_ALLOWED_TAGS,
    SAFE_LINK_ATTRS,
    SAFE_LINK_TRANSFORM,
    TABLE_SPAN_ATTRS,
} from "./service.html-sanitize";

const ALLOWED_TAGS = [...BASE_ALLOWED_TAGS, "h5", "h6"];

export default class GithubBodyService {
    static sanitize(html: string): string {
        return sanitizeHtml(html, {
            allowedTags: ALLOWED_TAGS,
            allowedAttributes: {
                a: SAFE_LINK_ATTRS,
                img: ["src", "alt", "title"],
                td: TABLE_SPAN_ATTRS,
                th: TABLE_SPAN_ATTRS,
            },
            allowedSchemesByTag: { img: ["http", "https"], a: ["http", "https", "mailto"] },
            transformTags: { a: SAFE_LINK_TRANSFORM },
            exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
        }).trim();
    }

    static async fetch_rendered_body(
        installation_id: number,
        owner: string,
        repo: string,
        issue_number: number,
    ): Promise<string | null> {
        try {
            const octokit = await GithubAppService.octokitFor(installation_id);
            const { data } = await octokit.rest.issues.get({
                owner,
                repo,
                issue_number,
                headers: { accept: "application/vnd.github.full+json" },
            });
            const html = (data as unknown as { body_html?: string }).body_html;
            return html ? this.sanitize(html) : null;
        } catch (error) {
            console.warn(
                `[github-import] could not fetch rendered body for ${owner}/${repo}#${issue_number}:`,
                (error as Error).message,
            );
            return null;
        }
    }
}
